import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenue,
      lastMonthRevenue,
      newPatients,
      lastMonthPatients,
      totalAppointments,
      lastMonthAppointments,
      completionRate,
      topSpecialties,
      peakHours
    ] = await Promise.all([
      // Total revenue this month
      prisma.payment.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { amount: true }
      }),
      // Last month revenue
      prisma.payment.aggregate({
        where: { 
          createdAt: { 
            gte: lastMonth,
            lt: thisMonth
          }
        },
        _sum: { amount: true }
      }),
      // New patients this month
      prisma.user.count({
        where: {
          role: 'PATIENT',
          createdAt: { gte: thisMonth }
        }
      }),
      // Last month patients
      prisma.user.count({
        where: {
          role: 'PATIENT',
          createdAt: { 
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      // Total appointments this month
      prisma.appointment.count({
        where: { createdAt: { gte: thisMonth } }
      }),
      // Last month appointments
      prisma.appointment.count({
        where: { 
          createdAt: { 
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      // Completion rate
      prisma.appointment.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { createdAt: { gte: thisMonth } }
      }),
      // Top specialties
      prisma.doctorProfile.groupBy({
        by: ['specialty'],
        _count: { specialty: true },
        orderBy: { _count: { specialty: 'desc' } },
        take: 5
      }),
      // Peak hours (simplified)
      prisma.appointment.groupBy({
        by: ['startTime'],
        _count: { startTime: true },
        orderBy: { _count: { startTime: 'desc' } },
        take: 5
      })
    ]);

    const revenueGrowth = lastMonthRevenue._sum.amount 
      ? ((totalRevenue._sum.amount || 0) - (lastMonthRevenue._sum.amount || 0)) / (lastMonthRevenue._sum.amount || 1) * 100
      : 0;

    const patientGrowth = lastMonthPatients 
      ? ((newPatients - lastMonthPatients) / lastMonthPatients) * 100
      : 0;

    const appointmentGrowth = lastMonthAppointments 
      ? ((totalAppointments - lastMonthAppointments) / lastMonthAppointments) * 100
      : 0;

    const totalAppointmentsThisMonth = completionRate.reduce((sum, item) => sum + item._count.status, 0);
    const completedAppointments = completionRate.find(item => item.status === 'COMPLETED')?._count.status || 0;
    const completionPercentage = totalAppointmentsThisMonth > 0 
      ? (completedAppointments / totalAppointmentsThisMonth) * 100 
      : 0;

    return NextResponse.json({
      metrics: {
        totalRevenue: totalRevenue._sum.amount || 0,
        revenueGrowth,
        newPatients,
        patientGrowth,
        totalAppointments,
        appointmentGrowth,
        completionRate: completionPercentage
      },
      topSpecialties: topSpecialties.map(item => ({
        specialty: item.specialty,
        count: item._count.specialty
      })),
      peakHours: peakHours.map(item => ({
        time: item.startTime,
        appointments: item._count.startTime
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}