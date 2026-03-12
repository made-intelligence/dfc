import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminProfile = await prisma.hospitalAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { hospital: true },
    });
    if (!adminProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    const hospitalId = adminProfile.hospitalId;

    // Get deployment counts by status
    const [
      activeDeployments,
      verifiedSpecialists,
      pendingVerifications,
      recentDeployments,
      pendingVerificationRequests,
    ] = await Promise.all([
      prisma.deploymentWindow.count({
        where: {
          hospitalId,
          status: { in: ["APPROVED", "CONFIRMED"] },
        },
      }),
      prisma.specialistVerification.count({
        where: {
          hospitalId,
          status: "VERIFIED",
        },
      }),
      prisma.specialistVerification.count({
        where: {
          hospitalId,
          status: "PENDING",
        },
      }),
      prisma.deploymentWindow.findMany({
        where: { hospitalId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          specialty: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      }),
      prisma.specialistVerification.findMany({
        where: {
          hospitalId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          specialistName: true,
          specialty: true,
          status: true,
        },
      }),
    ]);

    // Total visits this month — count completed deployments in current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalVisitsThisMonth = await prisma.deploymentWindow.count({
      where: {
        hospitalId,
        status: "COMPLETED",
        endDate: { gte: startOfMonth },
      },
    });

    return NextResponse.json({
      stats: {
        activeDeployments,
        verifiedSpecialists,
        pendingVerifications,
        totalVisitsThisMonth,
      },
      recentDeployments,
      pendingVerifications: pendingVerificationRequests,
    });
  } catch (error) {
    logger.error('HospitalDashboard', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
