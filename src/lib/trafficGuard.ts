/**
 * Client-Side Traffic & Rate Limit Controller
 * Prevents automated request loops, button spamming, and excess bandwidth usage.
 */

interface RequestRecord {
  timestamps: number[];
  cooldownUntil: number;
}

const MAX_REQUESTS_PER_WINDOW = 35; // Maximum requests allowed in a 10-second window
const WINDOW_DURATION_MS = 10000;   // 10 seconds
const COOLDOWN_DURATION_MS = 8000;  // 8-second cooldown penalty if threshold is violated

const trafficState: RequestRecord = {
  timestamps: [],
  cooldownUntil: 0,
};

/**
 * Checks whether the client is within safe traffic limits.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }.
 */
export function checkTrafficLimit(): { allowed: boolean; retryAfterSeconds: number; error?: string } {
  const now = Date.now();

  // Check if currently under cooldown
  if (now < trafficState.cooldownUntil) {
    const remainingSeconds = Math.ceil((trafficState.cooldownUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: remainingSeconds,
      error: `Traffic limit reached: Please wait ${remainingSeconds}s before sending more requests.`,
    };
  }

  // Prune timestamps older than window
  trafficState.timestamps = trafficState.timestamps.filter(t => now - t < WINDOW_DURATION_MS);

  if (trafficState.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    trafficState.cooldownUntil = now + COOLDOWN_DURATION_MS;
    const remainingSeconds = Math.ceil(COOLDOWN_DURATION_MS / 1000);
    return {
      allowed: false,
      retryAfterSeconds: remainingSeconds,
      error: `High traffic detected from your session. Throttling for ${remainingSeconds}s to protect club systems.`,
    };
  }

  // Record this request
  trafficState.timestamps.push(now);
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Resets traffic tracking (e.g. on navigation or deliberate reset)
 */
export function resetTrafficTracker(): void {
  trafficState.timestamps = [];
  trafficState.cooldownUntil = 0;
}
