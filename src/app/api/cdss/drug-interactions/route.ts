import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRecordAccess } from '@/lib/emr/access';
import { checkDrugInteractions } from '@/lib/ai/cdss';

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
    const { newDrug, patientId, encounterId } = body;

    if (!newDrug || !patientId) {
      return NextResponse.json({ error: 'newDrug and patientId are required' }, { status: 400 });
    }

    // Enforce that the caller has a treatment relationship with this patient
    // before reading any of their clinical data (prevents cross-patient IDOR).
    const access = await checkRecordAccess(payload.userId, payload.role, patientId, 'VIEWED', 'CDSS:DrugInteractions');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 });
    }

    // Fetch active medications
    const medications = await prisma.patientMedication.findMany({
      where: { patientId, status: 'ACTIVE' },
    });

    // Fetch patient age
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { dateOfBirth: true },
    });

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

    const interactions = await checkDrugInteractions(
      newDrug,
      medications.map((m) => ({
        drugName: m.drugName,
        dose: m.dose,
        frequency: m.frequency,
      })),
      patientAge,
    );

    // Batch-create alerts for CRITICAL and MODERATE interactions
    const alertableInteractions = interactions.filter(
      (interaction) => interaction.severity === 'CRITICAL' || interaction.severity === 'MODERATE',
    );
    if (alertableInteractions.length > 0) {
      await prisma.cDSSAlert.createMany({
        data: alertableInteractions.map((interaction) => ({
          patientId,
          encounterId: encounterId || null,
          generatedForId: doctorProfile.id,
          level: interaction.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          category: 'DRUG_INTERACTION',
          title: `${newDrug} interacts with ${interaction.withDrug}`,
          body: `Mechanism: ${interaction.mechanism}\nClinical Effect: ${interaction.clinicalEffect}\nRecommendation: ${interaction.recommendation}`,
          sourceData: { newDrug, withDrug: interaction.withDrug, severity: interaction.severity },
        })),
      });
    }

    return NextResponse.json({ interactions });
  } catch (error) {
    logger.error('CDSS:DrugInteractions', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
