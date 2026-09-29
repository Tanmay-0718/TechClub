package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/middleware"
	"techshastra-backend/internal/models"
)

// GetEventsHandler handles GET /api/events
func GetEventsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := database.DB.Query(`SELECT id, title, description, date, time, location, category, capacity, registered_count, image_url, status, registration_open, created_at FROM events ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, `{"error":"failed to query events"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	events := make([]models.Event, 0)
	for rows.Next() {
		var e models.Event
		var img sql.NullString
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.Date, &e.Time, &e.Location, &e.Category, &e.Capacity, &e.RegisteredCount, &img, &e.Status, &e.RegistrationOpen, &e.CreatedAt)
		if err != nil {
			continue
		}
		e.ImageURL = img.String
		e.EventDate = e.Date
		e.MaxAttendees = e.Capacity
		events = append(events, e)
	}

	json.NewEncoder(w).Encode(events)
}

// GetEventByIDHandler handles GET /api/events/{id}
func GetEventByIDHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	id := strings.TrimPrefix(r.URL.Path, "/api/events/")

	var e models.Event
	var img sql.NullString
	err := database.DB.QueryRow(`SELECT id, title, description, date, time, location, category, capacity, registered_count, image_url, status, registration_open, created_at FROM events WHERE id = ?`, id).
		Scan(&e.ID, &e.Title, &e.Description, &e.Date, &e.Time, &e.Location, &e.Category, &e.Capacity, &e.RegisteredCount, &img, &e.Status, &e.RegistrationOpen, &e.CreatedAt)

	if err == sql.ErrNoRows {
		http.Error(w, `{"error":"event not found"}`, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}
	e.ImageURL = img.String
	e.EventDate = e.Date
	e.MaxAttendees = e.Capacity

	// Record event view activity
	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous"
	}
	LogInternalActivity(userID, "", middleware.GetUserEmail(r), "event_view", "event", e.ID, e.Title, `{}`, r)

	json.NewEncoder(w).Encode(e)
}

// RegisterEventRegistrationHandler handles POST /api/events/register
func RegisterEventRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var reg models.EventRegistration
	if err := json.NewDecoder(r.Body).Decode(&reg); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if reg.EventID == "" || reg.Email == "" || reg.Name == "" {
		http.Error(w, `{"error":"event_id, email, and name are required"}`, http.StatusBadRequest)
		return
	}

	reg.ID = randomID("reg")
	reg.CreatedAt = time.Now()

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec(`INSERT INTO event_registrations (id, event_id, student_id, name, email, college, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		reg.ID, reg.EventID, reg.StudentID, reg.Name, reg.Email, reg.College, reg.Phone, reg.CreatedAt)
	if err != nil {
		http.Error(w, `{"error":"failed to register"}`, http.StatusInternalServerError)
		return
	}

	// Increment registered_count
	_, err = tx.Exec(`UPDATE events SET registered_count = registered_count + 1 WHERE id = ?`, reg.EventID)
	if err != nil {
		http.Error(w, `{"error":"failed to update event counter"}`, http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, `{"error":"failed to commit registration"}`, http.StatusInternalServerError)
		return
	}

	// Fetch event title for telemetry
	var eventTitle string
	database.DB.QueryRow(`SELECT title FROM events WHERE id = ?`, reg.EventID).Scan(&eventTitle)
	LogInternalActivity(reg.StudentID, reg.Name, reg.Email, "event_register", "event", reg.EventID, eventTitle, `{"college":"`+reg.College+`"}`, r)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":      true,
		"message":      "Successfully registered for event!",
		"registration": reg,
	})
}
