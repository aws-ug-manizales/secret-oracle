/**
 * logic/config.js
 * ─────────────────────────────────────────────────────────────
 * Central configuration for the Secret Oracle API client.
 * Change BASE_URL to point at your real backend.
 * ─────────────────────────────────────────────────────────────
 */

const OracleConfig = Object.freeze({
  /**
   * Root URL of the backend (no trailing slash).
   * Override via:  window.ORACLE_API_URL = 'https://your-api.com/prod'
   * before this script loads, or set the env var at build time.
   */
  BASE_URL: (typeof window !== 'undefined' && window.ORACLE_API_URL)
    ? window.ORACLE_API_URL
    : 'https://4737m1elc2.execute-api.us-east-1.amazonaws.com/prod',

  /**
   * Endpoint paths.
   * GUESS, HINT, and GIVE_UP require a sessionId — use the
   * helper functions in api.js which interpolate the id at call time.
   */
  ENDPOINTS: {
    START:    '/game',                              // POST
    GUESS:    (id) => `/game/${id}/guess`,          // POST
    HINT:     (id) => `/game/${id}/hint`,           // GET
    GIVE_UP:  (id) => `/game/${id}/give-up`,        // POST
  },

  /** Default fetch timeout in milliseconds */
  TIMEOUT_MS: 15_000,
});

// Expose globally so other plain scripts can access it
window.OracleConfig = OracleConfig;
