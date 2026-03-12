import { NextResponse } from "next/server";
import { generateCsrfToken, createCsrfCookie } from "@/lib/csrf";

/**
 * GET /api/auth/csrf — Issue a CSRF token.
 * Frontend should call this on app load, then include the token
 * in the `x-csrf-token` header for all state-changing requests.
 */
export async function GET() {
  const token = generateCsrfToken();

  const response = NextResponse.json({ csrfToken: token });
  response.headers.set("Set-Cookie", createCsrfCookie(token));

  return response;
}
