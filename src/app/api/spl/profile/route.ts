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

    const activeContract = await prisma.sPLContract.findFirst({
      where: { partnerId: splAdmin.partnerId, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      partner: {
        id: splAdmin.partner.id,
        name: splAdmin.partner.name,
        shortName: splAdmin.partner.shortName,
        type: splAdmin.partner.type,
        logoUrl: splAdmin.partner.logoUrl,
        primaryContact: splAdmin.partner.primaryContact,
        primaryEmail: splAdmin.partner.primaryEmail,
      },
      role: splAdmin.role,
      activeContract: activeContract
        ? {
            id: activeContract.id,
            title: activeContract.title,
            model: activeContract.model,
            status: activeContract.status,
            casesRemainingThisPeriod:
              activeContract.casesRemainingThisPeriod,
            casesDeliveredThisPeriod:
              activeContract.casesDeliveredThisPeriod,
            subscribedVolume: activeContract.subscribedVolume,
            endDate: activeContract.endDate,
          }
        : null,
    });
  } catch (error) {
    logger.error('SplProfile', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
