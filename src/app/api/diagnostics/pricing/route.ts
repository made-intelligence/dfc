import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET — get DFC pricing for an investigation (members only)
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "DFC_MEMBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const loincCode = searchParams.get("loincCode") || "";
    const q = searchParams.get("q") || "";

    if (!loincCode && !q) {
      return NextResponse.json(
        { error: "loincCode or q parameter required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      effectiveTo: null, // current rates only
    };

    if (loincCode) {
      where.loincCode = loincCode;
    }

    if (q) {
      where.investigationName = { contains: q, mode: "insensitive" };
    }

    const rates = await prisma.diagnosticRateSchedule.findMany({
      where,
      include: {
        partner: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { dfcRate: "asc" },
    });

    // Calculate market context — median DFC rate
    const dfcRates = rates.map((r) => Number(r.dfcRate));
    const median =
      dfcRates.length > 0
        ? dfcRates.sort((a, b) => a - b)[Math.floor(dfcRates.length / 2)]
        : 0;

    return NextResponse.json({
      pricing: rates.map((r) => ({
        partner: r.partner.name,
        partnerSlug: r.partner.slug,
        loincCode: r.loincCode,
        investigationName: r.investigationName,
        dfcRate: r.dfcRate,
        currency: r.currency,
        turnaroundHours: r.turnaroundHours,
      })),
      marketContext: {
        medianDfcRate: median,
        rateCount: rates.length,
      },
    });
  } catch (error) {
    logger.error("DiagnosticPricing", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}
