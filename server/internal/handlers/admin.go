package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/middleware"
	"techshastra-backend/internal/models"
)

type UpdateRolePayload struct {
	Role string `json:"role"`
}

type ToggleBanPayload struct {
	Banned bool `json:"banned"`
}

// GetMembersHandler handles GET /api/admin/members
func GetMembersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	roleFilter := r.URL.Query().Get("role")

	page := 1
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	limit := 25
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	offset := (page - 1) * limit

	query := `SELECT id, student_id, name, email, role, avatar, bio, github, linkedin, skills, verified, banned, last_active_at, created_at FROM members WHERE 1=1`
	var args []interface{}

	if roleFilter != "" {
		query += " AND role = ?"
		args = append(args, roleFilter)
	}
	if q != "" {
		query += " AND (name LIKE ? OR email LIKE ? OR student_id LIKE ?)"
		pattern := "%" + q + "%"
		args = append(args, pattern, pattern, pattern)
	}

	countQuery := strings.Replace(query, "SELECT id, student_id, name, email, role, avatar, bio, github, linkedin, skills, verified, banned, last_active_at, created_at", "SELECT COUNT(*)", 1)
	var total int
	database.DB.QueryRow(countQuery, args...).Scan(&total)

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, `{"error":"failed to query members"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	members := make([]models.Member, 0)
	for rows.Next() {
		var m models.Member
		var avatar, bio, github, linkedin, skills sql.NullString
		var lastActive sql.NullTime
		err := rows.Scan(&m.ID, &m.StudentID, &m.Name, &m.Email, &m.Role, &avatar, &bio, &github, &linkedin, &skills, &m.Verified, &m.Banned, &lastActive, &m.CreatedAt)
		if err != nil {
			continue
		}
		m.Avatar = avatar.String
		m.Bio = bio.String
		m.Github = github.String
		m.Linkedin = linkedin.String
		m.Skills = skills.String
		if lastActive.Valid {
			m.LastActiveAt = lastActive.Time
		}
		members = append(members, m)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"members": members,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

// GetMemberDetailHandler handles GET /api/admin/members/{id}
func GetMemberDetailHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	id := strings.TrimPrefix(r.URL.Path, "/api/admin/members/")
	if id == "" {
		http.Error(w, `{"error":"member id required"}`, http.StatusBadRequest)
		return
	}

	var m models.Member
	var avatar, bio, github, linkedin, skills sql.NullString
	var lastActive sql.NullTime

	err := database.DB.QueryRow(`SELECT id, student_id, name, email, role, avatar, bio, github, linkedin, skills, verified, banned, last_active_at, created_at FROM members WHERE id = ?`, id).
		Scan(&m.ID, &m.StudentID, &m.Name, &m.Email, &m.Role, &avatar, &bio, &github, &linkedin, &skills, &m.Verified, &m.Banned, &lastActive, &m.CreatedAt)

	if err == sql.ErrNoRows {
		http.Error(w, `{"error":"member not found"}`, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}

	m.Avatar = avatar.String
	m.Bio = bio.String
	m.Github = github.String
	m.Linkedin = linkedin.String
	m.Skills = skills.String
	if lastActive.Valid {
		m.LastActiveAt = lastActive.Time
	}

	// Fetch telemetry stats
	var activityCount, registrationCount, projectCount int
	database.DB.QueryRow(`SELECT COUNT(*) FROM user_activities WHERE user_id = ?`, id).Scan(&activityCount)
	database.DB.QueryRow(`SELECT COUNT(*) FROM event_registrations WHERE student_id = ? OR email = ?`, m.StudentID, m.Email).Scan(&registrationCount)
	database.DB.QueryRow(`SELECT COUNT(*) FROM projects WHERE author_id = ?`, id).Scan(&projectCount)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"member":             m,
		"activity_count":     activityCount,
		"registration_count": registrationCount,
		"projects_count":     projectCount,
	})
}

// UpdateMemberRoleHandler handles PUT /api/admin/members/{id}/role
func UpdateMemberRoleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 4 {
		http.Error(w, `{"error":"invalid path"}`, http.StatusBadRequest)
		return
	}
	id := pathParts[3]

	var p UpdateRolePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	p.Role = strings.ToLower(strings.TrimSpace(p.Role))
	validRoles := map[string]bool{"admin": true, "core": true, "lead": true, "student": true}
	if !validRoles[p.Role] {
		http.Error(w, `{"error":"role must be student, lead, core, or admin"}`, http.StatusBadRequest)
		return
	}

	res, err := database.DB.Exec(`UPDATE members SET role = ? WHERE id = ?`, p.Role, id)
	if err != nil {
		http.Error(w, `{"error":"failed to update role"}`, http.StatusInternalServerError)
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		http.Error(w, `{"error":"member not found"}`, http.StatusNotFound)
		return
	}

	adminID := middleware.GetUserID(r)
	LogInternalActivity(adminID, "Admin", middleware.GetUserEmail(r), "admin_role_change", "member", id, p.Role, `{"new_role":"`+p.Role+`"}`, r)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Role updated successfully",
		"role":    p.Role,
	})
}

// ToggleMemberBanHandler handles PUT /api/admin/members/{id}/ban
func ToggleMemberBanHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 4 {
		http.Error(w, `{"error":"invalid path"}`, http.StatusBadRequest)
		return
	}
	id := pathParts[3]

	var p ToggleBanPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	res, err := database.DB.Exec(`UPDATE members SET banned = ? WHERE id = ?`, p.Banned, id)
	if err != nil {
		http.Error(w, `{"error":"failed to update ban status"}`, http.StatusInternalServerError)
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		http.Error(w, `{"error":"member not found"}`, http.StatusNotFound)
		return
	}

	action := "admin_unban_user"
	if p.Banned {
		action = "admin_ban_user"
	}
	adminID := middleware.GetUserID(r)
	LogInternalActivity(adminID, "Admin", middleware.GetUserEmail(r), action, "member", id, "", `{}`, r)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"banned":  p.Banned,
		"message": "Member status updated successfully",
	})
}

// GetAdminDashboardHandler handles GET /api/admin/dashboard
func GetAdminDashboardHandler(w http.ResponseWriter, r *http.Request) {
	GetActivitySummaryHandler(w, r)
}

// GetEventRegistrationsHandler handles GET /api/admin/event-registrations/{event_id}
func GetEventRegistrationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	eventID := strings.TrimPrefix(r.URL.Path, "/api/admin/event-registrations/")

	query := `SELECT id, event_id, student_id, name, email, college, phone, created_at FROM event_registrations`
	var args []interface{}
	if eventID != "" && eventID != "all" {
		query += ` WHERE event_id = ?`
		args = append(args, eventID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, `{"error":"failed to query registrations"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	registrations := make([]models.EventRegistration, 0)
	for rows.Next() {
		var reg models.EventRegistration
		var college, phone sql.NullString
		if err := rows.Scan(&reg.ID, &reg.EventID, &reg.StudentID, &reg.Name, &reg.Email, &college, &phone, &reg.CreatedAt); err == nil {
			reg.College = college.String
			reg.Phone = phone.String
			registrations = append(registrations, reg)
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"registrations": registrations,
		"total":         len(registrations),
	})
}
