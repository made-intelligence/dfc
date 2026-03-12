import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, isAuthError, JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  const payload = auth as JWTPayload;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === "PAID") {
        updateData.paidAt = new Date();
      }
    }

    const updated = await prisma.sPLInvoice.update({
      where: { id },
      data: updateData,
      include: {
        contract: {
          include: {
            partner: { select: { name: true, shortName: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    logger.error('AdminSplInvoiceDetail', error);
    return NextResponse.json(
      { error: "Failed to update SPL invoice" },
      { status: 500 }
    );
  }
}
