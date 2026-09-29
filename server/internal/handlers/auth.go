package handlers

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"techshastra-backend/internal/auth"
	"techshastra-backend/internal/database"
	"techshastra-backend/internal/middleware"
	"techshastra-backend/internal/models"
)

type RegisterPayload struct {
	StudentID string `json:"student_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Role      string `json:"role"`
	Bio       string `json:"bio"`
	Github    string `json:"github"`
	Linkedin  string `json:"linkedin"`
	Skills    string `json:"skills"`
}

type LoginPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateProfilePayload struct {
	Name     string `json:"name"`
	Bio      string `json:"bio"`
	Github   string `json:"github"`
	Linkedin string `json:"linkedin"`
	Skills   string `json:"skills"`
	Avatar   string `json:"avatar"`
}

type ChangePasswordPayload struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// RegisterHandler handles POST /api/auth/register
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var p RegisterPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	p.Email = strings.TrimSpace(strings.ToLower(p.Email))
	p.Name = strings.TrimSpace(p.Name)
	if p.Email == "" || p.Password == "" || p.Name == "" {
		http.Error(w, `{"error":"name, email and password are required"}`, http.StatusBadRequest)
		return
	}

	if len(p.Password) < 6 {
		http.Error(w, `{"error":"password must be at least 6 characters"}`, http.StatusBadRequest)
		return
	}

	if p.StudentID == "" {
		p.StudentID = strings.ToUpper(randomID("UTU"))
	}
	if p.Role == "" {
		p.Role = "student"
	}

	// Bcrypt hash
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error":"failed to secure password"}`, http.StatusInternalServerError)
		return
	}
	passwordHash := string(hashedBytes)

	id := randomID("mem")
	now := time.Now()

	_, err = database.DB.Exec(`INSERT INTO members (id, student_id, name, email, password_hash, role, bio, github, linkedin, skills, verified, banned, last_active_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
		id, p.StudentID, p.Name, p.Email, passwordHash, p.Role, p.Bio, p.Github, p.Linkedin, p.Skills, 1, now, now)

	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"registration failed: %v"}`, err), http.StatusConflict)
		return
	}

	token, err := auth.GenerateJWT(id, p.Email, p.Role)
	if err != nil {
		http.Error(w, `{"error":"failed to generate authorization token"}`, http.StatusInternalServerError)
		return
	}

	// Record signup activity
	LogInternalActivity(id, p.Name, p.Email, "signup", "member", id, p.Name, `{"event":"user_registration"}`, r)

	member := models.Member{
		ID:           id,
		StudentID:    p.StudentID,
		Name:         p.Name,
		Email:        p.Email,
		Role:         p.Role,
		Bio:          p.Bio,
		Github:       p.Github,
		Linkedin:     p.Linkedin,
		Skills:       p.Skills,
		Verified:     true,
		Banned:       false,
		LastActiveAt: now,
		CreatedAt:    now,
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
		"member":  member,
	})
}

// LoginHandler handles POST /api/auth/login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var p LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	p.Email = strings.TrimSpace(strings.ToLower(p.Email))
	if p.Email == "" || p.Password == "" {
		http.Error(w, `{"error":"email and password required"}`, http.StatusBadRequest)
		return
	}

	var m models.Member
	var storedHash string
	var avatar, bio, github, linkedin, skills sql.NullString
	var banned bool

	err := database.DB.QueryRow(`SELECT id, student_id, name, email, password_hash, role, avatar, bio, github, linkedin, skills, verified, banned, created_at FROM members WHERE LOWER(email) = ?`, p.Email).
		Scan(&m.ID, &m.StudentID, &m.Name, &m.Email, &storedHash, &m.Role, &avatar, &bio, &github, &linkedin, &skills, &m.Verified, &banned, &m.CreatedAt)

	if err != nil {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	if banned {
		http.Error(w, `{"error":"account has been suspended. Please contact club administration."}`, http.StatusForbidden)
		return
	}

	// Verify password with Bcrypt first
	passwordMatch := false
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(p.Password)); err == nil {
		passwordMatch = true
	} else {
		// Fallback check for legacy SHA256 hashes
		salt := "techshastra_salt_"
		shaHash := sha256.Sum256([]byte(salt + p.Password))
		legacyHash := hexString(shaHash[:])
		if storedHash == legacyHash {
			passwordMatch = true
			// Auto-upgrade legacy hash to Bcrypt!
			if newBcrypt, bErr := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost); bErr == nil {
				database.DB.Exec(`UPDATE members SET password_hash = ? WHERE id = ?`, string(newBcrypt), m.ID)
			}
		}
	}

	if !passwordMatch {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	// Update last_active_at
	now := time.Now()
	database.DB.Exec(`UPDATE members SET last_active_at = ? WHERE id = ?`, now, m.ID)

	m.Avatar = avatar.String
	m.Bio = bio.String
	m.Github = github.String
	m.Linkedin = linkedin.String
	m.Skills = skills.String
	m.Banned = false
	m.LastActiveAt = now

	token, _ := auth.GenerateJWT(m.ID, m.Email, m.Role)

	// Record login activity
	LogInternalActivity(m.ID, m.Name, m.Email, "login", "member", m.ID, m.Name, `{"event":"user_login"}`, r)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
		"member":  m,
	})
}

