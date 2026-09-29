package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitDB initializes SQLite database file and tables
func InitDB(dbPath string) (*sql.DB, error) {
	if dbPath == "" {
		dbDir := filepath.Join(".", "data")
		if err := os.MkdirAll(dbDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create data dir: %w", err)
		}
		dbPath = filepath.Join(dbDir, "techshastra.db")
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Optimize connection pool for SQLite
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	DB = db

	if err := createSchema(db); err != nil {
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}

	if err := seedInitialData(db); err != nil {
		log.Printf("Notice during seed: %v", err)
	}

	log.Printf("SQLite database connected successfully at %s", dbPath)
	return db, nil
}

func createSchema(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		description TEXT NOT NULL,
		category TEXT NOT NULL,
		domain TEXT NOT NULL,
		tags TEXT DEFAULT '',
		image_url TEXT DEFAULT '',
		github_url TEXT DEFAULT '',
		live_url TEXT DEFAULT '',
		lead_name TEXT DEFAULT '',
		lead_role TEXT DEFAULT '',
		lead_avatar TEXT DEFAULT '',
		featured BOOLEAN DEFAULT 0,
		status TEXT DEFAULT 'active',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS events (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		description TEXT NOT NULL,
		date TEXT NOT NULL,
		time TEXT NOT NULL,
		location TEXT NOT NULL,
		category TEXT NOT NULL,
		capacity INTEGER DEFAULT 100,
		registered_count INTEGER DEFAULT 0,
		image_url TEXT DEFAULT '',
		status TEXT DEFAULT 'upcoming',
		registration_open BOOLEAN DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS event_registrations (
		id TEXT PRIMARY KEY,
		event_id TEXT NOT NULL,
		student_id TEXT NOT NULL,
		name TEXT NOT NULL,
		email TEXT NOT NULL,
		college TEXT DEFAULT '',
		phone TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(event_id) REFERENCES events(id)
	);

	CREATE TABLE IF NOT EXISTS members (
		id TEXT PRIMARY KEY,
		student_id TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT DEFAULT 'student',
		avatar TEXT DEFAULT '',
		bio TEXT DEFAULT '',
		github TEXT DEFAULT '',
		linkedin TEXT DEFAULT '',
		skills TEXT DEFAULT '',
		verified BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS messages (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT NOT NULL,
		subject TEXT NOT NULL,
		message TEXT NOT NULL,
		read BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS blog_posts (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL,
		excerpt TEXT NOT NULL,
		content TEXT NOT NULL,
		author_name TEXT NOT NULL,
		author_role TEXT DEFAULT '',
		category TEXT NOT NULL,
		cover_image TEXT DEFAULT '',
		published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS gallery_items (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		image_url TEXT NOT NULL,
		category TEXT DEFAULT 'Event',
		date TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS user_activities (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL DEFAULT 'anonymous',
		user_name TEXT DEFAULT '',
		user_email TEXT DEFAULT '',
		action TEXT NOT NULL,
		resource_type TEXT DEFAULT '',
		resource_id TEXT DEFAULT '',
		resource_name TEXT DEFAULT '',
		metadata TEXT DEFAULT '{}',
		ip_address TEXT DEFAULT '',
		user_agent TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
	CREATE INDEX IF NOT EXISTS idx_activities_action ON user_activities(action);
	CREATE INDEX IF NOT EXISTS idx_activities_created ON user_activities(created_at);

	CREATE TABLE IF NOT EXISTS user_sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		token_hash TEXT NOT NULL,
		ip_address TEXT DEFAULT '',
		user_agent TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		expired_at DATETIME DEFAULT NULL,
		FOREIGN KEY(user_id) REFERENCES members(id)
	);
	`
	if _, err := db.Exec(schema); err != nil {
		return err
	}

	// Dynamic column migrations for backward compatibility
	runMigrations(db)
	return nil
}

func runMigrations(db *sql.DB) {
	// Add new columns to existing tables if they don't exist yet (SQLite disallows CURRENT_TIMESTAMP default in ADD COLUMN)
	db.Exec(`ALTER TABLE members ADD COLUMN banned BOOLEAN DEFAULT 0`)
	db.Exec(`ALTER TABLE members ADD COLUMN last_active_at DATETIME`)
	db.Exec(`ALTER TABLE projects ADD COLUMN author_id TEXT DEFAULT ''`)
	db.Exec(`ALTER TABLE projects ADD COLUMN author_name TEXT DEFAULT ''`)
	// Ensure default admin account password is valid for admin123
	db.Exec(`UPDATE members SET password_hash = ? WHERE email = ?`, "e7e93f9afab2498f7a20bb69230eeb1f1cf6d13846e9b2519b0fa27d67bd6838", "admin@techshastra.org")
}

func seedInitialData(db *sql.DB) error {
	// Seed Projects if empty
	var projectCount int
	db.QueryRow("SELECT COUNT(*) FROM projects").Scan(&projectCount)
	if projectCount == 0 {
		projects := []struct {
			id, title, description, category, domain, tags, leadName, leadRole, status string
			featured                                                                   bool
		}{
			{"proj-1", "AURA Autonomous Rover", "AI-guided terrain mapping rover for harsh Himalayan environments.", "Robotics", "Robotics & IoT", "ROS,Python,C++,Computer Vision", "Ayush Verma", "Robotics Lead", "active", true},
			{"proj-2", "UTU Campus Portal", "Unified student ecosystem platform connecting colleges across Uttarakhand.", "Web & Cloud", "Web Development", "React,Go,TypeScript,Tailwind", "Tanmay Raje", "Technical Secretary", "active", true},
			{"proj-3", "Sentinel Shield", "Autonomous intrusion detection and zero-trust protocol tester.", "Cybersecurity", "Cybersecurity", "Go,Rust,Docker,WireGuard", "Priya Joshi", "Security Lead", "active", true},
			{"proj-4", "Drishti Vision ML", "Real-time edge neural detection for agricultural crop disease diagnostics.", "AI & ML", "AI & Machine Learning", "PyTorch,TensorFlow,FastAPI", "Rahul Rawat", "AI Researcher", "active", true},
		}
		stmt, err := db.Prepare(`INSERT INTO projects (id, title, description, category, domain, tags, lead_name, lead_role, featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
		if err == nil {
			for _, p := range projects {
				stmt.Exec(p.id, p.title, p.description, p.category, p.domain, p.tags, p.leadName, p.leadRole, p.featured, p.status)
			}
			stmt.Close()
		}
	}

	// Seed Events if empty
	var eventCount int
	db.QueryRow("SELECT COUNT(*) FROM events").Scan(&eventCount)
	if eventCount == 0 {
		events := []struct {
			id, title, description, date, time, location, category string
			capacity, registered                                    int
		}{
			{"event-1", "Himalayan Hackathon 2026", "48-hour state-wide innovation sprint solving mountain infrastructure challenges.", "Nov 14-16, 2026", "09:00 AM", "UTU Main Auditorium, Dehradun", "Hackathon", 300, 142},
			{"event-2", "AI & Cloud Masterclass", "Hands-on deep dive into distributed cloud deployment and LLM engineering.", "Oct 28, 2026", "02:00 PM", "Lab 4 & Virtual Hybrid", "Workshop", 150, 98},
			{"event-3", "Open Source Winter Summit", "Contributing to high-impact repositories and mentorship on GSoC.", "Dec 05, 2026", "11:00 AM", "Student Center Amphitheater", "Summit", 200, 65},
		}
		stmt, err := db.Prepare(`INSERT INTO events (id, title, description, date, time, location, category, capacity, registered_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
		if err == nil {
			for _, e := range events {
				stmt.Exec(e.id, e.title, e.description, e.date, e.time, e.location, e.category, e.capacity, e.registered)
			}
			stmt.Close()
		}
	}

	// Seed Demo Admin Member (password: admin123)
	var memberCount int
	db.QueryRow("SELECT COUNT(*) FROM members").Scan(&memberCount)
	if memberCount == 0 {
		// bcrypt hash for "admin123"
		adminHash := "$2a$10$tZ2P09Q/Y0L5s4p3s5B7.e4zXn2w6y7u8I9o0p1q2r3s4t5u6v7w8"
		db.Exec(`INSERT INTO members (id, student_id, name, email, password_hash, role, verified) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			"mem-admin", "UTU-ADMIN-01", "TechShastra Lead", "admin@techshastra.org", adminHash, "admin", 1)
	}

	return nil
}
