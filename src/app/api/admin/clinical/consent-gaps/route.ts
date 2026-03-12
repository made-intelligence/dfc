import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (isAuthError(authResult)) return authResult;

    // Find patients with COMPLETED appointments
    const patientsWithCompletedAppointments = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: { status: 'COMPLETED' },
      _count: { id: true },
    });

    const patientIds = patientsWithCompletedAppointments.map((p) => p.patientId);

    if (patientIds.length === 0) {
      return NextResponse.json({ success: true, consentGaps: [] });
    }

    // Find which of these patients have a TELEMEDICINE consent
    const patientsWithConsent = await prisma.patientConsent.findMany({
      where: {
        patient: { userId: { in: patientIds } },
        type: 'TELEMEDICINE',
        given: true,
        revokedAt: null,
      },
      select: {
        patient: {
          select: { userId: true },
        },
      },
    });

    const consentedUserIds = new Set(patientsWithConsent.map((c) => c.patient.userId));

    // Filter to patients missing TELEMEDICINE consent
    const missingConsentPatientIds = patientIds.filter((id) => !consentedUserIds.has(id));

    if (missingConsentPatientIds.length === 0) {
      return NextResponse.json({ success: true, consentGaps: [] });
    }

    // Fetch patient details and counts
    const patients = await prisma.user.findMany({
      where: { id: { in: missingConsentPatientIds } },
      select: { id: true, name: true, email: true },
    });

    const countMap = new Map(
      patientsWithCompletedAppointments.map((p) => [p.patientId, p._count.id])
    );

    const consentGaps = patients.map((patient) => ({
      patientId: patient.id,
      patientName: patient.name,
      patientEmail: patient.email,
      completedAppointments: countMap.get(patient.id) ?? 0,
      consentStatus: 'No consent on file',
    }));

    return NextResponse.json({ success: true, consentGaps });
  } catch (error) {
    logger.error('AdminClinicalConsentGaps', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
