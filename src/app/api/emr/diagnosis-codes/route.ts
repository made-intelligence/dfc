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
    const chapter = searchParams.get("chapter") || "";
    const dsm5Only = searchParams.get("dsm5") === "true";

    if (!q && !chapter && !dsm5Only) {
      // Return top Nigerian codes by default
      const codes = await prisma.diagnosisCode.findMany({
        where: { isNigerianTop: true },
        orderBy: { nigeriaWeighting: "desc" },
        take: limit,
      });
      return NextResponse.json({ codes });
    }

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { searchTerms: { contains: q, mode: "insensitive" } },
      ];
    }

    if (chapter) {
      where.chapter = { contains: chapter, mode: "insensitive" };
    }

    if (dsm5Only) {
      where.isDSM5 = true;
    }

    const codes = await prisma.diagnosisCode.findMany({
      where,
      orderBy: { nigeriaWeighting: "desc" },
      take: limit,
    });

    return NextResponse.json({ codes });
  } catch (error) {
    logger.error("DiagnosisCodeSearch", error);
    return NextResponse.json(
      { error: "Failed to search diagnosis codes" },
      { status: 500 }
    );
  }
}
