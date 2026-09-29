package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/middleware"
	"techshastra-backend/internal/models"
)

type LogActivityPayload struct {
	Action       string `json:"action"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	ResourceName string `json:"resource_name"`
	Metadata     string `json:"metadata"`
}

// Helper to extract IP
func getClientIP(r *http.Request) string {
	if r == nil {
		return ""
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	return r.RemoteAddr
}

// LogInternalActivity records an activity entry directly from backend logic
func LogInternalActivity(userID, userName, userEmail, action, resType, resID, resName, metadata string, r *http.Request) {
	if database.DB == nil {
		return
	}
	id := randomID("act")
	ip := getClientIP(r)
	ua := ""
	if r != nil {
		ua = r.UserAgent()
	}
	if metadata == "" {
		metadata = "{}"
	}

	go func() {
		database.DB.Exec(`INSERT INTO user_activities (id, user_id, user_name, user_email, action, resource_type, resource_id, resource_name, metadata, ip_address, user_agent, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			id, userID, userName, userEmail, action, resType, resID, resName, metadata, ip, ua, time.Now())
	}()
}

// LogActivityHandler handles POST /api/activity (frontend client telemetry)
func LogActivityHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var p LogActivityPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if p.Action == "" {
		http.Error(w, `{"error":"action is required"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)
	userEmail := middleware.GetUserEmail(r)
	userName := ""

	if userID == "" {
		userID = "anonymous"
	} else {
		// Lookup name
		database.DB.QueryRow(`SELECT name FROM members WHERE id = ?`, userID).Scan(&userName)
		database.DB.Exec(`UPDATE members SET last_active_at = ? WHERE id = ?`, time.Now(), userID)
	}

	LogInternalActivity(userID, userName, userEmail, p.Action, p.ResourceType, p.ResourceID, p.ResourceName, p.Metadata, r)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

// GetActivityFeedHandler handles GET /api/admin/activity
func GetActivityFeedHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	userFilter := r.URL.Query().Get("user_id")
	actionFilter := r.URL.Query().Get("action")
	q := r.URL.Query().Get("q")

	page := 1
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	limit := 50
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 200 {
		limit = l
	}
	offset := (page - 1) * limit

	query := `SELECT id, user_id, user_name, user_email, action, resource_type, resource_id, resource_name, metadata, ip_address, user_agent, created_at FROM user_activities WHERE 1=1`
	var args []interface{}

	if userFilter != "" {
		query += " AND user_id = ?"
		args = append(args, userFilter)
	}
	if actionFilter != "" {
		query += " AND action = ?"
		args = append(args, actionFilter)
	}
	if q != "" {
		query += " AND (user_name LIKE ? OR user_email LIKE ? OR resource_name LIKE ? OR action LIKE ?)"
		pattern := "%" + q + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}

	countQuery := strings.Replace(query, "SELECT id, user_id, user_name, user_email, action, resource_type, resource_id, resource_name, metadata, ip_address, user_agent, created_at", "SELECT COUNT(*)", 1)
	var total int
	database.DB.QueryRow(countQuery, args...).Scan(&total)

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, `{"error":"failed to query activities"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	activities := make([]models.UserActivity, 0)
	for rows.Next() {
		var a models.UserActivity
		var uname, uemail, resType, resID, resName, meta, ip, ua sql.NullString
		err := rows.Scan(&a.ID, &a.UserID, &uname, &uemail, &a.Action, &resType, &resID, &resName, &meta, &ip, &ua, &a.CreatedAt)
		if err != nil {
			continue
		}
		a.UserName = uname.String
		a.UserEmail = uemail.String
		a.ResourceType = resType.String
		a.ResourceID = resID.String
		a.ResourceName = resName.String
		a.Metadata = meta.String
		a.IPAddress = ip.String
		a.UserAgent = ua.String
		activities = append(activities, a)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"activities": activities,
		"total":      total,
		"page":       page,
		"limit":      limit,
	})
}

// GetActivitySummaryHandler handles GET /api/admin/activity/summary
func GetActivitySummaryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var summary models.ActivitySummary
	summary.TopProjects = make([]models.ResourceCount, 0)
	summary.TopEvents = make([]models.ResourceCount, 0)
	summary.RecentActivity = make([]models.UserActivity, 0)

	if database.DB != nil {
		database.DB.QueryRow(`SELECT COUNT(*) FROM members`).Scan(&summary.TotalUsers)
		database.DB.QueryRow(`SELECT COUNT(DISTINCT user_id) FROM user_activities WHERE created_at >= date('now', 'start of day') AND user_id != 'anonymous'`).Scan(&summary.ActiveToday)
		database.DB.QueryRow(`SELECT COUNT(*) FROM members WHERE created_at >= datetime('now', '-7 days')`).Scan(&summary.NewUsersThisWeek)
		database.DB.QueryRow(`SELECT COUNT(*) FROM user_activities WHERE action = 'page_view'`).Scan(&summary.TotalPageViews)
		database.DB.QueryRow(`SELECT COUNT(*) FROM event_registrations`).Scan(&summary.TotalRegistrations)
		database.DB.QueryRow(`SELECT COUNT(*) FROM projects`).Scan(&summary.TotalProjects)

		// Top Projects
		projRows, err := database.DB.Query(`SELECT resource_id, resource_name, COUNT(*) as c FROM user_activities WHERE resource_type = 'project' AND resource_id != '' GROUP BY resource_id ORDER BY c DESC LIMIT 5`)
		if err == nil {
			defer projRows.Close()
			for projRows.Next() {
				var rc models.ResourceCount
				if err := projRows.Scan(&rc.ResourceID, &rc.ResourceName, &rc.Count); err == nil {
					summary.TopProjects = append(summary.TopProjects, rc)
				}
			}
		}

		// Top Events
		eventRows, err := database.DB.Query(`SELECT resource_id, resource_name, COUNT(*) as c FROM user_activities WHERE resource_type = 'event' AND resource_id != '' GROUP BY resource_id ORDER BY c DESC LIMIT 5`)
		if err == nil {
			defer eventRows.Close()
			for eventRows.Next() {
				var rc models.ResourceCount
				if err := eventRows.Scan(&rc.ResourceID, &rc.ResourceName, &rc.Count); err == nil {
					summary.TopEvents = append(summary.TopEvents, rc)
				}
			}
		}

		// Recent 10 activities
		recentRows, err := database.DB.Query(`SELECT id, user_id, user_name, user_email, action, resource_type, resource_id, resource_name, metadata, ip_address, user_agent, created_at FROM user_activities ORDER BY created_at DESC LIMIT 10`)
		if err == nil {
			defer recentRows.Close()
			for recentRows.Next() {
				var a models.UserActivity
				var uname, uemail, resType, resID, resName, meta, ip, ua sql.NullString
				if err := recentRows.Scan(&a.ID, &a.UserID, &uname, &uemail, &a.Action, &resType, &resID, &resName, &meta, &ip, &ua, &a.CreatedAt); err == nil {
					a.UserName = uname.String
					a.UserEmail = uemail.String
					a.ResourceType = resType.String
					a.ResourceID = resID.String
					a.ResourceName = resName.String
					a.Metadata = meta.String
					a.IPAddress = ip.String
					a.UserAgent = ua.String
					summary.RecentActivity = append(summary.RecentActivity, a)
				}
			}
		}
	}

	json.NewEncoder(w).Encode(summary)
}

// GetUserActivityHandler handles GET /api/admin/users/{id}/activity
func GetUserActivityHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/admin/users/"), "/activity")

	rows, err := database.DB.Query(`SELECT id, user_id, user_name, user_email, action, resource_type, resource_id, resource_name, metadata, ip_address, user_agent, created_at FROM user_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`, userID)
	if err != nil {
		http.Error(w, `{"error":"failed to query user activity"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	activities := make([]models.UserActivity, 0)
	for rows.Next() {
		var a models.UserActivity
		var uname, uemail, resType, resID, resName, meta, ip, ua sql.NullString
		if err := rows.Scan(&a.ID, &a.UserID, &uname, &uemail, &a.Action, &resType, &resID, &resName, &meta, &ip, &ua, &a.CreatedAt); err == nil {
			a.UserName = uname.String
			a.UserEmail = uemail.String
			a.ResourceType = resType.String
			a.ResourceID = resID.String
			a.ResourceName = resName.String
			a.Metadata = meta.String
			a.IPAddress = ip.String
			a.UserAgent = ua.String
			activities = append(activities, a)
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id":    userID,
		"activities": activities,
	})
}
