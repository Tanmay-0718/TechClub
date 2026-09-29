package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"techshastra-backend/internal/database"
	"techshastra-backend/internal/handlers"
	"techshastra-backend/internal/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	// 1. Initialize SQLite / Cloud Database
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = os.Getenv("DATABASE_PATH")
	}
	_, err := database.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.DB.Close()

	// 2. Set up HTTP Router
	mux := http.NewServeMux()

	// Helper for admin-only routes
	adminOnly := func(h http.HandlerFunc) http.Handler {
		return middleware.RequireAuth(middleware.RequireRole("admin", "core")(h))
	}

	// Health & Stats
	mux.HandleFunc("/api/health", handlers.HealthHandler)
	mux.HandleFunc("/api/stats", handlers.GetStatsHandler)

	// Projects (Members and visitors can view, authenticated members can upload/create)
	mux.Handle("/api/projects", middleware.OptionalAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.CreateProjectHandler(w, r)
		} else {
			handlers.GetProjectsHandler(w, r)
		}
	})))
	mux.Handle("/api/projects/", middleware.OptionalAuth(http.HandlerFunc(handlers.GetProjectByIDHandler)))

	// Events & Registration
	mux.HandleFunc("/api/events", handlers.GetEventsHandler)
	mux.Handle("/api/events/register", middleware.OptionalAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RegisterEventRegistrationHandler(w, r)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})))
	mux.Handle("/api/events/", middleware.OptionalAuth(http.HandlerFunc(handlers.GetEventByIDHandler)))

	// Authentication & Member profiles
	mux.HandleFunc("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RegisterHandler(w, r)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.LoginHandler(w, r)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})
	mux.Handle("/api/auth/me", middleware.OptionalAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			handlers.UpdateProfileHandler(w, r)
		} else {
			handlers.MeHandler(w, r)
		}
	})))
	mux.Handle("/api/auth/password", middleware.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			handlers.ChangePasswordHandler(w, r)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})))

	// User Activity Tracking (Called by client on page views, actions)
	mux.Handle("/api/activity", middleware.OptionalAuth(http.HandlerFunc(handlers.LogActivityHandler)))

	// Admin Monitoring & Management Endpoints
	mux.Handle("/api/admin/dashboard", adminOnly(handlers.GetAdminDashboardHandler))
	mux.Handle("/api/admin/activity", adminOnly(handlers.GetActivityFeedHandler))
	mux.Handle("/api/admin/activity/summary", adminOnly(handlers.GetActivitySummaryHandler))
	mux.Handle("/api/admin/users/", adminOnly(handlers.GetUserActivityHandler))
	mux.Handle("/api/admin/event-registrations/", adminOnly(handlers.GetEventRegistrationsHandler))

	mux.Handle("/api/admin/members", adminOnly(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetMembersHandler(w, r)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	}))

	mux.Handle("/api/admin/members/", adminOnly(func(w http.ResponseWriter, r *http.Request) {
		path := strings.Trim(r.URL.Path, "/")
		parts := strings.Split(path, "/")
		if len(parts) >= 4 {
			action := parts[len(parts)-1]
			if action == "role" && r.Method == http.MethodPut {
				handlers.UpdateMemberRoleHandler(w, r)
				return
			}
			if action == "ban" && r.Method == http.MethodPut {
				handlers.ToggleMemberBanHandler(w, r)
				return
			}
		}
		if r.Method == http.MethodGet {
			handlers.GetMemberDetailHandler(w, r)
		} else {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	}))

	// Contact inquiries
	mux.HandleFunc("/api/contact", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.ContactHandler(w, r)
		} else {
			handlers.GetMessagesHandler(w, r)
		}
	})

	// Gallery
	mux.HandleFunc("/api/gallery", handlers.GetGalleryHandler)

	// 3. Wrap with Middleware
	handler := middleware.EnableCORS(mux)

	log.Printf("TechShastra Go REST API Server listening on port :%s (http://localhost:%s)", port, port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server exited unexpectedly: %v", err)
	}
}
