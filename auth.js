/**
 * AquaVision AI – Auth Module (v2 Upgrade)
 * Handles session management, token storage, and API auth headers.
 * Load this BEFORE app.js in index.html.
 */

/* ─── SESSION HELPERS ────────────────────────────────── */

const Auth = {
  getToken()  { return localStorage.getItem('av_token'); },
  getUser()   {
    try { return JSON.parse(localStorage.getItem('av_user') || 'null'); }
    catch { return null; }
  },
  clear()     { localStorage.removeItem('av_token'); localStorage.removeItem('av_user'); },
  isLoggedIn(){ return !!this.getToken(); },

  /** Attach auth header to fetch options */
  headers(extra = {}) {
    const tok = this.getToken();
    return tok
      ? { 'Content-Type': 'application/json', 'X-Auth-Token': tok, ...extra }
      : { 'Content-Type': 'application/json', ...extra };
  },

  /** Authenticated fetch wrapper */
  async fetch(url, opts = {}) {
    return fetch(url, { ...opts, headers: this.headers(opts.headers || {}) });
  },

  /** Logout – clear session and redirect */
  async logout() {
    const tok = this.getToken();
    if (tok) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'X-Auth-Token': tok },
        });
      } catch {}
    }
    this.clear();
    window.location.href = '/login.html';
  },
};

/* ─── AUTH GUARD ─────────────────────────────────────── */

(async function guardPage() {
  const guard = document.getElementById('authGuard');

  if (!Auth.isLoggedIn()) {
    // Not logged in — show overlay then redirect
    if (guard) guard.classList.remove('hidden');
    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
    return;
  }

  // Verify token with server
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'X-Auth-Token': Auth.getToken() },
    });
    if (!res.ok) throw new Error('Invalid session');

    const user = await res.json();
    // Update cached user
    localStorage.setItem('av_user', JSON.stringify(user));

    // Hide guard overlay
    if (guard) guard.classList.add('hidden');

    // Inject user badge into navbar
    injectUserBadge(user);

  } catch {
    Auth.clear();
    if (guard) guard.classList.remove('hidden');
    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
  }
})();

/* ─── NAVBAR USER BADGE ──────────────────────────────── */

function injectUserBadge(user) {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  const badge = document.createElement('div');
  badge.className = 'nav-user-badge';
  badge.innerHTML = `
    <div class="user-avatar">${(user.avatar || user.username[0]).toUpperCase()}</div>
    <span class="user-name">${user.username}</span>
    <div class="user-dropdown">
      <button class="dropdown-item" onclick="Auth.logout()">🚪 Sign Out</button>
    </div>
  `;
  navRight.prepend(badge);

  // Make Auth available globally for inline onclick
  window.Auth = Auth;
}

/* ─── EXPORT GLOBALLY ────────────────────────────────── */
window.Auth = Auth;
