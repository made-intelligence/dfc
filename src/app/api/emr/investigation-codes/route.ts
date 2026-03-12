import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const category = searchParams.get("category") || "";

    if (!q && !category) {
      const codes = await prisma.investigationCode.findMany({
        orderBy: { nigeriaWeighting: "desc" },
        take: limit,
      });
      return NextResponse.json({ codes });
    }

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { commonName: { contains: q, mode: "insensitive" } },
        { loincCode: { contains: q, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const codes = await prisma.investigationCode.findMany({
      where,
      orderBy: { nigeriaWeighting: "desc" },
      take: limit,
    });

    return NextResponse.json({ codes });
  } catch (error) {
    logger.error("InvestigationCodeSearch", error);
    return NextResponse.json(
      { error: "Failed to search investigation codes" },
      { status: 500 }
    );
  }
}
