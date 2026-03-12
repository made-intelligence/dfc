import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';
import { requireConsent } from '@/lib/consent';
import { auditData } from '@/lib/audit';

/**
 * GET /api/emr/export/[patientId]
 * Export full patient record as JSON — NDPR / data portability compliance
 * Only accessible by the patient themselves or admin
 */
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
      payload.userId,
      payload.role as UserRole,
      patientId,
      'DOWNLOADED',
      'FULL_EXPORT',
    );

    if (!access.allowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Enforce DATA_PROCESSING consent before export
    const consentError = await requireConsent(patientId, 'DATA_PROCESSING');
    if (consentError) {
      return NextResponse.json({ error: consentError }, { status: 403 });
    }

    // Audit the data export
    auditData.export(payload.userId, 'patient', patientId, request);

    const [
      patientProfile,
      encounters,
      vitals,
      problems,
      allergies,
      medications,
      prescriptions,
      investigations,
      documents,
      consents,
    ] = await Promise.all([
      prisma.patientProfile.findUnique({
        where: { id: patientId },
        include: {
          user: {
            select: { name: true, email: true, phone: true, profileImage: true },
          },
        },
      }),
      prisma.clinicalEncounter.findMany({
        where: { patientId },
        orderBy: { encounterDate: 'desc' },
        include: {
          doctor: {
            select: {
              title: true,
              user: { select: { name: true } },
              specialty: { select: { name: true } },
            },
          },
        },
      }),
      prisma.vitalSign.findMany({
        where: { patientId },
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.patientProblem.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patientAllergy.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patientMedication.findMany({
        where: { patientId },
        orderBy: { startDate: 'desc' },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.investigationOrder.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: { result: true },
      }),
      prisma.clinicalDocument.findMany({
        where: { patientId, isPatientVisible: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patientConsent.findMany({
        where: { patientId },
        orderBy: { givenAt: 'desc' },
      }),
    ]);

    if (!patientProfile) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportFormat: 'DFC-EMR-EXPORT-v1',
      patient: {
        name: patientProfile.user.name,
        email: patientProfile.user.email,
        phone: patientProfile.user.phone,
        dateOfBirth: patientProfile.dateOfBirth,
        gender: patientProfile.gender,
        bloodGroup: patientProfile.bloodGroup,
        nationality: patientProfile.nationality,
        occupation: patientProfile.occupation,
        maritalStatus: patientProfile.maritalStatus,
        nhisNumber: patientProfile.nhisNumber,
        hmoName: patientProfile.hmoName,
      },
      encounters: encounters.map((e) => ({
        date: e.encounterDate,
        type: e.encounterType,
        chiefComplaint: e.chiefComplaint,
        subjective: e.subjective,
        objective: e.objective,
        assessment: e.assessment,
        plan: e.plan,
        primaryDiagnosis: e.primaryDiagnosis,
        status: e.status,
        doctor: e.doctor
          ? `${e.doctor.title || ''} ${e.doctor.user.name} (${e.doctor.specialty?.name || 'N/A'})`
          : 'Unknown',
      })),
      vitals: vitals.map((v) => ({
        date: v.recordedAt,
        systolicBP: v.systolicBP,
        diastolicBP: v.diastolicBP,
        heartRate: v.heartRate,
        temperature: v.temperature,
        oxygenSat: v.oxygenSat,
        weight: v.weight,
        height: v.height,
        bmi: v.bmi,
      })),
      problems: problems.map((p) => ({
        problem: p.problem,
        status: p.status,
        icdCode: p.icdCode,
        onsetDate: p.onsetDate,
        resolvedDate: p.resolvedDate,
        notes: p.notes,
      })),
      allergies: allergies.map((a) => ({
        allergen: a.allergen,
        allergyType: a.allergyType,
        severity: a.severity,
        reaction: a.reaction,
        createdAt: a.createdAt,
      })),
      medications: medications.map((m) => ({
        drugName: m.drugName,
        dose: m.dose,
        frequency: m.frequency,
        route: m.route,
        status: m.status,
        startDate: m.startDate,
        endDate: m.endDate,
        indication: m.indication,
      })),
      prescriptions: prescriptions.map((rx) => ({
        rxNumber: rx.rxNumber,
        status: rx.status,
        createdAt: rx.createdAt,
        items: rx.items.map((item) => ({
          drugName: item.drugName,
          dose: item.dose,
          form: item.form,
          route: item.route,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions,
        })),
      })),
      investigations: investigations.map((inv) => ({
        type: inv.type,
        name: inv.name,
        urgency: inv.urgency,
        status: inv.status,
        createdAt: inv.createdAt,
        result: inv.result
          ? {
              testName: inv.result.testName,
              interpretation: inv.result.interpretation,
              isAbnormal: inv.result.isAbnormal,
              reportDate: inv.result.reportDate,
            }
          : null,
      })),
      documents: documents.map((d) => ({
        type: d.type,
        title: d.title,
        description: d.description,
        fileUrl: d.fileUrl,
        createdAt: d.createdAt,
      })),
      consents: consents.map((c) => ({
        type: c.type,
        given: c.given,
        givenAt: c.givenAt,
        revokedAt: c.revokedAt,
        notes: c.notes,
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dfc-health-record-${patientId}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error('EMRExport', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
