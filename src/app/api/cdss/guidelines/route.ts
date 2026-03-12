import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getGuidelineReminders } from '@/lib/ai/cdss';

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
    const { diagnosis, patientId, encounterId } = body;

    if (!diagnosis || !patientId) {
      return NextResponse.json({ error: 'diagnosis and patientId are required' }, { status: 400 });
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

    const reminders = await getGuidelineReminders(diagnosis, {
      age: patientAge,
      gender: patient?.gender || undefined,
      problems: problems.map((p) => p.problem),
      medications: medications.map((m) => m.drugName),
    });

    // Create alert for each reminder
    for (const reminder of reminders) {
      await prisma.cDSSAlert.create({
        data: {
          patientId,
          encounterId: encounterId || null,
          generatedForId: doctorProfile.id,
          level: reminder.priority === 'HIGH' ? 'WARNING' : 'INFO',
          category: 'GUIDELINE',
          title: `[${reminder.category}] ${reminder.reminder.slice(0, 100)}`,
          body: reminder.reminder,
          sourceData: { diagnosis, category: reminder.category, priority: reminder.priority },
        },
      });
    }

    return NextResponse.json({ reminders });
  } catch (error) {
    logger.error('CDSS:Guidelines', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
