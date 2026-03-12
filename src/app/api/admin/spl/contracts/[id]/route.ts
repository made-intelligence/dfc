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

    const contract = await prisma.sPLContract.findUnique({
      where: { id },
      include: {
        partner: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    logger.error('AdminSplContractDetail', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL contract" },
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

    const allowedFields = [
      "status",
      "title",
      "description",
      "specialties",
      "serviceTypes",
      "dfcPlatformFeePercent",
      "feeSchedule",
      "subscriptionFeeMonthly",
      "subscribedVolume",
      "subscriptionPeriod",
      "startDate",
      "endDate",
      "autoRenew",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "startDate" || field === "endDate") {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const updated = await prisma.sPLContract.update({
      where: { id },
      data: updateData,
      include: {
        partner: true,
      },
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (error) {
    logger.error('AdminSplContractDetail', error);
    return NextResponse.json(
      { error: "Failed to update SPL contract" },
      { status: 500 }
    );
  }
}
