import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRecordAccess } from '@/lib/emr/access';
import { generateDifferentials, CDSS_DISCLAIMER } from '@/lib/ai/cdss';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role !== 'DFC_MEMBER') {
      return NextResponse.json({ error: 'Only DFC members can access CDSS' }, { status: 403 });
    }

    const body = await request.json();
    const { chiefComplaint, symptoms, patientId, encounterId, vitals } = body;

    if (!chiefComplaint || !symptoms || !patientId) {
      return NextResponse.json(
        { error: 'chiefComplaint, symptoms, and patientId are required' },
        { status: 400 },
      );
    }

    // Enforce treatment relationship before reading this patient's context.
    const access = await checkRecordAccess(payload.userId, payload.role, patientId, 'VIEWED', 'CDSS:Differentials');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 });
    }

    // Fetch patient context
    const [patient, problems, medications] = await Promise.all([
      prisma.patientProfile.findUnique({
        where: { id: patientId },
        select: { dateOfBirth: true, gender: true },
      }),
      prisma.patientProblem.findMany({
        where: { patientId, status: 'ACTIVE' },
        select: { problem: true },
      }),
      prisma.patientMedication.findMany({
        where: { patientId, status: 'ACTIVE' },
        select: { drugName: true },
      }),
    ]);

    let patientAge: number | undefined;
    if (patient?.dateOfBirth) {
      const ageDiff = Date.now() - new Date(patient.dateOfBirth).getTime();
      patientAge = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Get doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const result = await generateDifferentials(
      chiefComplaint,
      Array.isArray(symptoms) ? symptoms : [symptoms],
      {
        age: patientAge,
        gender: patient?.gender || undefined,
        problems: problems.map((p) => p.problem),
        medications: medications.map((m) => m.drugName),
        vitals,
      },
    );

    // Create INFO-level alert
    if (result.differentials.length > 0) {
      await prisma.cDSSAlert.create({
        data: {
          patientId,
          encounterId: encounterId || null,
          generatedForId: doctorProfile.id,
          level: 'INFO',
          category: 'DIFFERENTIAL',
          title: `Differential diagnoses for: ${chiefComplaint}`,
          body: result.differentials
            .map((d) => `${d.diagnosis} (${d.probability})`)
            .join(', '),
          sourceData: {
            chiefComplaint,
            symptoms,
            differentialCount: result.differentials.length,
            redFlags: result.redFlags,
          },
        },
      });
    }

    return NextResponse.json({
      ...result,
      disclaimer: CDSS_DISCLAIMER,
    });
  } catch (error) {
    logger.error('CDSS:Differentials', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
