import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, JWTPayload } from "@/lib/auth";
import {
  validateRefreshToken,
  createRefreshToken,
  createRefreshCookie,
  clearRefreshCookie,
} from "@/lib/refresh-token";
import { authRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { SECURE_ATTR } from "@/lib/cookie-flags";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Extract refresh token from cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/refresh_token=([^;]+)/);
    const refreshToken = match?.[1];

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Validate and rotate the refresh token
    const userId = await validateRefreshToken(refreshToken);
    if (!userId) {
      const response = NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
      response.headers.append("Set-Cookie", clearRefreshCookie());
      return response;
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      const response = NextResponse.json(
        { error: "Account not found or deactivated" },
        { status: 401 }
      );
      response.headers.append("Set-Cookie", clearRefreshCookie());
      return response;
    }

    // Issue new access token
    const accessToken = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    } as JWTPayload);

    // Issue new refresh token (rotation)
    const newRefresh = await createRefreshToken(user.id, request);

    const response = NextResponse.json({
      success: true,
      token: accessToken,
    });

    // Set both cookies
    response.headers.append(
      "Set-Cookie",
      `token=${accessToken}; HttpOnly; ${SECURE_ATTR}SameSite=Strict; Max-Age=7200; Path=/`
    );
    response.headers.append("Set-Cookie", createRefreshCookie(newRefresh.token));

    return response;
  } catch (error) {
    logger.error("AuthRefresh", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
