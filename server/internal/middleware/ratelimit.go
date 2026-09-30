package middleware

import (
	"encoding/json"
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type visitor struct {
	lastSeen time.Time
	tokens   float64
}

// RateLimiter implements a continuous linear-scaling token-bucket rate limiter per IP address.
type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rate     float64 // tokens added per second linearly
	burst    float64 // maximum burst capacity
}

// NewRateLimiter creates a new thread-safe linear-scaling rate limiter.
// rate: number of tokens replenished over the given interval
// burst: maximum burst capacity allowed at once
func NewRateLimiter(rate, burst int, interval time.Duration) *RateLimiter {
	tokensPerSecond := float64(rate) / interval.Seconds()
	if tokensPerSecond <= 0 {
		tokensPerSecond = 1.0
	}

	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     tokensPerSecond,
		burst:    float64(burst),
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

// Limit wraps an http.Handler with continuous linear rate-limiting enforcement.
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		rl.mu.Lock()
		v, exists := rl.visitors[ip]
		now := time.Now()

		if !exists {
			rl.visitors[ip] = &visitor{lastSeen: now, tokens: rl.burst - 1.0}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		// Continuous linear scaling: replenish tokens linearly with time elapsed
		elapsedSec := now.Sub(v.lastSeen).Seconds()
		v.lastSeen = now

		v.tokens += elapsedSec * rl.rate
		if v.tokens > rl.burst {
			v.tokens = rl.burst
		}

		// Check if at least 1 token is available
		if v.tokens < 1.0 {
			// Calculate exact linear backoff delay required to recover 1 token
			neededTokens := 1.0 - v.tokens
			retrySec := int(math.Ceil(neededTokens / rl.rate))
			if retrySec < 1 {
				retrySec = 1
			}

			rl.mu.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", strconv.Itoa(retrySec))
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":       "Traffic limit exceeded: Request rate too high. Please slow down.",
				"retry_after": retrySec,
				"success":     false,
			})
			return
		}

		v.tokens -= 1.0
		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}
