"use client";

/**
 * Keeps a signed-in session alive.
 *
 * The access token (cookie `token`) lives 2 hours; the refresh token lives 7
 * days and rotates on every use. Nothing used to call /api/auth/refresh, so
 * every session ended hard at 2 hours. This module renews the access token:
 *  - proactively, on a timer and when a tab becomes visible again, and
 *  - reactively, when an API call comes back 401 (see csrf-client.ts).
 *
 * Refresh tokens are single-use, so two tabs refreshing at once would make the
 * loser fail and clear the cookie the winner just set. Calls are therefore
 * serialised across tabs (Web Locks) and skipped if another tab refreshed
 * moments ago.
 */

const REFRESH_URL = "/api/auth/refresh";
const LAST_REFRESH_KEY = "dfc_session_refreshed_at";
const LOCK_NAME = "dfc-session-refresh";
/** Another tab refreshed this recently: reuse its cookies instead. */
const RECENT_MS = 30 * 1000;
/** Matches REFRESH_TOKEN_EXPIRY_DAYS in refresh-token.ts. */
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Renew well before the 2-hour access token expires. */
export const PROACTIVE_REFRESH_MS = 90 * 60 * 1000;

type FetchFn = typeof window.fetch;

function readLastRefresh(): number {
  try {
    return Number(localStorage.getItem(LAST_REFRESH_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Call after login too, so the proactive timer counts from sign-in. */
export function markSessionRefreshed(): void {
  try {
    localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));
  } catch {
    // storage unavailable: timers still work per tab
  }
}

export function clearSessionMarker(): void {
  try {
    localStorage.removeItem(LAST_REFRESH_KEY);
  } catch {
    // ignore
  }
}

/**
 * True when this browser signed in or renewed within the refresh token's
 * lifetime. Anonymous visitors have no marker, so they never call the refresh
 * endpoint (which shares the auth rate limit with login).
 */
export function hasLikelySession(): boolean {
  const last = readLastRefresh();
  return last > 0 && Date.now() - last < REFRESH_TOKEN_TTL_MS;
}

export function msSinceLastRefresh(): number {
  return Date.now() - readLastRefresh();
}

async function doRefresh(fetchFn: FetchFn): Promise<boolean> {
  if (!hasLikelySession()) return false;
  if (msSinceLastRefresh() < RECENT_MS) return true;
  try {
    const res = await fetchFn(REFRESH_URL, { method: "POST", credentials: "same-origin" });
    if (res.ok) markSessionRefreshed();
    // Refresh token gone or rejected: stop trying until the next sign-in.
    else if (res.status === 401) clearSessionMarker();
    return res.ok;
  } catch {
    return false;
  }
}

let inflight: Promise<boolean> | null = null;

/** Renews the session cookies. Resolves true when the session is (still) valid. */
export function refreshSession(fetchFn: FetchFn = window.fetch.bind(window)): Promise<boolean> {
  if (!inflight) {
    const run = (): Promise<boolean> => doRefresh(fetchFn);
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    // The lock callback returns a promise; .then unwraps it for the typings.
    const p: Promise<boolean> = locks ? locks.request(LOCK_NAME, run).then((r) => r) : run();
    inflight = p.finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Auth endpoints whose 401 means "wrong credentials", not "session expired". */
export function isAuthEndpoint(pathname: string): boolean {
  return pathname.startsWith("/api/auth/") && pathname !== "/api/auth/me";
}
