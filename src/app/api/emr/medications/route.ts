import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const status = searchParams.get('status') || 'ACTIVE';

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'MEDICATION',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const medications = await prisma.patientMedication.findMany({
      where: { patientId, status },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(medications);
  } catch (error) {
    logger.error('EMR:MedicationsList', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const {
      patientId, prescriptionId, drugName, brandName, dose, form,
      route, frequency, duration, indication, startDate, endDate, notes,
    } = body;

    if (!patientId || !drugName || !dose || !frequency) {
      return NextResponse.json(
        { error: 'patientId, drugName, dose, and frequency are required' },
        { status: 400 },
      );
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'MEDICATION',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const medication = await prisma.patientMedication.create({
      data: {
        patientId,
        prescribedById: payload.userId,
        prescriptionId,
        drugName,
        brandName,
        dose,
        form,
        route,
        frequency,
        duration,
        indication,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        notes,
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    logger.error('EMR:MedicationCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
