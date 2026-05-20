/**
 * logic/api.js
 * ─────────────────────────────────────────────────────────────
 * Pure API client for the Secret Oracle backend.
 * All functions return Promises that resolve to parsed JSON
 * or reject with an { status, message } error object.
 *
 * Depends on:  logic/config.js  (must be loaded first)
 * ─────────────────────────────────────────────────────────────
 *
 * CONTRACT
 * ════════
 *
 * POST /game
 *   ← 201 { sessionId: string, hint: string, message: string }
 *
 * POST /game/{sessionId}/guess
 *   → { guess: string }
 *   ← 200 wrong:   { correct: false, feedback: string,
 *                    attempts: number, hintsAvailable: boolean }
 *   ← 200 correct: { correct: true, message: string,
 *                    imageUrl: string, labels: string[],
 *                    totalAttempts: number }
 *
 * GET /game/{sessionId}/hint
 *   ← 200 { hint: string, hintNumber: number, hintsRemaining: number }
 *
 * POST /game/{sessionId}/give-up
 *   ← 200 { message: string, imageUrl: string, labels: string[],
 *            hints: string[], attempts: string[] }
 */

const OracleAPI = (() => {
  // ── private helpers ────────────────────────────────────────

  function url(path) {
    return `${OracleConfig.BASE_URL}${path}`;
  }

  /**
   * Performs a fetch (POST or GET) with timeout + unified error handling.
   * @param {'GET'|'POST'} method
   * @param {string}       path     – full path (already interpolated)
   * @param {object|null}  body     – request payload for POST (null for GET)
   */
  async function request(method, path, body = null) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      OracleConfig.TIMEOUT_MS
    );

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (body !== null) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(url(path), options);
    } catch (err) {
      clearTimeout(timer);
      const msg = err.name === 'AbortError'
        ? 'The Oracle did not respond in time. Check your connection.'
        : 'Could not reach the Oracle. Is the backend running?';
      throw { status: 0, message: msg };
    } finally {
      clearTimeout(timer);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw { status: response.status, message: 'The Oracle returned an unreadable response.' };
    }

    if (!response.ok) {
      throw {
        status:  response.status,
        message: data?.message || `The Oracle responded with an error (${response.status}).`,
      };
    }

    return data;
  }

  // ── public surface ─────────────────────────────────────────

  /**
   * Start a new game session.
   * @returns {Promise<{ sessionId, hint, message }>}
   */
  function startGame() {
    return request('POST', OracleConfig.ENDPOINTS.START);
  }

  /**
   * Submit a player guess.
   * @param {string} sessionId
   * @param {string} guess
   * @returns {Promise<
   *   { correct: false, feedback, attempts, hintsAvailable } |
   *   { correct: true,  message, imageUrl, labels, totalAttempts }
   * >}
   */
  function submitGuess(sessionId, guess) {
    return request('POST', OracleConfig.ENDPOINTS.GUESS(sessionId), { guess });
  }

  /**
   * Request an additional hint.
   * @param {string} sessionId
   * @returns {Promise<{ hint, hintNumber, hintsRemaining }>}
   */
  function requestHint(sessionId) {
    return request('GET', OracleConfig.ENDPOINTS.HINT(sessionId));
  }

  /**
   * Give up the current game — backend reveals the answer.
   * @param {string} sessionId
   * @returns {Promise<{ message, imageUrl, labels, hints, attempts }>}
   */
  function giveUp(sessionId) {
    return request('POST', OracleConfig.ENDPOINTS.GIVE_UP(sessionId));
  }

  return { startGame, submitGuess, requestHint, giveUp };
})();

// Expose globally
window.OracleAPI = OracleAPI;
