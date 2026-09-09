"use client";

/**
 * Client half of the CSRF double-submit pattern.
 *
 * proxy.ts rejects every state-changing /api/ request that does not carry an
 * `x-csrf-token` header matching the `csrf_token` cookie. Nothing on the client
 * was supplying that header, so authenticated writes failed with
 * "CSRF token missing". Rather than touch 100+ call sites, we patch fetch once
 * so every same-origin mutating request carries the token automatically.
 */

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type FetchFn = typeof window.fetch;

export function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// Shared across concurrent callers so a burst of writes issues one token fetch.
let inflight: Promise<string | null> | null = null;

async function ensureCsrfToken(
  originalFetch: FetchFn,
  forceRefresh = false,
): Promise<string | null> {
  if (!forceRefresh) {
    const existing = readCsrfCookie();
    if (existing) return existing;
  }
  if (!inflight) {
    inflight = originalFetch("/api/auth/csrf", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.csrfToken ?? readCsrfCookie())
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

function requestUrl(input: RequestInfo | URL): string | null {
  try {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    return input.url;
  } catch {
    return null;
  }
}

function isSameOrigin(input: RequestInfo | URL): boolean {
  const url = requestUrl(input);
  if (url === null) return false;
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  const m =
    init?.method ?? (input instanceof Request ? input.method : undefined) ?? "GET";
  return m.toUpperCase();
}

/** True when a rejection came from the CSRF gate (so the handler never ran). */
async function isCsrfRejection(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;
  try {
    const body = await response.clone().json();
    return typeof body?.error === "string" && body.error.includes("CSRF");
  } catch {
    return false;
  }
}

/**
 * Patch window.fetch so same-origin mutating requests carry the CSRF header.
 * Idempotent: safe to call from every mount.
 */
export function installCsrfFetch(): void {
  if (typeof window === "undefined") return;
  const current = window.fetch as FetchFn & { __csrfPatched?: boolean };
  if (current.__csrfPatched) return;

  const originalFetch = window.fetch.bind(window) as FetchFn;

  const send = (
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    token: string,
  ) => {
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.set(CSRF_HEADER, token);

    if (input instanceof Request && !init) {
      return originalFetch(new Request(input, { headers }));
    }
    return originalFetch(input, {
      ...init,
      headers,
      credentials: init?.credentials ?? "same-origin",
    });
  };

  const patched = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const method = methodOf(input, init);
    if (SAFE_METHODS.has(method) || !isSameOrigin(input)) {
      return originalFetch(input, init);
    }

    const token = await ensureCsrfToken(originalFetch);
    if (!token) return originalFetch(input, init);

    const response = await send(input, init, token);

    // The cookie lives for 2 hours; a long session outlives it. A CSRF
    // rejection means the request was refused before the handler ran, so
    // retrying once with a fresh token is safe even for non-idempotent calls.
    if (await isCsrfRejection(response)) {
      const fresh = await ensureCsrfToken(originalFetch, true);
      if (fresh && fresh !== token) return send(input, init, fresh);
    }

    return response;
  } as FetchFn & { __csrfPatched?: boolean };

  patched.__csrfPatched = true;
  window.fetch = patched;
}
