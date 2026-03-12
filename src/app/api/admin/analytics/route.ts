import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const now = new Date();
    const lastMonth = new Date(year, now.getMonth() - 1, 1);
    const thisMonth = new Date(year, now.getMonth(), 1);

    const [
      totalRevenue,
      lastMonthRevenue,
      newPatients,
      lastMonthPatients,
      totalAppointments,
      lastMonthAppointments,
      completionRate,
      topSpecialties,
      peakHours,
      revenueData,
      userGrowthData,
    ] = await Promise.all([
      // Total revenue this month
      prisma.payment.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { amount: true },
      }),
      // Last month revenue
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        _sum: { amount: true },
      }),
      // New patients this month
      prisma.user.count({
        where: {
          role: "PATIENT",
          createdAt: { gte: thisMonth },
        },
      }),
      // Last month patients
      prisma.user.count({
        where: {
          role: "PATIENT",
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      // Total appointments this month
      prisma.appointment.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      // Last month appointments
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      // Completion rate
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { createdAt: { gte: thisMonth } },
      }),
      // Top specialties
      prisma.specialty.findMany({
        include: {
          doctors: {
            select: { id: true }
          }
        },
        orderBy: {
          doctors: {
            _count: "desc"
          }
        },
        take: 5
      }),
      // Peak hours (simplified)
      prisma.appointment.groupBy({
        by: ["startTime"],
        _count: { startTime: true },
        orderBy: { _count: { startTime: "desc" } },
        take: 5,
      }),
      // Revenue data for 12 months of selected year
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const monthStart = new Date(year, i, 1);
          const monthEnd = new Date(year, i + 1, 1);
          return prisma.payment.aggregate({
            where: {
              createdAt: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
            _sum: { amount: true },
          }).then(result => ({
            month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
            revenue: Number(result._sum.amount) || 0
          }));
        })
      ),
      // User growth data for 12 months of selected year
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const monthStart = new Date(year, i, 1);
          const monthEnd = new Date(year, i + 1, 1);
          return prisma.user.count({
            where: {
              role: "PATIENT",
              createdAt: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
          }).then(count => ({
            month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
            users: count
          }));
        })
      ),
    ]);

    const revenueGrowth = lastMonthRevenue._sum.amount
      ? (((Number(totalRevenue._sum.amount) || 0) -
          (Number(lastMonthRevenue._sum.amount) || 0)) /
          (Number(lastMonthRevenue._sum.amount) || 1)) *
        100
      : 0;
    const patientGrowth = (lastMonthPatients || 0) > 0
      ? (((newPatients || 0) - (lastMonthPatients || 0)) / (lastMonthPatients || 1)) * 100
      : 0;

    const appointmentGrowth = (lastMonthAppointments || 0) > 0
      ? (((totalAppointments || 0) - (lastMonthAppointments || 0)) / (lastMonthAppointments || 1)) * 100
      : 0;

    const totalAppointmentsThisMonth = completionRate.reduce(
      (sum, item) => sum + item._count.status,
      0,
    );
    const completedAppointments =
      completionRate.find((item) => item.status === "COMPLETED")?._count
        .status || 0;
    const completionPercentage =
      totalAppointmentsThisMonth > 0
        ? (completedAppointments / totalAppointmentsThisMonth) * 100
        : 0;

    // Get available years from database
    const availableYears = await prisma.payment.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 1
    }).then(async (firstPayment) => {
      if (!firstPayment.length) return [new Date().getFullYear()];
      
      const startYear = firstPayment[0].createdAt.getFullYear();
      const currentYear = new Date().getFullYear();
      const years = [];
      
      for (let year = startYear; year <= currentYear; year++) {
        years.push(year);
      }
      return years;
    });

    return NextResponse.json({
      metrics: {
        totalRevenue: totalRevenue._sum.amount || 0,
        revenueGrowth,
        newPatients,
        patientGrowth,
        totalAppointments,
        appointmentGrowth,
        completionRate: completionPercentage,
      },
      topSpecialties: topSpecialties.map((specialty) => ({
        specialty: specialty.name,
        count: specialty.doctors.length,
      })),
      peakHours: peakHours.map((item) => ({
        time: item.startTime,
        appointments: item._count.startTime,
      })),
      revenueData,
      userGrowthData,
      availableYears,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
