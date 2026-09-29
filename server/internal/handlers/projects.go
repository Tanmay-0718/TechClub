package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/middleware"
	"techshastra-backend/internal/models"
)

func randomID(prefix string) string {
	b := make([]byte, 8)
	rand.Read(b)
	return prefix + "-" + hex.EncodeToString(b)
}

// GetProjectsHandler handles GET /api/projects
func GetProjectsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	category := r.URL.Query().Get("category")
	domain := r.URL.Query().Get("domain")
	featuredStr := r.URL.Query().Get("featured")
	authorID := r.URL.Query().Get("author_id")

	query := `SELECT id, title, description, category, domain, tags, image_url, github_url, live_url, lead_name, lead_role, lead_avatar, author_id, author_name, featured, status, created_at, updated_at FROM projects WHERE 1=1`
	var args []interface{}

	if category != "" && category != "All" {
		query += " AND category = ?"
		args = append(args, category)
	}
	if domain != "" && domain != "All" {
		query += " AND domain = ?"
		args = append(args, domain)
	}
	if authorID != "" {
		query += " AND author_id = ?"
		args = append(args, authorID)
	}
	if featuredStr == "true" {
		query += " AND featured = 1"
	}
	query += " ORDER BY created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, `{"error":"failed to query projects"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	projects := make([]models.Project, 0)
	for rows.Next() {
		var p models.Project
		var tags, img, gh, live, leadName, leadRole, leadAvatar, authID, authName sql.NullString
		err := rows.Scan(&p.ID, &p.Title, &p.Description, &p.Category, &p.Domain, &tags, &img, &gh, &live, &leadName, &leadRole, &leadAvatar, &authID, &authName, &p.Featured, &p.Status, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			continue
		}
		p.Tags = tags.String
		p.ImageURL = img.String
		p.GithubURL = gh.String
		p.LiveURL = live.String
		p.LeadName = leadName.String
		p.LeadRole = leadRole.String
		p.LeadAvatar = leadAvatar.String
		p.AuthorID = authID.String
		p.AuthorName = authName.String
		projects = append(projects, p)
	}

	json.NewEncoder(w).Encode(projects)
}

// GetProjectByIDHandler handles GET /api/projects/{id}
func GetProjectByIDHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	id := strings.TrimPrefix(r.URL.Path, "/api/projects/")

	var p models.Project
	var tags, img, gh, live, leadName, leadRole, leadAvatar, authID, authName sql.NullString

	err := database.DB.QueryRow(`SELECT id, title, description, category, domain, tags, image_url, github_url, live_url, lead_name, lead_role, lead_avatar, author_id, author_name, featured, status, created_at, updated_at FROM projects WHERE id = ?`, id).
		Scan(&p.ID, &p.Title, &p.Description, &p.Category, &p.Domain, &tags, &img, &gh, &live, &leadName, &leadRole, &leadAvatar, &authID, &authName, &p.Featured, &p.Status, &p.CreatedAt, &p.UpdatedAt)

	if err == sql.ErrNoRows {
		http.Error(w, `{"error":"project not found"}`, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}

	p.Tags = tags.String
	p.ImageURL = img.String
	p.GithubURL = gh.String
	p.LiveURL = live.String
	p.LeadName = leadName.String
	p.LeadRole = leadRole.String
	p.LeadAvatar = leadAvatar.String
	p.AuthorID = authID.String
	p.AuthorName = authName.String

	// Record project view activity asynchronously
	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous"
	}
	LogInternalActivity(userID, "", middleware.GetUserEmail(r), "project_view", "project", p.ID, p.Title, `{}`, r)

	json.NewEncoder(w).Encode(p)
}

// CreateProjectHandler handles POST /api/projects
func CreateProjectHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var p models.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	p.Title = strings.TrimSpace(p.Title)
	p.Description = strings.TrimSpace(p.Description)
	if p.Title == "" || p.Description == "" {
		http.Error(w, `{"error":"title and description are required"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)
	if userID != "" && p.AuthorID == "" {
		p.AuthorID = userID
		var memberName string
		database.DB.QueryRow(`SELECT name FROM members WHERE id = ?`, userID).Scan(&memberName)
		if memberName != "" {
			p.AuthorName = memberName
			if p.LeadName == "" {
				p.LeadName = memberName
			}
		}
	}

	if p.ID == "" {
		p.ID = randomID("proj")
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	if p.Status == "" {
		p.Status = "active"
	}
	if p.Category == "" {
		p.Category = "Software"
	}
	if p.Domain == "" {
		p.Domain = "Web & Cloud"
	}

	_, err := database.DB.Exec(`INSERT INTO projects (id, title, description, category, domain, tags, image_url, github_url, live_url, lead_name, lead_role, lead_avatar, author_id, author_name, featured, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.Title, p.Description, p.Category, p.Domain, p.Tags, p.ImageURL, p.GithubURL, p.LiveURL, p.LeadName, p.LeadRole, p.LeadAvatar, p.AuthorID, p.AuthorName, p.Featured, p.Status, p.CreatedAt, p.UpdatedAt)

	if err != nil {
		http.Error(w, `{"error":"failed to create project"}`, http.StatusInternalServerError)
		return
	}

	// Record project creation activity
	LogInternalActivity(p.AuthorID, p.AuthorName, middleware.GetUserEmail(r), "project_create", "project", p.ID, p.Title, `{}`, r)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}
