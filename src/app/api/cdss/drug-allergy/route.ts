import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRecordAccess } from '@/lib/emr/access';
import { checkDrugAllergy } from '@/lib/ai/cdss';

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
    const { newDrug, newDrugClass, patientId, encounterId } = body;

    if (!newDrug || !patientId) {
      return NextResponse.json({ error: 'newDrug and patientId are required' }, { status: 400 });
    }

    // Enforce treatment relationship before reading this patient's allergies.
    const access = await checkRecordAccess(payload.userId, payload.role, patientId, 'VIEWED', 'CDSS:DrugAllergy');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 });
    }

    // Fetch patient allergies
    const allergies = await prisma.patientAllergy.findMany({
      where: { patientId, status: 'ACTIVE' },
    });

    // Get doctor profile for alert generation
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const result = await checkDrugAllergy(
      newDrug,
      newDrugClass,
      allergies.map((a) => ({
        allergen: a.allergen,
        allergyType: a.allergyType,
        reaction: a.reaction,
        severity: a.severity,
      })),
    );

    // Create CDSS alert if interaction found
    if (result.hasInteraction) {
      await prisma.cDSSAlert.create({
        data: {
          patientId,
          encounterId: encounterId || null,
          generatedForId: doctorProfile.id,
          level: result.level,
          category: 'DRUG_ALLERGY',
          title: result.title,
          body: `${result.explanation}\n\nSuggestion: ${result.suggestion}`,
          sourceData: { newDrug, newDrugClass, allergies: allergies.map((a) => a.allergen) },
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('CDSS:DrugAllergy', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
