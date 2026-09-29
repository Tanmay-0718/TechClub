package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"techshastra-backend/internal/database"
)

var startTime = time.Now()

// HealthResponse represents system health metadata
type HealthResponse struct {
	Status    string    `json:"status"`
	Message   string    `json:"message"`
	Database  string    `json:"database"`
	UptimeSec int64     `json:"uptime_seconds"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	dbStatus := "healthy"
	if database.DB == nil || database.DB.Ping() != nil {
		dbStatus = "degraded"
	}

	resp := HealthResponse{
		Status:    "online",
		Message:   "TechShastra Go API Backend is running",
		Database:  dbStatus,
		UptimeSec: int64(time.Since(startTime).Seconds()),
		Timestamp: time.Now(),
		Version:   "1.0.0-go",
	}

	json.NewEncoder(w).Encode(resp)
}
