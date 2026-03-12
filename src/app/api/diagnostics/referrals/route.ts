import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { generateReferralCode } from "@/lib/diagnostics/ingestion";
import { logger } from "@/lib/logger";

// POST — create a diagnostic referral (from EMR investigation order)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "DFC_MEMBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      investigationId,
      patientId,
      loincCode,
      investigationName,
      partnerId,
      centreId,
      physicianMarkup,
    } = body;

    if (!investigationId || !patientId || !loincCode || !investigationName) {
      return NextResponse.json(
        {
          error:
            "investigationId, patientId, loincCode, and investigationName are required",
        },
        { status: 400 }
      );
    }

    // Get DFC rate
    const rateSchedule = await prisma.diagnosticRateSchedule.findFirst({
      where: {
        loincCode,
        effectiveTo: null,
        ...(partnerId ? { partnerId } : {}),
      },
      orderBy: { dfcRate: "asc" },
    });

    const dfcRate = rateSchedule ? Number(rateSchedule.dfcRate) : 0;
    const markup = parseFloat(physicianMarkup) || 0;
    const patientPrice = dfcRate + markup;

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.diagnosticReferral.findUnique({
        where: { referralCode },
      });
      if (!existing) break;
      referralCode = generateReferralCode();
      attempts++;
    }

    // Get doctor profile ID
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    const referral = await prisma.diagnosticReferral.create({
      data: {
        referralCode,
        patientId,
        orderedById: doctorProfile.id,
        investigationId,
        partnerId: partnerId || rateSchedule?.partnerId || null,
        centreId: centreId || null,
        loincCode,
        investigationName,
        dfcRate,
        physicianMarkup: markup,
        patientPrice,
        status: "ISSUED",
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    });

    return NextResponse.json(
      {
        referral: {
          id: referral.id,
          referralCode: referral.referralCode,
          investigationName: referral.investigationName,
          dfcRate: referral.dfcRate,
          physicianMarkup: referral.physicianMarkup,
          patientPrice: referral.patientPrice,
          expiresAt: referral.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("DiagnosticReferralCreate", error);
    return NextResponse.json(
      { error: "Failed to create diagnostic referral" },
      { status: 500 }
    );
  }
}

// GET — list referrals for a doctor
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json({ referrals: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {
      orderedById: doctorProfile.id,
    };
    if (status) where.status = status;

    const referrals = await prisma.diagnosticReferral.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    logger.error("DiagnosticReferralsList", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}
