import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, isAuthError, JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  const payload = auth as JWTPayload;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const partnerId = searchParams.get("partnerId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (partnerId) where.partnerId = partnerId;

    const cases = await prisma.sPLCase.findMany({
      where,
      include: {
        partner: { select: { name: true, shortName: true } },
        contract: { select: { title: true } },
      },
      orderBy: { submittedAt: "asc" },
    });

    return NextResponse.json({ success: true, cases });
  } catch (error) {
    logger.error('AdminSplCases', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL cases" },
      { status: 500 }
    );
  }
}
