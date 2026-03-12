import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';
import { requireConsent } from '@/lib/consent';
import { validateFields, MAX_LENGTHS } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role !== UserRole.DFC_MEMBER) {
      return NextResponse.json({ error: 'Only DFC members can create prescriptions' }, { status: 403 });
    }

    const body = await request.json();
    const { encounterId, patientId, items, notes } = body;

    const fieldError = validateFields(body, {
      encounterId: { required: true, maxLength: MAX_LENGTHS.shortText },
      patientId: { required: true, maxLength: MAX_LENGTHS.shortText },
      notes: { maxLength: MAX_LENGTHS.mediumText },
    });
    if (fieldError) return fieldError;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one prescription item is required' },
        { status: 400 },
      );
    }

    // Check consent for TREATMENT before creating prescription
    const consentError = await requireConsent(patientId, 'TREATMENT');
    if (consentError) {
      return NextResponse.json({ error: consentError }, { status: 403 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'PRESCRIPTION',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const rxNumber = `RX-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const prescription = await prisma.prescription.create({
      data: {
        encounterId,
        patientId,
        prescribedById: payload.userId,
        rxNumber,
        notes,
        expiresAt,
        items: {
          create: items.map((item: {
            drugName: string;
            dose: string;
            form?: string;
            route?: string;
            frequency: string;
            duration: string;
            quantity?: string;
            instructions?: string;
          }) => ({
            drugName: item.drugName,
            dose: item.dose,
            form: item.form,
            route: item.route,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions,
          })),
        },
      },
      include: { items: true },
    });

    // Auto-create PatientMedication records for each item
    await Promise.all(
      items.map((item: {
        drugName: string;
        brandName?: string;
        dose: string;
        form?: string;
        route?: string;
        frequency: string;
        duration?: string;
        indication?: string;
      }) =>
        prisma.patientMedication.create({
          data: {
            patientId,
            prescribedById: payload.userId,
            prescriptionId: prescription.id,
            drugName: item.drugName,
            brandName: item.brandName,
            dose: item.dose,
            form: item.form,
            route: item.route,
            frequency: item.frequency,
            duration: item.duration,
            indication: item.indication,
          },
        }),
      ),
    );

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    logger.error('EMR:PrescriptionCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
