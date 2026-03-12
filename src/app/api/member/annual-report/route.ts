import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "DFC_MEMBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const userId = payload.userId;

    // Fetch all data in parallel
    const [
      member,
      earnings,
      profileViews,
      referralsSent,
      referralsReceived,
      casesReviewed,
      encounterCount,
      prescriptionCount,
      credentialCount,
      committees,
    ] = await Promise.all([
      prisma.dFCMember.findUnique({
        where: { userId },
        include: { user: { select: { name: true } } },
      }),
      prisma.earningsLedger.findMany({
        where: {
          userId,
          createdAt: { gte: yearStart, lt: yearEnd },
        },
      }),
      prisma.profileViewLog.findMany({
        where: {
          profileUserId: userId,
          viewedAt: { gte: yearStart, lt: yearEnd },
        },
      }),
      prisma.encounterReferral.count({
        where: {
          referredById: userId,
          createdAt: { gte: yearStart, lt: yearEnd },
        },
      }),
      prisma.encounterReferral.count({
        where: {
          referredToId: userId,
          createdAt: { gte: yearStart, lt: yearEnd },
        },
      }),
      prisma.secondOpinionCase.count({
        where: {
          specialist: { userId },
          status: "COMPLETED",
          updatedAt: { gte: yearStart, lt: yearEnd },
        },
      }),
      prisma.clinicalEncounter.count({
        where: {
          doctor: { userId },
          encounterDate: { gte: yearStart, lt: yearEnd },
        },
      }),
      prisma.prescription.count({
        where: {
          prescribedById: userId,
          createdAt: { gte: yearStart, lt: yearEnd },
        },
      }),
      prisma.medicalCredential.count({
        where: {
          dfcMember: { userId },
          status: "VERIFIED",
        },
      }),
      prisma.committeeMember.findMany({
        where: { userId, isActive: true },
        include: { committee: { select: { name: true } } },
      }),
    ]);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Income breakdown
    const incomeBySource: Record<string, number> = {};
    let totalIncome = 0;
    let settled = 0;
    let pending = 0;

    for (const entry of earnings) {
      const amount = Number(entry.amount);
      totalIncome += amount;
      incomeBySource[entry.source] = (incomeBySource[entry.source] || 0) + amount;
      if (entry.status === "SETTLED") settled += amount;
      else if (entry.status === "PENDING") pending += amount;
    }

    // Visibility breakdown
    const viewsByType: Record<string, number> = {};
    const viewsByMonth: Record<string, number> = {};

    for (const view of profileViews) {
      viewsByType[view.viewerType] = (viewsByType[view.viewerType] || 0) + 1;
      const month = view.viewedAt.toLocaleString("default", { month: "long" });
      viewsByMonth[month] = (viewsByMonth[month] || 0) + 1;
    }

    // Top months by views
    const topViewMonths = Object.entries(viewsByMonth)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([month]) => month);

    // Calculate renewal value
    let renewalValue: string;
    if (totalIncome > 0) {
      renewalValue = `Your DFC membership returned ₦${totalIncome.toLocaleString()} in income on a ₦150,000 investment`;
    } else if (profileViews.length > 0) {
      const hospitalViews = viewsByType["HOSPITAL_ADMIN"] || 0;
      renewalValue = `Your profile was viewed ${profileViews.length} times — ${hospitalViews} by hospital administrators`;
    } else {
      renewalValue = "Complete your profile to start building your DFC impact";
    }

    return NextResponse.json({
      member: {
        name: member.user.name,
        category: member.category,
        memberSince: member.effectiveDate || member.createdAt,
      },
      year,
      income: {
        total: totalIncome,
        bySource: {
          secondOpinion: incomeBySource["SECOND_OPINION"] || 0,
          deployments: incomeBySource["DEPLOYMENT"] || 0,
          splCases: incomeBySource["SPL_CASE"] || 0,
          spaceBookingMarkup: incomeBySource["SPACE_BOOKING_MARKUP"] || 0,
          diagnosticMarkup: incomeBySource["DIAGNOSTIC_MARKUP"] || 0,
        },
        settled,
        pending,
      },
      visibility: {
        profileViews: profileViews.length,
        byViewerType: {
          hospitalAdmin: viewsByType["HOSPITAL_ADMIN"] || 0,
          patient: viewsByType["PATIENT"] || 0,
          hmo: viewsByType["HMO"] || 0,
          dfcMember: viewsByType["DFC_MEMBER"] || 0,
        },
        topViewMonths,
      },
      network: {
        referralsSent,
        referralsReceived,
        activeReferralConnections: referralsSent + referralsReceived,
      },
      clinical: {
        cmeHoursLogged: 0, // placeholder until CMERecord model
        secondOpinionCasesReviewed: casesReviewed,
        deploymentsCompleted: 0, // placeholder
        credentialsVerified: credentialCount,
        patientsSeen: encounterCount,
        prescriptionsIssued: prescriptionCount,
      },
      committees: committees.map((cm) => cm.committee.name),
      renewalValue,
    });
  } catch (error) {
    logger.error("MemberAnnualReport", error);
    return NextResponse.json(
      { error: "Failed to generate annual report" },
      { status: 500 }
    );
  }
}
