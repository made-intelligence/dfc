import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token found" },
        { status: 401 },
      );
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        adminProfile: true,
        doctorProfile: {
          include: {
            schedules: true,
            subscriptions: {
              where: {
                status: "ACTIVE",
              },
              orderBy: {
                endDate: "desc",
              },
              take: 1,
            },
          },
        },
        patientProfile: true,
        dfcMember: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 401 },
      );
    }

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile:
        user.role === "SECRETARIAT" || user.role === "SUPERADMIN"
          ? user.adminProfile
          : user.role === "DFC_MEMBER"
            ? user.doctorProfile
            : user.patientProfile,
      dfcMember: user.dfcMember
        ? {
            id: user.dfcMember.id,
            category: user.dfcMember.category,
            status: user.dfcMember.status,
            goodStanding: user.dfcMember.goodStanding,
            duesExpiresAt: user.dfcMember.duesExpiresAt,
            lastDuesPaidAt: user.dfcMember.lastDuesPaidAt,
            isLegacy: user.dfcMember.isLegacy,
            path: user.dfcMember.path,
            memberNumber: user.dfcMember.memberNumber,
            isBotMember: user.dfcMember.isBotMember,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    logger.error('AuthMe', error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
