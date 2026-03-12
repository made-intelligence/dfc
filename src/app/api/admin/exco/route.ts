import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";

const EXCO_POSITIONS = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY_GENERAL",
  "ASSISTANT_SECRETARY",
  "TREASURER",
  "FINANCIAL_SECRETARY",
  "PRO",
  "WELFARE",
  "PROVOST",
  "SOCIAL_SECRETARY",
  "EX_OFFICIO",
] as const;

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromCookies(request.headers.get("cookie"));
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "SECRETARIAT")) return null;
  return user;
}

// GET — list all EXCO members
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const excoMembers = await prisma.dFCMember.findMany({
      where: { excoPosition: { not: null } },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } },
      },
      orderBy: { excoElectedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      positions: EXCO_POSITIONS,
      excoMembers: excoMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        memberNumber: m.memberNumber,
        excoPosition: m.excoPosition,
        excoElectedAt: m.excoElectedAt,
        excoTermEnd: m.excoTermEnd,
        category: m.category,
        status: m.status,
        user: m.user,
      })),
    });
  } catch (error) {
    logger.error('AdminExco', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — assign EXCO position to a member
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { dfcMemberId, excoPosition, excoElectedAt, excoTermEnd } = await request.json();

    if (!dfcMemberId || !excoPosition) {
      return NextResponse.json({ error: "Member ID and position are required" }, { status: 400 });
    }

    if (!EXCO_POSITIONS.includes(excoPosition)) {
      return NextResponse.json({ error: "Invalid EXCO position" }, { status: 400 });
    }

    // Check position not already taken
    const existing = await prisma.dFCMember.findFirst({
      where: { excoPosition, id: { not: dfcMemberId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Position ${excoPosition} is already assigned to another member` },
        { status: 409 }
      );
    }

    const updated = await prisma.dFCMember.update({
      where: { id: dfcMemberId },
      data: {
        excoPosition,
        excoElectedAt: excoElectedAt ? new Date(excoElectedAt) : new Date(),
        excoTermEnd: excoTermEnd ? new Date(excoTermEnd) : null,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    audit({
      userId: admin.id,
      action: "ADMIN_ACTION",
      resource: "exco",
      resourceId: dfcMemberId,
      details: { action: "assign", position: excoPosition },
    }, request);

    return NextResponse.json({ success: true, member: updated }, { status: 201 });
  } catch (error) {
    logger.error('AdminExco', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — update EXCO position
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { dfcMemberId, excoPosition, excoElectedAt, excoTermEnd } = await request.json();

    if (!dfcMemberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    if (excoPosition && !EXCO_POSITIONS.includes(excoPosition)) {
      return NextResponse.json({ error: "Invalid EXCO position" }, { status: 400 });
    }

    // Check position not already taken by someone else
    if (excoPosition) {
      const existing = await prisma.dFCMember.findFirst({
        where: { excoPosition, id: { not: dfcMemberId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Position ${excoPosition} is already assigned` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.dFCMember.update({
      where: { id: dfcMemberId },
      data: {
        ...(excoPosition !== undefined && { excoPosition }),
        ...(excoElectedAt !== undefined && { excoElectedAt: excoElectedAt ? new Date(excoElectedAt) : null }),
        ...(excoTermEnd !== undefined && { excoTermEnd: excoTermEnd ? new Date(excoTermEnd) : null }),
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    audit({
      userId: admin.id,
      action: "ADMIN_ACTION",
      resource: "exco",
      resourceId: dfcMemberId,
      details: { action: "update", position: excoPosition },
    }, request);

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    logger.error('AdminExco', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove EXCO position from a member
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dfcMemberId = searchParams.get("id");

    if (!dfcMemberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    await prisma.dFCMember.update({
      where: { id: dfcMemberId },
      data: {
        excoPosition: null,
        excoElectedAt: null,
        excoTermEnd: null,
      },
    });

    audit({
      userId: admin.id,
      action: "ADMIN_ACTION",
      resource: "exco",
      resourceId: dfcMemberId,
      details: { action: "remove" },
      severity: "WARN",
    }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('AdminExco', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
