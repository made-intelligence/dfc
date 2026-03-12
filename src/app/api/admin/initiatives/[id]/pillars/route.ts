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

// POST — create a pillar for an initiative
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { name, subtitle, focus, outputs, order } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Pillar name is required" }, { status: 400 });
    }

    // Verify initiative exists
    const initiative = await prisma.initiative.findUnique({ where: { id } });
    if (!initiative) {
      return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
    }

    const pillar = await prisma.initiativePillar.create({
      data: {
        initiativeId: id,
        name: name.trim(),
        subtitle: subtitle || null,
        focus: focus || null,
        outputs: outputs || null,
        order: order ?? 0,
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ success: true, pillar }, { status: 201 });
  } catch (error) {
    logger.error('AdminInitiativePillars', error);
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "A pillar with this name already exists in this initiative" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — delete a pillar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await params; // consume params

    const { searchParams } = new URL(request.url);
    const pillarId = searchParams.get("pillarId");

    if (!pillarId) {
      return NextResponse.json({ error: "Pillar ID is required" }, { status: 400 });
    }

    await prisma.initiativePillar.delete({ where: { id: pillarId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('AdminInitiativePillars', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
