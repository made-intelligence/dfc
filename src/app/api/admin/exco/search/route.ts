import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== "SUPERADMIN" && user.role !== "SECRETARIAT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await prisma.dFCMember.findMany({
      where: {
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      take: 10,
    });

    return NextResponse.json({
      results: results.map((m) => ({
        id: m.id,
        userId: m.userId,
        memberNumber: m.memberNumber,
        category: m.category,
        user: m.user,
      })),
    });
  } catch (error) {
    logger.error('AdminExcoSearch', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
