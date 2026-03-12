import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { validateFields, MAX_LENGTHS } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { parsePagination } from '@/lib/pagination';
import { requireConsent } from '@/lib/consent';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const { page, limit, skip } = parsePagination(searchParams);

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    // Check consent for TREATMENT before allowing encounter access
    const consentError = await requireConsent(patientId, 'TREATMENT');
    if (consentError) {
      return NextResponse.json({ error: consentError }, { status: 403 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'ENCOUNTER',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

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

    const fieldError = validateFields(body, {
      patientId: { required: true, maxLength: MAX_LENGTHS.shortText },
      encounterType: { required: true, maxLength: MAX_LENGTHS.shortText },
      encounterDate: { required: true },
      chiefComplaint: { required: true, maxLength: MAX_LENGTHS.longText },
      subjective: { maxLength: MAX_LENGTHS.longText },
      objective: { maxLength: MAX_LENGTHS.longText },
      assessment: { maxLength: MAX_LENGTHS.longText },
      plan: { maxLength: MAX_LENGTHS.longText },
      primaryDiagnosis: { maxLength: MAX_LENGTHS.shortText },
      followUpNotes: { maxLength: MAX_LENGTHS.mediumText },
      location: { maxLength: MAX_LENGTHS.shortText },
    });
    if (fieldError) return fieldError;

    // Check consent for TREATMENT before creating encounter
    const consentError = await requireConsent(patientId, 'TREATMENT');
    if (consentError) {
      return NextResponse.json({ error: consentError }, { status: 403 });
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
