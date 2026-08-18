import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRecordAccess } from '@/lib/emr/access';
import { calculateRiskScores } from '@/lib/ai/cdss';

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
    const { patientId, encounterId } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    // Enforce treatment relationship before reading this patient's vitals.
    const access = await checkRecordAccess(payload.userId, payload.role, patientId, 'VIEWED', 'CDSS:RiskScores');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 });
    }

    // Fetch latest vitals
    const latestVitals = await prisma.vitalSign.findFirst({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latestVitals) {
      return NextResponse.json({ error: 'No vitals recorded for this patient' }, { status: 404 });
    }

    // Get doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const scores = calculateRiskScores({
      systolicBP: latestVitals.systolicBP,
      diastolicBP: latestVitals.diastolicBP,
      heartRate: latestVitals.heartRate,
      respiratoryRate: latestVitals.respiratoryRate,
      temperature: latestVitals.temperature ? Number(latestVitals.temperature) : null,
      oxygenSat: latestVitals.oxygenSat ? Number(latestVitals.oxygenSat) : null,
      bloodGlucose: latestVitals.bloodGlucose ? Number(latestVitals.bloodGlucose) : null,
    });

    // Batch-create alerts for HIGH/CRITICAL scores
    const alertableScores = scores.filter(
      (score) => score.level === 'CRITICAL' || score.level === 'WARNING',
    );
    if (alertableScores.length > 0) {
      await prisma.cDSSAlert.createMany({
        data: alertableScores.map((score) => ({
          patientId,
          encounterId: encounterId || null,
          generatedForId: doctorProfile.id,
          level: score.level,
          category: 'RISK_SCORE',
          title: `${score.scoreName}: ${score.interpretation}`,
          body: score.recommendation,
          sourceData: {
            scoreName: score.scoreName,
            score: score.score,
            vitalsRecordedAt: latestVitals.recordedAt.toISOString(),
          },
        })),
      });
    }

    return NextResponse.json({ scores, vitalsRecordedAt: latestVitals.recordedAt });
  } catch (error) {
    logger.error('CDSS:RiskScores', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
