import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { patient: { name: { contains: search, mode: 'insensitive' as const } } },
        { doctor: { name: { contains: search, mode: 'insensitive' as const } } }
      ]
    } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [appointments, todayTotal, confirmed, pending, cancelled] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appointmentDate: 'desc' },
        include: {
          patient: {
            select: { name: true }
          },
          doctor: {
            select: { name: true }
          }
        }
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          status: 'CONFIRMED'
        }
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          status: 'PENDING'
        }
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          status: 'CANCELLED'
        }
      })
    ]);

    const appointmentsWithDetails = appointments.map(appointment => ({
      id: appointment.id,
      patient: appointment.patient.name,
      doctor: appointment.doctor.name,
      date: appointment.appointmentDate.toISOString().split('T')[0],
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status.toLowerCase(),
      reason: appointment.reason,
      consultationFee: appointment.consultationFee
    }));

    return NextResponse.json({
      appointments: appointmentsWithDetails,
      stats: {
        todayTotal,
        confirmed,
        pending,
        cancelled
      },
      pagination: {
        page,
        limit,
        total: appointments.length,
        pages: Math.ceil(appointments.length / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}