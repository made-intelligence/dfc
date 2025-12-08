import { NextRequest, NextResponse } from "next/server";
import { verifyToken, canAccessRoute, getTokenFromCookies } from "@/lib/auth";

// Define protected routes and their required roles
const protectedRoutes = {
  "/admin": ["SUPERADMIN" as const, "ADMIN" as const],
  "/doctor": ["DOCTOR" as const, "SUPERADMIN" as const, "ADMIN" as const],
} as const;

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/book",
  "/about",
  "/auth/login",
  "/auth/forgot-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/public/doctors",
  "/api/public/specialties",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_") ||
    pathname.startsWith("/api/public") ||
    pathname.includes(".") ||
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/book/") // Allow dynamic doctor pages
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = getTokenFromCookies(request.headers.get("cookie"));

  // Check if route requires authentication
  const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute) {
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      // Invalid token, redirect to login
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      return response;
    }

    // Check role-based access
    const matchedRoute = Object.keys(protectedRoutes).find((route) =>
      pathname.startsWith(route),
    );

    if (matchedRoute) {
      const allowedRoles =
        protectedRoutes[matchedRoute as keyof typeof protectedRoutes];
      if (!allowedRoles.includes(payload.role as any)) {
        // Insufficient permissions, redirect to appropriate dashboard
        const dashboardUrl = getDashboardUrl(payload.role);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    }

    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId);
    response.headers.set("x-user-role", payload.role);
    response.headers.set("x-user-email", payload.email);

    return response;
  }

  // For non-protected routes, still add user info if token exists and is valid
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const response = NextResponse.next();
      response.headers.set("x-user-id", payload.userId);
      response.headers.set("x-user-role", payload.role);
      response.headers.set("x-user-email", payload.email);
      return response;
    }
  }

  return NextResponse.next();
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case "SUPERADMIN":
      return "/admin";
    case "ADMIN":
      return "/admin";
    case "DOCTOR":
      return "/doctor";
    case "PATIENT":
      return "/";
    default:
      return "/";
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
