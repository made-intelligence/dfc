import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, isAuthError, JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  const payload = auth as JWTPayload;

  try {
    const contracts = await prisma.sPLContract.findMany({
      include: {
        partner: { select: { name: true, shortName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, contracts });
  } catch (error) {
    logger.error('AdminSplContracts', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL contracts" },
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
      partnerId,
      model,
      title,
      description,
      specialties,
      serviceTypes,
      dfcPlatformFeePercent,
      feeSchedule,
      subscriptionFeeMonthly,
      subscribedVolume,
      subscriptionPeriod,
      startDate,
      endDate,
      autoRenew,
    } = body;

    if (!partnerId || !model || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Partner, model, title, start date, and end date are required" },
        { status: 400 }
      );
    }

    const contract = await prisma.sPLContract.create({
      data: {
        partnerId,
        model,
        title,
        description: description || null,
        specialties: specialties || null,
        serviceTypes: serviceTypes || null,
        dfcPlatformFeePercent: dfcPlatformFeePercent ?? 15,
        feeSchedule: feeSchedule || null,
        subscriptionFeeMonthly: subscriptionFeeMonthly || null,
        subscribedVolume: subscribedVolume || null,
        subscriptionPeriod: subscriptionPeriod || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        autoRenew: autoRenew ?? false,
        status: "DRAFT",
      },
      include: {
        partner: { select: { name: true, shortName: true } },
      },
    });

    return NextResponse.json({ success: true, contract }, { status: 201 });
  } catch (error) {
    logger.error('AdminSplContracts', error);
    return NextResponse.json(
      { error: "Failed to create SPL contract" },
      { status: 500 }
    );
  }
}
