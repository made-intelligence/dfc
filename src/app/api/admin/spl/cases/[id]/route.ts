import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, isAuthError, JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  const payload = auth as JWTPayload;

  try {
    const { id } = await params;

    const splCase = await prisma.sPLCase.findUnique({
      where: { id },
      include: {
        partner: true,
        contract: true,
      },
    });

    if (!splCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, case: splCase });
  } catch (error) {
    logger.error('AdminSplCaseDetail', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL case" },
      { status: 500 }
    );
  }
}

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
    const { status, assignedToId, coordinatorNotes, reportText } = body;

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (coordinatorNotes !== undefined) updateData.coordinatorNotes = coordinatorNotes;
    if (reportText !== undefined) updateData.reportText = reportText;

    // When status changes to DELIVERED, set deliveredAt
    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    const updated = await prisma.sPLCase.update({
      where: { id },
      data: updateData,
      include: {
        partner: true,
        contract: true,
      },
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    logger.error('AdminSplCaseDetail', error);
    return NextResponse.json(
      { error: "Failed to update SPL case" },
      { status: 500 }
    );
  }
}
