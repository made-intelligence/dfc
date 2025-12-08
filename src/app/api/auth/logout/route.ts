import { NextRequest, NextResponse } from "next/server";
import { createLogoutCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Create response with logout cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the auth cookie
    response.headers.set("Set-Cookie", createLogoutCookie());

    return response;
  } catch (error) {
    console.error("Logout error:", error);

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
