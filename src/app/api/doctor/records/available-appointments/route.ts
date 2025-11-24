import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true }
    });

    if (!user || user.role !== UserRole.DOCTOR || !user.doctorProfile) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get completed appointments that don't have medical records yet
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: user.id,
        status: 'COMPLETED',
        medicalRecord: null
      },
      select: {
        id: true,
        appointmentDate: true,
        patient: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching available appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}