// MeHandler handles GET /api/auth/me
func MeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := auth.ParseJWT(tokenStr)
	if err != nil {
		http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
		return
	}

	memberID, ok := claims["sub"].(string)
	if !ok {
		http.Error(w, `{"error":"invalid token subject"}`, http.StatusUnauthorized)
		return
	}

	var m models.Member
	var avatar, bio, github, linkedin, skills sql.NullString
	var lastActive sql.NullTime

	err = database.DB.QueryRow(`SELECT id, student_id, name, email, role, avatar, bio, github, linkedin, skills, verified, banned, last_active_at, created_at FROM members WHERE id = ?`, memberID).
		Scan(&m.ID, &m.StudentID, &m.Name, &m.Email, &m.Role, &avatar, &bio, &github, &linkedin, &skills, &m.Verified, &m.Banned, &lastActive, &m.CreatedAt)

	if err != nil {
		http.Error(w, `{"error":"member not found"}`, http.StatusNotFound)
		return
	}

	m.Avatar = avatar.String
	m.Bio = bio.String
	m.Github = github.String
	m.Linkedin = linkedin.String
	m.Skills = skills.String
	if lastActive.Valid {
		m.LastActiveAt = lastActive.Time
	}

	json.NewEncoder(w).Encode(m)
}

// UpdateProfileHandler handles PUT /api/auth/me
func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var p UpdateProfilePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	p.Name = strings.TrimSpace(p.Name)
	if p.Name == "" {
		http.Error(w, `{"error":"name cannot be empty"}`, http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec(`UPDATE members SET name = ?, bio = ?, github = ?, linkedin = ?, skills = ?, avatar = ?, last_active_at = ? WHERE id = ?`,
		p.Name, p.Bio, p.Github, p.Linkedin, p.Skills, p.Avatar, time.Now(), userID)

	if err != nil {
		http.Error(w, `{"error":"failed to update profile"}`, http.StatusInternalServerError)
		return
	}

	LogInternalActivity(userID, p.Name, middleware.GetUserEmail(r), "profile_update", "member", userID, p.Name, `{"event":"updated_profile_details"}`, r)

	// Fetch updated member
	MeHandler(w, r)
}

// ChangePasswordHandler handles PUT /api/auth/password
func ChangePasswordHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var p ChangePasswordPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if len(p.NewPassword) < 6 {
		http.Error(w, `{"error":"new password must be at least 6 characters"}`, http.StatusBadRequest)
		return
	}

	var storedHash, name, email string
	err := database.DB.QueryRow(`SELECT password_hash, name, email FROM members WHERE id = ?`, userID).Scan(&storedHash, &name, &email)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	// Verify old password
	valid := false
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(p.OldPassword)); err == nil {
		valid = true
	} else {
		salt := "techshastra_salt_"
		shaHash := sha256.Sum256([]byte(salt + p.OldPassword))
		if storedHash == hexString(shaHash[:]) {
			valid = true
		}
	}

	if !valid {
		http.Error(w, `{"error":"current password incorrect"}`, http.StatusBadRequest)
		return
	}

	newHashed, err := bcrypt.GenerateFromPassword([]byte(p.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error":"failed to hash new password"}`, http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`UPDATE members SET password_hash = ?, last_active_at = ? WHERE id = ?`, string(newHashed), time.Now(), userID)
	if err != nil {
		http.Error(w, `{"error":"failed to update password"}`, http.StatusInternalServerError)
		return
	}

	LogInternalActivity(userID, name, email, "password_change", "member", userID, name, `{"event":"updated_password"}`, r)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Password changed successfully",
	})
}

func hexString(bytes []byte) string {
	var sb strings.Builder
	for _, b := range bytes {
		sb.WriteString(fmt.Sprintf("%02x", b))
	}
	return sb.String()
}
