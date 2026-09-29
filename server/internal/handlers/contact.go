package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/models"
)

// ContactHandler handles POST /api/contact
func ContactHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var msg models.ContactMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if msg.Name == "" || msg.Email == "" || msg.Message == "" {
		http.Error(w, `{"error":"name, email, and message are required"}`, http.StatusBadRequest)
		return
	}

	msg.ID = randomID("msg")
	msg.CreatedAt = time.Now()
	msg.Read = false

	_, err := database.DB.Exec(`INSERT INTO messages (id, name, email, subject, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		msg.ID, msg.Name, msg.Email, msg.Subject, msg.Message, msg.Read, msg.CreatedAt)

	if err != nil {
		http.Error(w, `{"error":"failed to save message"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Thank you! Your message has been received.",
		"id":      msg.ID,
	})
}

// GetMessagesHandler handles GET /api/messages (admin)
func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := database.DB.Query(`SELECT id, name, email, subject, message, read, created_at FROM messages ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, `{"error":"failed to query messages"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	messages := make([]models.ContactMessage, 0)
	for rows.Next() {
		var m models.ContactMessage
		if err := rows.Scan(&m.ID, &m.Name, &m.Email, &m.Subject, &m.Message, &m.Read, &m.CreatedAt); err != nil {
			continue
		}
		messages = append(messages, m)
	}

	json.NewEncoder(w).Encode(messages)
}
