import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-secret-do-not-use-in-production",
);

export interface JWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT utilities
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// Role-based access control
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  const roleHierarchy = {
    [UserRole.SUPERADMIN]: 6,
    [UserRole.SECRETARIAT]: 5,
    [UserRole.DFC_MEMBER]: 4,
    [UserRole.HOSPITAL_ADMIN]: 3,
    [UserRole.SPL_ADMIN]: 2,
    [UserRole.PATIENT]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const routePermissions: Record<string, UserRole[]> = {
    "/admin": [UserRole.SECRETARIAT, UserRole.SUPERADMIN],
    "/member": [UserRole.DFC_MEMBER, UserRole.SUPERADMIN],
    "/doctor": [UserRole.DFC_MEMBER, UserRole.SUPERADMIN],
    "/hospital": [UserRole.HOSPITAL_ADMIN, UserRole.SUPERADMIN],
    "/patient": [UserRole.PATIENT, UserRole.DFC_MEMBER],
    "/dashboard": [UserRole.PATIENT, UserRole.DFC_MEMBER, UserRole.SECRETARIAT],
  };

  const allowedRoles = routePermissions[route];
  if (!allowedRoles) return true; // Public route

  return allowedRoles.includes(userRole);
}

// Session management utilities
export function getTokenFromCookies(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies.token || null;
}

export function createAuthCookie(token: string): string {
  return `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}; Path=/`;
}

export function createLogoutCookie(): string {
  return `token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`;
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePhone(phone: string): boolean {
  // Nigerian phone number validation (basic)
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// Centralized admin auth guard — returns JWTPayload or a 401/403 NextResponse
export async function requireAdminAuth(
  request: NextRequest,
): Promise<JWTPayload | NextResponse> {
  const token = getTokenFromCookies(request.headers.get("cookie"));
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    payload.role !== UserRole.SUPERADMIN &&
    payload.role !== UserRole.SECRETARIAT
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return payload;
}

// Helper to check if requireAdminAuth returned an error response
export function isAuthError(
  result: JWTPayload | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_INACTIVE: "USER_INACTIVE",
  INVALID_TOKEN: "INVALID_TOKEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_EMAIL: "INVALID_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  INVALID_PHONE: "INVALID_PHONE",
} as const;
