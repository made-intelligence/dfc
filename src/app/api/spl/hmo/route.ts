import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET — list HMO partners
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (
      !payload ||
      !["SUPERADMIN", "SECRETARIAT", "SPL_ADMIN"].includes(payload.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const hmos = await prisma.hMOPartner.findMany({
      include: {
        contracts: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            contractRef: true,
            livesCommitted: true,
            effectiveFrom: true,
            effectiveTo: true,
          },
        },
        _count: { select: { cases: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ hmos });
  } catch (error) {
    logger.error("SPLHMOPartners", error);
    return NextResponse.json(
      { error: "Failed to fetch HMO partners" },
      { status: 500 }
    );
  }
}

// POST — create HMO partner
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || !["SUPERADMIN", "SPL_ADMIN"].includes(payload.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, shortCode, livesUnderMgmt, contactName, contactEmail, contactPhone } =
      body;

    if (!name || !shortCode || !livesUnderMgmt) {
      return NextResponse.json(
        { error: "name, shortCode, and livesUnderMgmt are required" },
        { status: 400 }
      );
    }

    const hmo = await prisma.hMOPartner.create({
      data: {
        name,
        shortCode: shortCode.toUpperCase(),
        livesUnderMgmt: parseInt(livesUnderMgmt),
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
      },
    });

    return NextResponse.json({ hmo }, { status: 201 });
  } catch (error) {
    logger.error("SPLHMOCreate", error);
    return NextResponse.json(
      { error: "Failed to create HMO partner" },
      { status: 500 }
    );
  }
}
