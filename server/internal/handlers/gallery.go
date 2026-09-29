package handlers

import (
	"encoding/json"
	"net/http"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/models"
)

// GetGalleryHandler handles GET /api/gallery
func GetGalleryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := database.DB.Query(`SELECT id, title, image_url, category, date, created_at FROM gallery_items ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, `{"error":"failed to query gallery"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := make([]models.GalleryItem, 0)
	for rows.Next() {
		var g models.GalleryItem
		if err := rows.Scan(&g.ID, &g.Title, &g.ImageURL, &g.Category, &g.Date, &g.CreatedAt); err != nil {
			continue
		}
		items = append(items, g)
	}

	json.NewEncoder(w).Encode(items)
}
