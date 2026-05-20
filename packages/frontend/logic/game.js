/**
 * logic/game.js
 * ─────────────────────────────────────────────────────────────
 * Game state machine + orchestration layer.
 *
 * Sits between OracleAPI (HTTP) and the UI (index.html).
 * Owns all mutable session state and exposes a clean interface.
 *
 * Depends on:  logic/config.js, logic/api.js  (loaded first)
 * ─────────────────────────────────────────────────────────────
 */

const OracleGame = (() => {
  // ── state ──────────────────────────────────────────────────
  let _state = {
    sessionId:   null,   // string – returned by POST /game
    guessCount:  0,
    hintsUsed:   0,
    gamesPlayed: 0,
    gameOver:    false,
    loading:     false,  // true while an API call is in flight
  };

  // ── accessors ──────────────────────────────────────────────

  /** Returns a shallow copy of the current state (read-only snapshot). */
  function getState() {
    return { ..._state };
  }

  function _setLoading(val) { _state.loading = val; }

  // ── game actions ───────────────────────────────────────────

  /**
   * Start a new game.
   * Resets local state, calls POST /game, returns the first hint payload.
   *
   * @returns {Promise<{ hint: string, message: string }>}
   */
  async function startNewGame() {
    _state.sessionId   = null;
    _state.guessCount  = 0;
    _state.hintsUsed   = 0;
    _state.gameOver    = false;
    _state.gamesPlayed++;
    _setLoading(true);

    try {
      const data = await OracleAPI.startGame();
      _state.sessionId = data.sessionId;
      _state.hintsUsed = 1; // the opening hint counts as hint #1
      return {
        hint:    data.hint,
        message: data.message,
      };
    } finally {
      _setLoading(false);
    }
  }

  /**
   * Submit a player guess.
   *
   * @param {string} guess
   * @returns {Promise<
   *   { correct: false, feedback, attempts, hintsAvailable } |
   *   { correct: true,  message, imageUrl, labels, totalAttempts }
   * >}
   */
  async function submitGuess(guess) {
    if (_state.gameOver || _state.loading || !_state.sessionId) return null;
    _state.guessCount++;
    _setLoading(true);

    try {
      const data = await OracleAPI.submitGuess(_state.sessionId, guess);
      if (data.correct) {
        _state.gameOver = true;
      }
      return data;
    } finally {
      _setLoading(false);
    }
  }

  /**
   * Request an extra hint via GET /game/{sessionId}/hint.
   *
   * @returns {Promise<{ hint, hintNumber, hintsRemaining }>}
   */
  async function requestHint() {
    if (_state.gameOver || _state.loading || !_state.sessionId) return null;
    _setLoading(true);

    try {
      const data = await OracleAPI.requestHint(_state.sessionId);
      _state.hintsUsed++;
      return data;
    } finally {
      _setLoading(false);
    }
  }

  /**
   * Give up the current game via POST /game/{sessionId}/give-up.
   * Backend reveals the image and labels.
   *
   * @returns {Promise<{ message, imageUrl, labels, hints, attempts }>}
   */
  async function surrender() {
    if (_state.gameOver || _state.loading || !_state.sessionId) return null;
    _state.gameOver = true;
    _setLoading(true);

    try {
      return await OracleAPI.giveUp(_state.sessionId);
    } finally {
      _setLoading(false);
    }
  }

  // ── public surface ─────────────────────────────────────────
  return { getState, startNewGame, submitGuess, requestHint, surrender };
})();

// Expose globally
window.OracleGame = OracleGame;
