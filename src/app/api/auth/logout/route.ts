import { NextRequest, NextResponse } from "next/server";
import { createLogoutCookie, verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { auditAuth } from "@/lib/audit";
import { revokeRefreshToken, clearRefreshCookie } from "@/lib/refresh-token";

export async function POST(request: NextRequest) {
  try {
    // Extract user info for audit before clearing tokens
    const accessToken = getTokenFromCookies(request.headers.get("cookie"));
    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload?.userId) {
        auditAuth.logout(payload.userId, request);
      }
    }

    // Revoke refresh token if present
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/refresh_token=([^;]+)/);
    if (match?.[1]) {
      await revokeRefreshToken(match[1]);
    }

    // Create response clearing both cookies
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.headers.set("Set-Cookie", createLogoutCookie());
    response.headers.append("Set-Cookie", clearRefreshCookie());

    return response;
  } catch (error) {
    logger.error('Logout', error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Also support GET for logout links
export async function GET(request: NextRequest) {
  return POST(request);
}
