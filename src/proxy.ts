import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-secret-do-not-use-in-production",
);

// Routes that require authentication
const PROTECTED_ROUTES = ["/admin", "/doctor", "/member", "/profile", "/appointments", "/hospital", "/spl"];

// Routes that require specific roles
const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["SUPERADMIN", "SECRETARIAT"],
  "/doctor": ["DFC_MEMBER", "SUPERADMIN"],
  "/member": ["DFC_MEMBER", "SUPERADMIN", "SECRETARIAT"],
  "/hospital": ["HOSPITAL_ADMIN", "SUPERADMIN"],
  "/spl": ["SPL_ADMIN", "SUPERADMIN"],
};

// CSRF: routes that skip validation (no session, external callers, or read-only)
const CSRF_SKIP_PREFIXES = [
  "/api/webhooks/",
  "/api/pharmacy/",
  "/api/public/",
];
const CSRF_SKIP_EXACT = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/join",
  "/api/auth/legacy-claim",
  "/api/auth/claim-account",
  "/api/auth/claim",
  "/api/auth/csrf",
  "/api/auth/refresh",
  "/api/payment/initialize",
  "/api/payment/verify",
];

/**
 * Validate CSRF double-submit cookie for state-changing API requests.
 * Returns a 403 response if invalid, or null if valid / not applicable.
 */
function validateCsrfInProxy(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return null;

  const pathname = request.nextUrl.pathname;

  // Skip non-API routes
  if (!pathname.startsWith("/api/")) return null;

  // Skip exempt routes
  if (CSRF_SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (CSRF_SKIP_EXACT.includes(pathname)) return null;
  if (pathname.startsWith("/api/auth/google/")) return null;

  const cookieToken = request.cookies.get("csrf_token")?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return NextResponse.json({ error: "CSRF token missing" }, { status: 403 });
  }

  if (cookieToken.length !== headerToken.length || cookieToken !== headerToken) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and auth pages early
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // CSRF validation for state-changing API requests
  const csrfError = validateCsrfInProxy(request);
  if (csrfError) return csrfError;

  // Skip remaining checks for API routes (auth handled per-route)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid token — redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
