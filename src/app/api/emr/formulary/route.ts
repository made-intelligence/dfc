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
    const esmlOnly = searchParams.get("esml") === "true";
    const controlled = searchParams.get("controlled");

    if (!q) {
      // Return top Nigerian drugs by default
      const drugs = await prisma.formularyDrug.findMany({
        where: esmlOnly ? { esml: true } : undefined,
        orderBy: { nigeriaWeighting: "desc" },
        take: limit,
      });
      return NextResponse.json({ drugs });
    }

    const where: Record<string, unknown> = {
      OR: [
        { genericName: { contains: q, mode: "insensitive" } },
        { atcCode: { contains: q, mode: "insensitive" } },
        { indication: { contains: q, mode: "insensitive" } },
      ],
    };

    if (esmlOnly) {
      where.esml = true;
    }

    if (controlled === "true") {
      where.isControlled = true;
    } else if (controlled === "false") {
      where.isControlled = false;
    }

    const drugs = await prisma.formularyDrug.findMany({
      where,
      orderBy: { nigeriaWeighting: "desc" },
      take: limit,
    });

    return NextResponse.json({ drugs });
  } catch (error) {
    logger.error("FormularySearch", error);
    return NextResponse.json(
      { error: "Failed to search formulary" },
      { status: 500 }
    );
  }
}
