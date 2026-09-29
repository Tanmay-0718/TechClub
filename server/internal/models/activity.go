package models

import "time"

// UserActivity records a single user interaction on the platform
type UserActivity struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	UserName     string    `json:"user_name"`
	UserEmail    string    `json:"user_email"`
	Action       string    `json:"action"` // login, signup, page_view, project_view, project_create, event_register, profile_update
	ResourceType string    `json:"resource_type"` // project, event, page, member
	ResourceID   string    `json:"resource_id"`
	ResourceName string    `json:"resource_name"`
	Metadata     string    `json:"metadata"` // JSON metadata
	IPAddress    string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	CreatedAt    time.Time `json:"created_at"`
}

// UserSession records a user authentication session
type UserSession struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	TokenHash    string     `json:"-"`
	IPAddress    string     `json:"ip_address"`
	UserAgent    string     `json:"user_agent"`
	CreatedAt    time.Time  `json:"created_at"`
	LastActiveAt time.Time  `json:"last_active_at"`
	ExpiredAt    *time.Time `json:"expired_at,omitempty"`
}

// ResourceCount holds frequency aggregates for popular resources
type ResourceCount struct {
	ResourceID   string `json:"resource_id"`
	ResourceName string `json:"resource_name"`
	Count        int    `json:"count"`
}

// ActivitySummary provides high-level platform telemetry for admins
type ActivitySummary struct {
	TotalUsers         int             `json:"total_users"`
	ActiveToday        int             `json:"active_today"`
	NewUsersThisWeek   int             `json:"new_users_this_week"`
	TotalPageViews     int             `json:"total_page_views"`
	TotalRegistrations int             `json:"total_registrations"`
	TotalProjects      int             `json:"total_projects"`
	TopProjects        []ResourceCount `json:"top_projects"`
	TopEvents          []ResourceCount `json:"top_events"`
	RecentActivity     []UserActivity  `json:"recent_activity"`
}
