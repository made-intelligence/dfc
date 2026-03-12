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

// GET — single initiative with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const initiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        pillars: {
          orderBy: { order: "asc" },
          include: {
            _count: { select: { members: true } },
          },
        },
        members: {
          include: {
            dfcMember: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, profileImage: true },
                },
              },
            },
            pillar: {
              select: { id: true, name: true },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        _count: { select: { members: true, pillars: true } },
      },
    });

    if (!initiative) {
      return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, initiative });
  } catch (error) {
    logger.error('AdminInitiativeDetail', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
