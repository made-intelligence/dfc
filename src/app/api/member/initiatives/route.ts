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

    const memberships = await prisma.initiativeMember.findMany({
      where: { dfcMemberId: dfcMember.id },
      include: {
        initiative: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            remit: true,
            description: true,
          },
        },
        pillar: {
          select: { id: true, name: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const memberInitiativeIds = memberships.map((m) => m.initiativeId);

    const available = await prisma.initiative.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: memberInitiativeIds.length > 0 ? memberInitiativeIds : [] },
      },
      include: {
        pillars: { select: { id: true, name: true }, orderBy: { order: "asc" } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      memberships: memberships.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        initiativeId: m.initiativeId,
        initiative: m.initiative,
        pillar: m.pillar,
      })),
      available: available.map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type,
        description: i.description,
        remit: i.remit,
        pillars: i.pillars,
        memberCount: i._count.members,
      })),
    });
  } catch (error) {
    logger.error("MemberInitiatives", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, initiativeId, pillarId, membershipId } = body;

    if (action === "join") {
      if (!initiativeId) {
        return NextResponse.json(
          { error: "Initiative ID is required" },
          { status: 400 }
        );
      }

      const initiative = await prisma.initiative.findUnique({
        where: { id: initiativeId },
        include: {
          members: {
            where: { role: { in: ["LEAD", "CO_LEAD"] } },
            include: { dfcMember: { select: { userId: true } } },
          },
        },
      });

      if (!initiative) {
        return NextResponse.json(
          { error: "Initiative not found" },
          { status: 404 }
        );
      }

      if (initiative.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "This initiative is not currently active" },
          { status: 400 }
        );
      }

      const existing = await prisma.initiativeMember.findFirst({
        where: {
          initiativeId,
          dfcMemberId: dfcMember.id,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "You are already a member of this initiative" },
          { status: 400 }
        );
      }

      // Validate pillarId belongs to the initiative if provided
      if (pillarId) {
        const pillar = await prisma.initiativePillar.findFirst({
          where: { id: pillarId, initiativeId },
        });
        if (!pillar) {
          return NextResponse.json(
            { error: "Invalid pillar for this initiative" },
            { status: 400 }
          );
        }
      }

      await prisma.initiativeMember.create({
        data: {
          initiativeId,
          dfcMemberId: dfcMember.id,
          pillarId: pillarId || null,
          role: "MEMBER",
        },
      });

      // Notify initiative leads
      const leadUserIds = initiative.members
        .map((m) => m.dfcMember.userId)
        .filter(Boolean);

      if (leadUserIds.length > 0) {
        const memberUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { name: true },
        });

        await prisma.notification.createMany({
          data: leadUserIds.map((userId) => ({
            userId,
            title: "New Member Joined",
            message: `${memberUser?.name || "A member"} has joined ${initiative.name}.`,
            type: "info",
            link: "/member/initiatives",
          })),
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "leave") {
      if (!membershipId) {
        return NextResponse.json(
          { error: "Membership ID is required" },
          { status: 400 }
        );
      }

      const membership = await prisma.initiativeMember.findUnique({
        where: { id: membershipId },
        include: {
          initiative: {
            select: { name: true },
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "Membership not found" },
          { status: 404 }
        );
      }

      if (membership.dfcMemberId !== dfcMember.id) {
        return NextResponse.json(
          { error: "This membership does not belong to you" },
          { status: 403 }
        );
      }

      await prisma.initiativeMember.delete({
        where: { id: membershipId },
      });

      // Create notification for the member
      await prisma.notification.create({
        data: {
          userId: payload.userId,
          title: "Left Initiative",
          message: `You have left ${membership.initiative.name}.`,
          type: "info",
          link: "/member/initiatives",
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'join' or 'leave'." },
      { status: 400 }
    );
  } catch (error) {
    logger.error("MemberInitiatives POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
