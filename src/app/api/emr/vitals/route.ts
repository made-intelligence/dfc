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

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'VITAL_SIGN',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const vitals = await prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
    });

    return NextResponse.json(vitals);
  } catch (error) {
    logger.error('EMR:VitalsList', error);
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
      return NextResponse.json({ error: 'Only DFC members can record vitals' }, { status: 403 });
    }

    const body = await request.json();
    const {
      patientId, encounterId, systolicBP, diastolicBP, heartRate,
      respiratoryRate, temperature, oxygenSat, weight, height,
      bloodGlucose, notes,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'VITAL_SIGN',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    // Auto-calculate BMI if weight and height provided
    let bmi: number | undefined;
    if (weight && height) {
      const weightKg = parseFloat(weight);
      const heightM = parseFloat(height) / 100; // assume cm
      if (heightM > 0) {
        bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
      }
    }

    const vital = await prisma.vitalSign.create({
      data: {
        patientId,
        encounterId: encounterId || undefined,
        recordedById: payload.userId,
        systolicBP: systolicBP ? parseInt(systolicBP) : undefined,
        diastolicBP: diastolicBP ? parseInt(diastolicBP) : undefined,
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        oxygenSat: oxygenSat ? parseFloat(oxygenSat) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        bmi,
        bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : undefined,
        notes,
      },
    });

    return NextResponse.json(vital, { status: 201 });
  } catch (error) {
    logger.error('EMR:VitalsCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
