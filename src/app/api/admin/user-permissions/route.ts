import { NextRequest, NextResponse } from "next/server";
import { getUserPermissions } from "@/lib/permissions";
import { requireAdminAuth, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const permissions = await getUserPermissions(userId);
    const permissionNames = permissions.map(p => p.name);

    return NextResponse.json({
      permissions: permissionNames
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user permissions" },
      { status: 500 }
    );
  }
}