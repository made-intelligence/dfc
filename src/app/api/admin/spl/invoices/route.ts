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
    const partnerId = searchParams.get("partnerId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;

    const invoices = await prisma.sPLInvoice.findMany({
      where,
      include: {
        contract: {
          include: {
            partner: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    logger.error('AdminSplInvoices', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL invoices" },
      { status: 500 }
    );
  }
}
