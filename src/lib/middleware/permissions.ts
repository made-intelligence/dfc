import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function requirePermission(
  request: NextRequest,
  requiredPermission: string
) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie")) ||
      request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    if (payload.role === 'SUPERADMIN') {
      return null;
    }

    const hasRequiredPermission = await hasPermission(payload.userId, requiredPermission);
    if (!hasRequiredPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    return NextResponse.json(
      { error: "Permission check failed" },
      { status: 500 }
    );
  }
}