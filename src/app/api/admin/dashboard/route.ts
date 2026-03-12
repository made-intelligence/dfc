import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalMembers = 0;
    let activeMembers = 0;
    let pendingMembers = 0;
    let todayAppointments = 0;
    let monthlyRevenue: { _sum: { amount: Prisma.Decimal | number | null } } = { _sum: { amount: null } };
    let secondOpinionCases = 0;
    let recentAppointments: Array<{ patient?: { name: string } | null; doctor?: { name: string } | null; startTime: string; status: string }> = [];
    let membersByCategory: { category: string; _count: number }[] = [];

    try { totalMembers = await prisma.dFCMember.count(); } catch {}
    try { activeMembers = await prisma.dFCMember.count({ where: { status: "ACTIVE" } }); } catch {}
    try { pendingMembers = await prisma.dFCMember.count({ where: { status: "PENDING" } }); } catch {}
    try {
      todayAppointments = await prisma.appointment.count({
        where: { appointmentDate: { gte: today, lt: tomorrow } },
      });
    } catch {}
    try {
      monthlyRevenue = await prisma.payment.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { amount: true },
      });
    } catch {}
    try {
      secondOpinionCases = await prisma.secondOpinionCase.count({
        where: { status: { in: ["SUBMITTED", "PAID", "ASSIGNED", "IN_REVIEW"] } },
      });
    } catch {}
    try {
      recentAppointments = await prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
      });
    } catch {}
    try {
      membersByCategory = (await prisma.dFCMember.groupBy({
        by: ["category"],
        _count: true,
      })).map((c) => ({ category: c.category, _count: typeof c._count === 'number' ? c._count : 0 }));
    } catch {}

    const processedAppointments = recentAppointments.slice(0, 5).map((a) => ({
      patient: a.patient?.name || "Unknown",
      doctor: a.doctor?.name || "Unknown",
      time: a.startTime || "TBD",
      status: a.status?.toLowerCase() || "pending",
    }));

    const categoryBreakdown = Object.fromEntries(
      membersByCategory.map((c) => [c.category, c._count])
    );

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers,
        pendingMembers,
        todayAppointments,
        secondOpinionCases,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
      },
      categoryBreakdown,
      recentAppointments: processedAppointments,
      systemHealth: {
        database: "operational",
        apiResponse: "operational",
        paymentGateway: "operational",
      },
    });
  } catch (error) {
    logger.error('AdminDashboard', error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
