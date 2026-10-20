import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { Prisma, SPLCaseStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Case stages as the partner sees them.
const IN_PROGRESS: SPLCaseStatus[] = ["TRIAGED", "ASSIGNED", "IN_REVIEW"];
const COMPLETED: SPLCaseStatus[] = ["DELIVERED", "BILLED", "PAID"];
// Drafts are DFC-internal until sent to the partner.
const UNPAID_INVOICE = ["SENT", "OVERDUE"];

/** GET — the SPL portal overview: case pipeline, active contract, money owed. */
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

    if (
      payload.role !== UserRole.SPL_ADMIN &&
      payload.role !== UserRole.SUPERADMIN
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const splAdmin = await prisma.sPLAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { partner: true },
    });

    if (!splAdmin) {
      return NextResponse.json(
        { error: "SPL profile not found" },
        { status: 404 }
      );
    }

    const partnerId = splAdmin.partnerId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = (where: Prisma.SPLCaseWhereInput) =>
      prisma.sPLCase.count({ where: { partnerId, ...where } });

    const [
      total,
      awaitingTriage,
      inProgress,
      reportsReady,
      completed,
      cancelled,
      submittedThisMonth,
      recentCases,
      activeContract,
      unpaidInvoices,
    ] = await Promise.all([
      count({}),
      count({ status: "SUBMITTED" }),
      count({ status: { in: IN_PROGRESS } }),
      count({ status: "REPORT_READY" }),
      count({ status: { in: COMPLETED } }),
      count({ status: "CANCELLED" }),
      count({ submittedAt: { gte: monthStart } }),
      prisma.sPLCase.findMany({
        where: { partnerId },
        orderBy: { submittedAt: "desc" },
        take: 6,
        select: {
          id: true,
          referenceNumber: true,
          patientRef: true,
          serviceType: true,
          specialty: true,
          status: true,
          submittedAt: true,
        },
      }),
      prisma.sPLContract.findFirst({
        where: { partnerId, status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      }),
      prisma.sPLInvoice.findMany({
        where: { partnerId, status: { in: UNPAID_INVOICE } },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          dueDate: true,
          status: true,
          periodStart: true,
          periodEnd: true,
        },
      }),
    ]);

    // A sent invoice past its due date is overdue even if not yet marked so.
    const invoices = unpaidInvoices.map((inv) => ({
      ...inv,
      total: Number(inv.total),
      isOverdue: inv.status === "OVERDUE" || inv.dueDate < now,
    }));
    const sum = (list: typeof invoices) => list.reduce((acc, inv) => acc + inv.total, 0);
    const overdue = invoices.filter((inv) => inv.isOverdue);

    return NextResponse.json({
      partner: { name: splAdmin.partner.name, shortName: splAdmin.partner.shortName },
      cases: {
        total,
        awaitingTriage,
        inProgress,
        reportsReady,
        completed,
        cancelled,
        submittedThisMonth,
      },
      recentCases,
      contract: activeContract
        ? {
            id: activeContract.id,
            title: activeContract.title,
            model: activeContract.model,
            subscribedVolume: activeContract.subscribedVolume,
            subscriptionPeriod: activeContract.subscriptionPeriod,
            casesDeliveredThisPeriod: activeContract.casesDeliveredThisPeriod,
            casesRemainingThisPeriod: activeContract.casesRemainingThisPeriod,
            startDate: activeContract.startDate,
            endDate: activeContract.endDate,
          }
        : null,
      invoices: {
        unpaidCount: invoices.length,
        unpaidTotal: sum(invoices),
        overdueCount: overdue.length,
        overdueTotal: sum(overdue),
        currency: activeContract?.currency ?? "NGN",
        upcoming: invoices.slice(0, 3),
      },
    });
  } catch (error) {
    logger.error('SplDashboard', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
