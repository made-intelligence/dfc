import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromCookies(request.headers.get("cookie"));
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "SECRETARIAT")) return null;
  return user;
}

// POST — add a member to an initiative
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { dfcMemberId, pillarId, role } = await request.json();

    if (!dfcMemberId) {
      return NextResponse.json({ error: "DFC Member ID is required" }, { status: 400 });
    }

    // Verify initiative exists
    const initiative = await prisma.initiative.findUnique({ where: { id } });
    if (!initiative) {
      return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
    }

    // Verify pillar belongs to initiative if provided
    if (pillarId) {
      const pillar = await prisma.initiativePillar.findFirst({
        where: { id: pillarId, initiativeId: id },
      });
      if (!pillar) {
        return NextResponse.json({ error: "Pillar not found in this initiative" }, { status: 400 });
      }
    }

    const member = await prisma.initiativeMember.create({
      data: {
        initiativeId: id,
        dfcMemberId,
        pillarId: pillarId || null,
        role: role || "MEMBER",
      },
      include: {
        dfcMember: {
          include: {
            user: { select: { id: true, name: true, email: true, profileImage: true } },
          },
        },
        pillar: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    logger.error('AdminInitiativeMembers', error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "This member is already assigned to this initiative with the same pillar" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove a member from an initiative
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await params; // consume params

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    await prisma.initiativeMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('AdminInitiativeMembers', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
