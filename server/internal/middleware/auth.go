package middleware

import (
	"context"
	"net/http"
	"strings"

	"techshastra-backend/internal/auth"
)

type contextKey string

const (
	UserIDKey contextKey = "user_id"
	EmailKey  contextKey = "user_email"
	RoleKey   contextKey = "user_role"
)

// GetUserID retrieves the authenticated user ID from context
func GetUserID(r *http.Request) string {
	if val, ok := r.Context().Value(UserIDKey).(string); ok {
		return val
	}
	return ""
}

// GetUserEmail retrieves the authenticated user email from context
func GetUserEmail(r *http.Request) string {
	if val, ok := r.Context().Value(EmailKey).(string); ok {
		return val
	}
	return ""
}

// GetUserRole retrieves the authenticated user role from context
func GetUserRole(r *http.Request) string {
	if val, ok := r.Context().Value(RoleKey).(string); ok {
		return val
	}
	return ""
}

// RequireAuth enforces a valid JWT Bearer token
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, `{"error":"authorization token required"}`, http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := auth.ParseJWT(tokenStr)
		if err != nil {
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		userID, _ := claims["sub"].(string)
		email, _ := claims["email"].(string)
		role, _ := claims["role"].(string)

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		ctx = context.WithValue(ctx, EmailKey, email)
		ctx = context.WithValue(ctx, RoleKey, role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole restricts access to specified roles (e.g. "admin", "core")
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole := GetUserRole(r)
			allowed := false
			for _, r := range roles {
				if strings.EqualFold(r, userRole) {
					allowed = true
					break
				}
			}

			if !allowed {
				http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// OptionalAuth extracts user identity if token is present, but allows unauthenticated requests
func OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := auth.ParseJWT(tokenStr)
			if err == nil {
				userID, _ := claims["sub"].(string)
				email, _ := claims["email"].(string)
				role, _ := claims["role"].(string)

				ctx := context.WithValue(r.Context(), UserIDKey, userID)
				ctx = context.WithValue(ctx, EmailKey, email)
				ctx = context.WithValue(ctx, RoleKey, role)
				r = r.WithContext(ctx)
			}
		}

		next.ServeHTTP(w, r)
	})
}
