import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      payload.role !== UserRole.SPL_ADMIN &&
      payload.role !== UserRole.SUPERADMIN
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const splAdmin = await prisma.sPLAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { partner: true },
    });

    if (!splAdmin) {
      return NextResponse.json(
        { error: "SPL profile not found" },
        { status: 404 }
      );
    }

    const partnerId = splAdmin.partnerId;

    // Count cases by status
    const [
      totalSubmitted,
      totalDelivered,
      pendingReview,
      totalAssigned,
      totalCancelled,
    ] = await Promise.all([
      prisma.sPLCase.count({
        where: { partnerId },
      }),
      prisma.sPLCase.count({
        where: { partnerId, status: "DELIVERED" },
      }),
      prisma.sPLCase.count({
        where: {
          partnerId,
          status: { in: ["SUBMITTED", "TRIAGED"] },
        },
      }),
      prisma.sPLCase.count({
        where: { partnerId, status: "ASSIGNED" },
      }),
      prisma.sPLCase.count({
        where: { partnerId, status: "CANCELLED" },
      }),
    ]);

    // Get recent cases
    const recentCases = await prisma.sPLCase.findMany({
      where: { partnerId },
      orderBy: { submittedAt: "desc" },
      take: 10,
      select: {
        id: true,
        referenceNumber: true,
        patientRef: true,
        serviceType: true,
        specialty: true,
        status: true,
        submittedAt: true,
      },
    });

    // Get active contract summary
    const activeContract = await prisma.sPLContract.findFirst({
      where: { partnerId, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      stats: {
        totalSubmitted,
        totalDelivered,
        pendingReview,
        totalAssigned,
        totalCancelled,
        volumeRemaining: activeContract?.casesRemainingThisPeriod ?? null,
      },
      recentCases,
      contract: activeContract
        ? {
            id: activeContract.id,
            title: activeContract.title,
            model: activeContract.model,
            status: activeContract.status,
            subscribedVolume: activeContract.subscribedVolume,
            casesDeliveredThisPeriod:
              activeContract.casesDeliveredThisPeriod,
            casesRemainingThisPeriod:
              activeContract.casesRemainingThisPeriod,
            startDate: activeContract.startDate,
            endDate: activeContract.endDate,
          }
        : null,
    });
  } catch (error) {
    logger.error('SplDashboard', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
