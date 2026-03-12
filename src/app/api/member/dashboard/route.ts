import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const dfcMember = await prisma.dFCMember.findUnique({
      where: { userId: payload.userId },
    });

    if (!dfcMember) {
      return NextResponse.json({ error: "Not a DFC member" }, { status: 403 });
    }

    const [committees, standingCommittees, recentTickets, openTicketsCount, notifications] =
      await Promise.all([
        prisma.initiativeMember.findMany({
          where: { dfcMemberId: dfcMember.id },
          include: {
            initiative: { select: { name: true, type: true, status: true } },
            pillar: { select: { name: true } },
          },
        }),
        prisma.committeeMember.findMany({
          where: { userId: payload.userId, isActive: true },
          include: {
            committee: { select: { name: true, shortCode: true } },
          },
        }),
        prisma.secretariatTicket.findMany({
          where: { userId: payload.userId },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            requestType: true,
            subject: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
          },
        }),
        prisma.secretariatTicket.count({
          where: { userId: payload.userId, status: "OPEN" },
        }),
        prisma.notification.findMany({
          where: { userId: payload.userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      success: true,
      dfcMember: {
        category: dfcMember.category,
        status: dfcMember.status,
        goodStanding: dfcMember.goodStanding,
        duesStatus: dfcMember.duesStatus,
        duesExpiresAt: dfcMember.duesExpiresAt,
        lastDuesPaidAt: dfcMember.lastDuesPaidAt,
        createdAt: dfcMember.createdAt,
        excoPosition: dfcMember.excoPosition,
        excoTermEnd: dfcMember.excoTermEnd,
        isBotMember: dfcMember.isBotMember,
      },
      committeesCount: committees.length + standingCommittees.length,
      openTicketsCount,
      committees: committees.map((c) => ({
        id: c.id,
        role: c.role,
        initiative: c.initiative,
        pillar: c.pillar,
      })),
      standingCommittees: standingCommittees.map((sc) => ({
        id: sc.id,
        role: sc.role,
        committeeName: sc.committee.name,
        shortCode: sc.committee.shortCode,
      })),
      recentTickets,
      notifications,
    });
  } catch (error) {
    logger.error('MemberDashboard', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
