/**
 * Cookie Consent & Preferences Management
 * Compliant with GDPR, ePrivacy Directive, and India DPDP Act 2023.
 */

export interface CookiePreferences {
  necessary: boolean;   // Authentication tokens, dark/light theme (Always active)
  analytics: boolean;   // Anonymous page tracking, project visit counters
  preferences: boolean; // Saved UI states, view filters
  updatedAt: string;
}

const STORAGE_KEY = 'techshastra_cookie_preferences';
const EVENT_NAME = 'techshastra_cookie_preferences_changed';

export const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: true,
  preferences: true,
  updatedAt: '',
};

/**
 * Returns saved cookie preferences, or null if user hasn't made an explicit choice yet.
 */
export function getStoredCookiePreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Checks if the user has completed the cookie consent dialog.
 */
export function hasUserConsented(): boolean {
  return getStoredCookiePreferences() !== null;
}

/**
 * Saves user cookie preferences and dispatches a change event.
 */
export function saveCookiePreferences(prefs: Partial<CookiePreferences>): CookiePreferences {
  const current = getStoredCookiePreferences() || DEFAULT_PREFERENCES;
  const updated: CookiePreferences = {
    necessary: true, // Always required
    analytics: prefs.analytics !== undefined ? prefs.analytics : current.analytics,
    preferences: prefs.preferences !== undefined ? prefs.preferences : current.preferences,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    }
  } catch (err) {
    console.error('Failed to save cookie preferences:', err);
  }

  return updated;
}

/**
 * Quick helper: Accept All cookies
 */
export function acceptAllCookies(): CookiePreferences {
  return saveCookiePreferences({
    necessary: true,
    analytics: true,
    preferences: true,
  });
}

/**
 * Quick helper: Accept only Strictly Necessary cookies
 */
export function acceptEssentialOnly(): CookiePreferences {
  return saveCookiePreferences({
    necessary: true,
    analytics: false,
    preferences: false,
  });
}

/**
 * Checks if analytics/telemetry is permitted by the user.
 */
export function isAnalyticsPermitted(): boolean {
  const prefs = getStoredCookiePreferences();
  // If user hasn't decided yet, default to false until consent is given
  if (!prefs) return false;
  return prefs.analytics;
}

/**
 * Subscribes to preference changes.
 */
export function onCookiePreferencesChange(callback: (prefs: CookiePreferences) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    callback((e as CustomEvent<CookiePreferences>).detail);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
