import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, isAuthError, JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  const payload = auth as JWTPayload;

  try {
    const partners = await prisma.sPLPartner.findMany({
      include: {
        _count: {
          select: {
            contracts: true,
            cases: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, partners });
  } catch (error) {
    logger.error('AdminSplPartners', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL partners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  const payload = auth as JWTPayload;

  try {
    const body = await request.json();
    const {
      name,
      shortName,
      type,
      primaryContact,
      primaryEmail,
      primaryPhone,
      rcNumber,
    } = body;

    // Validate required fields
    if (!name || !shortName || !primaryEmail) {
      return NextResponse.json(
        { error: "Name, short name, and primary email are required" },
        { status: 400 }
      );
    }

    const partner = await prisma.sPLPartner.create({
      data: {
        name,
        shortName,
        type: type || "CORPORATE",
        status: "DRAFT",
        primaryContact: primaryContact || null,
        primaryEmail,
        primaryPhone: primaryPhone || null,
        rcNumber: rcNumber || null,
      },
    });

    return NextResponse.json({ success: true, partner }, { status: 201 });
  } catch (error) {
    logger.error('AdminSplPartners', error);
    return NextResponse.json(
      { error: "Failed to create SPL partner" },
      { status: 500 }
    );
  }
}
