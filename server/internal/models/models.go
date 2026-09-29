package models

import "time"

// Project represents a club project
type Project struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Domain      string    `json:"domain"`
	Tags        string    `json:"tags"` // JSON string or comma-separated
	ImageURL    string    `json:"image_url"`
	GithubURL   string    `json:"github_url"`
	LiveURL     string    `json:"live_url"`
	LeadName    string    `json:"lead_name"`
	LeadRole    string    `json:"lead_role"`
	LeadAvatar  string    `json:"lead_avatar"`
	AuthorID    string    `json:"author_id"`
	AuthorName  string    `json:"author_name"`
	Featured    bool      `json:"featured"`
	Status      string    `json:"status"` // active, completed, upcoming
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Event represents an event/hackathon organized by TechShastra
type Event struct {
	ID               string    `json:"id"`
	Title            string    `json:"title"`
	Description      string    `json:"description"`
	Date             string    `json:"date"`
	EventDate        string    `json:"event_date"`
	Time             string    `json:"time"`
	Location         string    `json:"location"`
	Category         string    `json:"category"`
	Capacity         int       `json:"capacity"`
	MaxAttendees     int       `json:"max_attendees"`
	RegisteredCount  int       `json:"registered_count"`
	ImageURL         string    `json:"image_url"`
	Status           string    `json:"status"` // upcoming, past, ongoing
	RegistrationOpen bool      `json:"registration_open"`
	CreatedAt        time.Time `json:"created_at"`
}

// EventRegistration represents a student registration for an event
type EventRegistration struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	StudentID string    `json:"student_id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	College   string    `json:"college"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
}

// Member represents a student or team member account
type Member struct {
	ID           string    `json:"id"`
	StudentID    string    `json:"student_id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"` // student, lead, core, admin
	Avatar       string    `json:"avatar"`
	Bio          string    `json:"bio"`
	Github       string    `json:"github"`
	Linkedin     string    `json:"linkedin"`
	Skills       string    `json:"skills"` // comma-separated
	Verified     bool      `json:"verified"`
	Banned       bool      `json:"banned"`
	LastActiveAt time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
}

// ContactMessage represents a message sent from the contact form
type ContactMessage struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"created_at"`
}

// BlogPost represents a publication/article
type BlogPost struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Excerpt     string    `json:"excerpt"`
	Content     string    `json:"content"`
	AuthorName  string    `json:"author_name"`
	AuthorRole  string    `json:"author_role"`
	Category    string    `json:"category"`
	CoverImage  string    `json:"cover_image"`
	PublishedAt time.Time `json:"published_at"`
	CreatedAt   time.Time `json:"created_at"`
}

// GalleryItem represents an image in the Moments Captured stream
type GalleryItem struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	ImageURL  string    `json:"image_url"`
	Category  string    `json:"category"`
	Date      string    `json:"date"`
	CreatedAt time.Time `json:"created_at"`
}

// Stats represents overall club metrics
type Stats struct {
	TotalProjects  int `json:"total_projects"`
	TotalMembers   int `json:"total_members"`
	TotalEvents    int `json:"total_events"`
	TotalDeployments int `json:"total_deployments"`
}
