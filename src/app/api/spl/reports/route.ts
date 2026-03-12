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

    const partnerId = splAdmin.partnerId;

    // Get all cases for this partner
    const allCases = await prisma.sPLCase.findMany({
      where: { partnerId },
    });

    // Total cases
    const totalCases = allCases.length;

    // Cases this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const casesThisMonth = allCases.filter(
      (c) => new Date(c.submittedAt) >= startOfMonth
    ).length;

    // Delivered cases
    const deliveredCases = allCases.filter(
      (c) => c.status === "DELIVERED" || c.status === "BILLED" || c.status === "PAID"
    );
    const deliveredCount = deliveredCases.length;
    const deliveredRate =
      totalCases > 0 ? Math.round((deliveredCount / totalCases) * 100) : 0;

    // Calculate months active to get average per month
    const oldestCase = allCases.reduce(
      (oldest, c) =>
        new Date(c.submittedAt) < oldest ? new Date(c.submittedAt) : oldest,
      new Date()
    );
    const monthsActive = Math.max(
      1,
      Math.ceil(
        (now.getTime() - oldestCase.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    );
    const averagePerMonth = Math.round(totalCases / monthsActive);

    // Group by specialty
    const specialtyMap: Record<
      string,
      { count: number; totalFee: number; totalDays: number; deliveredCount: number }
    > = {};

    for (const c of allCases) {
      if (!specialtyMap[c.specialty]) {
        specialtyMap[c.specialty] = {
          count: 0,
          totalFee: 0,
          totalDays: 0,
          deliveredCount: 0,
        };
      }
      specialtyMap[c.specialty].count++;
      specialtyMap[c.specialty].totalFee += Number(c.agreedFee || 0);

      // Turnaround time for delivered cases
      if (c.deliveredAt && c.submittedAt) {
        const days =
          (new Date(c.deliveredAt).getTime() -
            new Date(c.submittedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        specialtyMap[c.specialty].totalDays += days;
        specialtyMap[c.specialty].deliveredCount++;
      }
    }

    const specialtyBreakdown = Object.entries(specialtyMap).map(
      ([specialty, data]) => ({
        specialty,
        caseCount: data.count,
        avgFee:
          data.count > 0 ? Math.round(data.totalFee / data.count) : 0,
        percentOfTotal:
          totalCases > 0
            ? Math.round((data.count / totalCases) * 100)
            : 0,
      })
    );

    const turnaroundAnalysis = Object.entries(specialtyMap)
      .filter(([, data]) => data.deliveredCount > 0)
      .map(([specialty, data]) => ({
        specialty,
        avgDays: Math.round((data.totalDays / data.deliveredCount) * 10) / 10,
        cases: data.deliveredCount,
      }));

    // Financial summary
    const totalSpend = allCases.reduce(
      (sum, c) => sum + Number(c.agreedFee || 0),
      0
    );

    const thisPeriodCases = allCases.filter(
      (c) => new Date(c.submittedAt) >= startOfMonth
    );
    const thisPeriodSpend = thisPeriodCases.reduce(
      (sum, c) => sum + Number(c.agreedFee || 0),
      0
    );

    // Outstanding invoices
    const outstandingInvoices = await prisma.sPLInvoice.findMany({
      where: {
        partnerId,
        status: { in: ["SENT", "OVERDUE"] },
      },
    });
    const outstandingAmount = outstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );

    // Get active contract for subscription volume info
    const activeContract = await prisma.sPLContract.findFirst({
      where: { partnerId, status: "ACTIVE" },
    });

    let contractedVolumeUsed: number | null = null;
    let subscribedVolume: number | null = null;
    if (
      activeContract &&
      (activeContract.model === "SUBSCRIPTION" ||
        activeContract.model === "HYBRID")
    ) {
      contractedVolumeUsed = activeContract.casesDeliveredThisPeriod;
      subscribedVolume = activeContract.subscribedVolume;
    }

    return NextResponse.json({
      volumeSummary: {
        totalCases,
        casesThisMonth,
        averagePerMonth,
        deliveredRate,
      },
      turnaroundAnalysis,
      specialtyBreakdown,
      financialSummary: {
        totalSpend,
        thisPeriodSpend,
        outstandingAmount,
        contractedVolumeUsed,
        subscribedVolume,
      },
    });
  } catch (error) {
    logger.error('SplReports', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
