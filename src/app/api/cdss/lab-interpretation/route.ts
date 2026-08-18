import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRecordAccess } from '@/lib/emr/access';
import { interpretAbnormalLab } from '@/lib/ai/cdss';

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
    const { labResultId, patientId } = body;

    if (!labResultId || !patientId) {
      return NextResponse.json({ error: 'labResultId and patientId are required' }, { status: 400 });
    }

    // Enforce treatment relationship before reading this patient's lab data.
    const access = await checkRecordAccess(payload.userId, payload.role, patientId, 'VIEWED', 'CDSS:LabInterpretation');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 });
    }

    // Fetch lab result
    const labResult = await prisma.labResult.findUnique({
      where: { id: labResultId },
    });

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    if (labResult.patientId !== patientId) {
      return NextResponse.json({ error: 'Lab result does not belong to this patient' }, { status: 400 });
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

    // Parse results JSON
    const results = (labResult.results as Array<{ test: string; value: string; unit: string; refRange: string; flag: string }>) || [];

    const interpretation = await interpretAbnormalLab(
      {
        testName: labResult.testName,
        results,
        labName: labResult.labName || undefined,
        reportDate: labResult.reportDate.toISOString().split('T')[0],
      },
      {
        age: patientAge,
        gender: patient?.gender || undefined,
        problems: problems.map((p) => p.problem),
        medications: medications.map((m) => m.drugName),
      },
    );

    // Create alert with level based on urgency
    const alertLevel = interpretation.urgency === 'CRITICAL' ? 'CRITICAL' as const
      : interpretation.urgency === 'URGENT' ? 'WARNING' as const
      : 'INFO' as const;

    await prisma.cDSSAlert.create({
      data: {
        patientId,
        encounterId: null,
        generatedForId: doctorProfile.id,
        level: alertLevel,
        category: 'LAB_CRITICAL',
        title: `Lab interpretation: ${labResult.testName}`,
        body: interpretation.summary,
        sourceData: {
          labResultId,
          testName: labResult.testName,
          urgency: interpretation.urgency,
          criticalFindings: interpretation.criticalFindings,
        },
      },
    });

    return NextResponse.json(interpretation);
  } catch (error) {
    logger.error('CDSS:LabInterpretation', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
