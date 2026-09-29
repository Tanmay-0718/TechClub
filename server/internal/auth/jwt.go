package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

// GetJWTSecret retrieves JWT secret from environment or uses default
func GetJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "techshastra-secret-key-2026-super-secure"
	}
	return []byte(secret)
}

// GenerateJWT creates a signed HMAC-SHA256 JWT token valid for 7 days
func GenerateJWT(memberID, email, role string) (string, error) {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))
	claimsJSON, err := json.Marshal(map[string]interface{}{
		"sub":   memberID,
		"email": email,
		"role":  role,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	if err != nil {
		return "", err
	}
	payload := base64.RawURLEncoding.EncodeToString(claimsJSON)

	unsignedToken := header + "." + payload
	h := hmac.New(sha256.New, GetJWTSecret())
	h.Write([]byte(unsignedToken))
	signature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	return unsignedToken + "." + signature, nil
}

// ParseJWT validates a token and returns claims
func ParseJWT(tokenString string) (map[string]interface{}, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	unsignedToken := parts[0] + "." + parts[1]
	h := hmac.New(sha256.New, GetJWTSecret())
	h.Write([]byte(unsignedToken))
	expectedSignature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	if !hmac.Equal([]byte(parts[2]), []byte(expectedSignature)) {
		return nil, fmt.Errorf("invalid token signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid payload encoding: %w", err)
	}

	var claims map[string]interface{}
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("invalid claims json: %w", err)
	}

	if exp, ok := claims["exp"].(float64); ok {
		if int64(exp) < time.Now().Unix() {
			return nil, fmt.Errorf("token expired")
		}
	}

	return claims, nil
}
