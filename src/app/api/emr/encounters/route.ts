import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'ENCOUNTER',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const skip = (page - 1) * limit;

    const [encounters, total] = await Promise.all([
      prisma.clinicalEncounter.findMany({
        where: { patientId },
        orderBy: { encounterDate: 'desc' },
        skip,
        take: limit,
        include: {
          doctor: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
      prisma.clinicalEncounter.count({ where: { patientId } }),
    ]);

    return NextResponse.json({
      encounters,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('EMR:EncountersList', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role !== UserRole.DFC_MEMBER) {
      return NextResponse.json({ error: 'Only DFC members can create encounters' }, { status: 403 });
    }

    const body = await request.json();
    const {
      patientId, appointmentId, encounterType, encounterDate, location,
      chiefComplaint, subjective, objective, assessment, plan,
      primaryDiagnosis, secondaryDiagnoses, isConfidential,
      followUpDate, followUpNotes,
    } = body;

    if (!patientId || !encounterType || !encounterDate || !chiefComplaint) {
      return NextResponse.json(
        { error: 'patientId, encounterType, encounterDate, and chiefComplaint are required' },
        { status: 400 },
      );
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'ENCOUNTER',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });
    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const encounter = await prisma.clinicalEncounter.create({
      data: {
        patientId,
        doctorId: doctorProfile.id,
        appointmentId: appointmentId || undefined,
        encounterType,
        encounterDate: new Date(encounterDate),
        location,
        chiefComplaint,
        subjective,
        objective,
        assessment,
        plan,
        primaryDiagnosis,
        secondaryDiagnoses,
        isConfidential: isConfidential || false,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        followUpNotes,
      },
    });

    return NextResponse.json(encounter, { status: 201 });
  } catch (error) {
    logger.error('EMR:EncounterCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
