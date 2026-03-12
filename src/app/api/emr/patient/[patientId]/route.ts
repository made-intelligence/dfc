import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { patientId } = await params;

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'FULL_RECORD',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const [allergies, problemList, currentMedications, latestVitals, encounters, consents] =
      await Promise.all([
        prisma.patientAllergy.findMany({
          where: { patientId, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.patientProblem.findMany({
          where: { patientId, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.patientMedication.findMany({
          where: { patientId, status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
        }),
        prisma.vitalSign.findMany({
          where: { patientId },
          orderBy: { recordedAt: 'desc' },
          take: 1,
        }),
        prisma.clinicalEncounter.findMany({
          where: { patientId },
          orderBy: { encounterDate: 'desc' },
          take: 5,
          include: {
            doctor: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        }),
        prisma.patientConsent.findMany({
          where: { patientId, revokedAt: null },
          orderBy: { givenAt: 'desc' },
        }),
      ]);

    return NextResponse.json({
      patient,
      allergies,
      problemList,
      currentMedications,
      latestVitals: latestVitals[0] || null,
      encounters,
      consentStatus: consents,
    });
  } catch (error) {
    logger.error('EMR:PatientSummary', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
