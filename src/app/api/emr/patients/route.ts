import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

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

    if (payload.role !== UserRole.DFC_MEMBER) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find distinct patients from confirmed/completed appointments for this doctor
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: payload.userId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      select: { patientId: true },
      distinct: ['patientId'],
    });

    const patientUserIds = appointments.map((a) => a.patientId);

    if (patientUserIds.length === 0) {
      return NextResponse.json({ patients: [] });
    }

    // Batch query: get all patient profiles with counts in one go
    const patientProfiles = await prisma.patientProfile.findMany({
      where: { userId: { in: patientUserIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            encounters: true,
            allergiesStructured: true,
            problemList: true,
          },
        },
        encounters: {
          orderBy: { encounterDate: 'desc' },
          take: 1,
          select: { encounterDate: true },
        },
      },
    });

    const patients = patientProfiles.map((pp) => ({
      patientProfileId: pp.id,
      userId: pp.userId,
      name: pp.user.name,
      email: pp.user.email,
      phone: pp.user.phone,
      profileImage: pp.user.profileImage,
      dateOfBirth: pp.dateOfBirth,
      bloodGroup: pp.bloodGroup,
      gender: pp.gender,
      encounterCount: pp._count.encounters,
      lastEncounterDate: pp.encounters[0]?.encounterDate || null,
      allergyCount: pp._count.allergiesStructured,
      problemCount: pp._count.problemList,
    }));

    return NextResponse.json({ patients });
  } catch (error) {
    logger.error('EMR:PatientsList', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
