import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Create a CSRF cookie string (non-httpOnly so JS can read it for the header).
 */
export function createCsrfCookie(token: string): string {
  return `${CSRF_COOKIE_NAME}=${token}; Secure; SameSite=Strict; Max-Age=7200; Path=/`;
}

/**
 * Extract CSRF token from the cookie.
 */
function getCsrfFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;
}

/**
 * Extract CSRF token from the request header.
 */
function getCsrfFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate CSRF token using the double-submit cookie pattern.
 * The token in the cookie must match the token in the header.
 *
 * Returns null if valid, or a 403 NextResponse if invalid.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();

  // Only validate state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  // Skip CSRF for API key authenticated routes (pharmacy, webhooks)
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/api/pharmacy/") ||
    pathname.startsWith("/api/public/")
  ) {
    return null;
  }

  // Skip CSRF for auth endpoints that don't have a session yet
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/register" ||
    pathname === "/api/auth/join" ||
    pathname === "/api/auth/legacy-claim" ||
    pathname.startsWith("/api/auth/google/")
  ) {
    return null;
  }

  const cookieToken = getCsrfFromCookie(request);
  const headerToken = getCsrfFromHeader(request);

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      { error: "CSRF token missing" },
      { status: 403 }
    );
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (!crypto.timingSafeEqual(a, b)) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  return null;
}
