import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const splAdmin = await prisma.sPLAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { partner: true },
    });
    if (!splAdmin)
      return NextResponse.json(
        { error: "SPL profile not found" },
        { status: 404 }
      );

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      partnerId: splAdmin.partnerId,
    };
    if (status) {
      where.status = status;
    }

    const cases = await prisma.sPLCase.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        contract: {
          select: { title: true, model: true },
        },
      },
    });

    return NextResponse.json(cases);
  } catch (error) {
    logger.error('SplCases', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const splAdmin = await prisma.sPLAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { partner: true },
    });
    if (!splAdmin)
      return NextResponse.json(
        { error: "SPL profile not found" },
        { status: 404 }
      );

    const body = await request.json();
    const {
      membershipNumber,
      patientName,
      patientDob,
      patientEmail,
      patientPhone,
      serviceType,
      specialty,
      diagnosis,
      clinicalSummary,
      specificQuestions,
    } = body;

    // Validate required fields
    if (!membershipNumber || !patientName || !serviceType || !specialty || !diagnosis) {
      return NextResponse.json(
        { error: "Missing required fields: membershipNumber, patientName, serviceType, specialty, diagnosis" },
        { status: 400 }
      );
    }

    // Find active contract for this partner
    const activeContract = await prisma.sPLContract.findFirst({
      where: {
        partnerId: splAdmin.partnerId,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (!activeContract) {
      return NextResponse.json(
        { error: "No active contract found for your organisation. Please contact DFC to set up or renew your contract." },
        { status: 400 }
      );
    }

    // Generate reference number
    const referenceNumber = `SPL-${Date.now().toString(36).toUpperCase()}`;

    // Look up fee from contract feeSchedule if available
    let agreedFee = null;
    let dfcPlatformFee = null;
    let specialistFee = null;

    const feeSchedule = activeContract.feeSchedule as Record<string, number> | null;
    if (feeSchedule && feeSchedule[serviceType]) {
      agreedFee = feeSchedule[serviceType];
      const platformPercent = Number(activeContract.dfcPlatformFeePercent);
      dfcPlatformFee = (agreedFee * platformPercent) / 100;
      specialistFee = agreedFee - dfcPlatformFee;
    }

    // Build clinical summary with specific questions appended
    let fullClinicalSummary = clinicalSummary || "";
    if (specificQuestions) {
      fullClinicalSummary = fullClinicalSummary
        ? `${fullClinicalSummary}\n\n--- Specific Questions ---\n${specificQuestions}`
        : specificQuestions;
    }

    const splCase = await prisma.sPLCase.create({
      data: {
        referenceNumber,
        partnerId: splAdmin.partnerId,
        contractId: activeContract.id,
        serviceType,
        patientRef: membershipNumber,
        patientName,
        patientDob: patientDob || null,
        patientEmail: patientEmail || null,
        patientPhone: patientPhone || null,
        membershipNumber: membershipNumber || null,
        specialty,
        diagnosis,
        clinicalSummary: fullClinicalSummary || null,
        agreedFee,
        dfcPlatformFee,
        specialistFee,
      },
    });

    return NextResponse.json(
      {
        success: true,
        referenceNumber: splCase.referenceNumber,
        caseId: splCase.id,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('SplCases', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
