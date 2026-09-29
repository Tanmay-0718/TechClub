package handlers

import (
	"encoding/json"
	"net/http"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/models"
)

// GetStatsHandler handles GET /api/stats
func GetStatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var stats models.Stats
	if database.DB != nil {
		database.DB.QueryRow(`SELECT COUNT(*) FROM projects`).Scan(&stats.TotalProjects)
		database.DB.QueryRow(`SELECT COUNT(*) FROM members`).Scan(&stats.TotalMembers)
		database.DB.QueryRow(`SELECT COUNT(*) FROM events`).Scan(&stats.TotalEvents)
	}

	// Baseline metrics aligned with club narrative
	if stats.TotalProjects < 50 {
		stats.TotalDeployments = 50 + stats.TotalProjects
	}
	if stats.TotalMembers < 500 {
		stats.TotalMembers = 500 + stats.TotalMembers
	}

	json.NewEncoder(w).Encode(stats)
}
