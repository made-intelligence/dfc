import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function extractClientInfo(request?: NextRequest) {
  if (!request) return { ipAddress: null, userAgent: null };
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}

/**
 * Create a new refresh token for a user.
 */
export async function createRefreshToken(
  userId: string,
  request?: NextRequest
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const { ipAddress, userAgent } = extractClientInfo(request);

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { token, expiresAt };
}

/**
 * Validate and consume a refresh token.
 * Returns the userId if valid, null otherwise.
 * Implements rotation: old token is revoked, caller should issue a new one.
 */
export async function validateRefreshToken(
  token: string
): Promise<string | null> {
  const record = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (record.revokedAt) return null;
  if (new Date() > record.expiresAt) {
    // Expired — revoke it
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  // Rotate: revoke the old token
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return record.userId;
}

/**
 * Revoke all refresh tokens for a user (logout everywhere, password change).
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke a single refresh token (logout from one device).
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Create the refresh token cookie string.
 */
export function createRefreshCookie(token: string): string {
  const maxAge = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  return `refresh_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/api/auth/refresh`;
}

/**
 * Create a cookie that clears the refresh token.
 */
export function clearRefreshCookie(): string {
  return `refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth/refresh`;
}

/**
 * Clean up expired tokens (run periodically).
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          revokedAt: { not: null },
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      ],
    },
  });
  return result.count;
}
