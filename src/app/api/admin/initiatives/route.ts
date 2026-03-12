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

// GET — list all initiatives
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const initiatives = await prisma.initiative.findMany({
      where,
      include: {
        _count: { select: { members: true, pillars: true } },
        pillars: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, initiatives });
  } catch (error) {
    logger.error('AdminInitiatives', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create a new initiative
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, status, description, remit, expectedOutputs, startDate, endDate } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.initiative.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: "An initiative with this name already exists" }, { status: 409 });
    }

    const initiative = await prisma.initiative.create({
      data: {
        name: name.trim(),
        type: type || "TWG",
        status: status || "DRAFT",
        description: description || null,
        remit: remit || null,
        expectedOutputs: expectedOutputs || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: admin.id,
      },
      include: {
        _count: { select: { members: true, pillars: true } },
        pillars: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ success: true, initiative }, { status: 201 });
  } catch (error) {
    logger.error('AdminInitiatives', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — update an initiative
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, type, status, description, remit, expectedOutputs, startDate, endDate } = body;

    if (!id) {
      return NextResponse.json({ error: "Initiative ID is required" }, { status: 400 });
    }

    // Check name uniqueness if changing
    if (name) {
      const existing = await prisma.initiative.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: "An initiative with this name already exists" }, { status: 409 });
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (description !== undefined) data.description = description || null;
    if (remit !== undefined) data.remit = remit || null;
    if (expectedOutputs !== undefined) data.expectedOutputs = expectedOutputs || null;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

    const initiative = await prisma.initiative.update({
      where: { id },
      data,
      include: {
        _count: { select: { members: true, pillars: true } },
        pillars: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ success: true, initiative });
  } catch (error) {
    logger.error('AdminInitiatives', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — delete an initiative
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Initiative ID is required" }, { status: 400 });
    }

    await prisma.initiative.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('AdminInitiatives', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
