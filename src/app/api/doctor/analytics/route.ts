import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, AppointmentStatus } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DOCTOR || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Monthly revenue for last 6 months
    const monthlyRevenue = await prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: {
        doctorId: user.id,
        status: AppointmentStatus.COMPLETED,
        appointmentDate: {
          gte: last6Months,
        },
      },
      _count: {
        id: true,
      },
    });

    // Process monthly data
    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toISOString().slice(0, 7);
      
      const monthAppointments = monthlyRevenue.filter(item => 
        item.appointmentDate.toISOString().slice(0, 7) === monthStr
      );
      
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthAppointments.length * Number(user.doctorProfile?.consultationFee),
        appointments: monthAppointments.reduce((sum, item) => sum + item._count.id, 0),
      };
    }).reverse();

    // Appointment status distribution
    const appointmentStats = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        doctorId: user.id,
        appointmentDate: {
          gte: currentMonth,
        },
      },
      _count: {
        id: true,
      },
    });

    // Patient demographics (new vs returning)
    const totalAppointments = await prisma.appointment.count({
      where: {
        doctorId: user.id,
        appointmentDate: {
          gte: currentMonth,
        },
      },
    });

    const uniquePatients = await prisma.appointment.findMany({
      where: {
        doctorId: user.id,
        appointmentDate: {
          gte: currentMonth,
        },
      },
      select: {
        patientId: true,
      },
      distinct: ['patientId'],
    });

    // Peak hours analysis
    const hourlyDistribution = await prisma.appointment.findMany({
      where: {
        doctorId: user.id,
        appointmentDate: {
          gte: last6Months,
        },
      },
      select: {
        startTime: true,
      },
    });

    const peakHours = hourlyDistribution.reduce((acc, apt) => {
      const hour = parseInt(apt.startTime.split(':')[0]);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Top performing days
    const dailyStats = await prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: {
        doctorId: user.id,
        status: AppointmentStatus.COMPLETED,
        appointmentDate: {
          gte: last6Months,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 7,
    });

    return NextResponse.json({
      monthlyRevenue: revenueByMonth,
      appointmentStats: appointmentStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
      })),
      patientMetrics: {
        totalAppointments,
        uniquePatients: uniquePatients.length,
        returningPatients: totalAppointments - uniquePatients.length,
      },
      peakHours: Object.entries(peakHours)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topDays: dailyStats.map(day => ({
        date: day.appointmentDate.toISOString().split('T')[0],
        appointments: day._count.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}