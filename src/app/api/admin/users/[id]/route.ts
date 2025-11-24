import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id, role: 'PATIENT' },
      include: {
        patientProfile: true,
        createdAppointments: {
          include: {
            doctor: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: user.patientProfile,
      recentAppointments: user.createdAppointments.map(apt => ({
        id: apt.id,
        date: apt.appointmentDate,
        doctor: apt.doctor.name,
        status: apt.status
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}