package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type visitor struct {
	lastSeen time.Time
	tokens   int
}

// RateLimiter implements a token-bucket rate limiter per IP address.
type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rate     int           // tokens added per interval
	burst    int           // maximum burst capacity
	interval time.Duration // replenishment interval
}

// NewRateLimiter creates a new thread-safe rate limiter.
func NewRateLimiter(rate, burst int, interval time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate,
		burst:    burst,
		interval: interval,
	}

	// Background routine to clean up stale visitors every 3 minutes
	go func() {
		for {
			time.Sleep(3 * time.Minute)
			rl.mu.Lock()
			for ip, v := range rl.visitors {
				if time.Since(v.lastSeen) > 10*time.Minute {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func getClientIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		return strings.TrimSpace(parts[0])
	}
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return strings.TrimSpace(realIP)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// Limit wraps an http.Handler with rate-limiting enforcement.
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		rl.mu.Lock()
		v, exists := rl.visitors[ip]
		now := time.Now()

		if !exists {
			rl.visitors[ip] = &visitor{lastSeen: now, tokens: rl.burst - 1}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		// Replenish tokens based on elapsed time
		elapsed := now.Sub(v.lastSeen)
		v.lastSeen = now

		intervalsPassed := int(elapsed / rl.interval)
		if intervalsPassed > 0 {
			v.tokens += intervalsPassed * rl.rate
			if v.tokens > rl.burst {
				v.tokens = rl.burst
			}
		}

		if v.tokens <= 0 {
			rl.mu.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "10")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":       "Traffic limit exceeded: Too many requests from your IP. Please slow down.",
				"retry_after": 10,
				"success":     false,
			})
			return
		}

		v.tokens--
		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}
