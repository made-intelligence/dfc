import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;

    const encounter = await prisma.clinicalEncounter.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        doctor: {
          include: { user: { select: { name: true } } },
        },
        documents: true,
        prescriptions: { include: { items: true } },
        investigations: { include: { result: true } },
        referrals: true,
        vitalSigns: true,
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, encounter.patientId, 'VIEWED', 'ENCOUNTER', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    return NextResponse.json(encounter);
  } catch (error) {
    logger.error('EMR:EncounterDetail', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;

    const encounter = await prisma.clinicalEncounter.findUnique({ where: { id } });
    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, encounter.patientId, 'UPDATED', 'ENCOUNTER', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const body = await request.json();
    const { subjective, objective, assessment, plan, status, primaryDiagnosis,
      secondaryDiagnoses, followUpDate, followUpNotes } = body;

    // Only treating doctor can sign
    if (status === 'SIGNED') {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: payload.userId },
      });
      if (!doctorProfile || doctorProfile.id !== encounter.doctorId) {
        return NextResponse.json(
          { error: 'Only the treating doctor can sign this encounter' },
          { status: 403 },
        );
      }
    }

    const updated = await prisma.clinicalEncounter.update({
      where: { id },
      data: {
        ...(subjective !== undefined && { subjective }),
        ...(objective !== undefined && { objective }),
        ...(assessment !== undefined && { assessment }),
        ...(plan !== undefined && { plan }),
        ...(primaryDiagnosis !== undefined && { primaryDiagnosis }),
        ...(secondaryDiagnoses !== undefined && { secondaryDiagnoses }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(followUpNotes !== undefined && { followUpNotes }),
        ...(status && { status }),
        ...(status === 'SIGNED' && { signedAt: new Date(), signedById: payload.userId }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('EMR:EncounterUpdate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;

    const encounter = await prisma.clinicalEncounter.findUnique({ where: { id } });
    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, encounter.patientId, 'UPDATED', 'ENCOUNTER', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    if (encounter.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT encounters can be deleted' },
        { status: 400 },
      );
    }

    const hoursSinceCreation =
      (Date.now() - new Date(encounter.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        { error: 'Cannot delete encounters older than 24 hours' },
        { status: 400 },
      );
    }

    await prisma.clinicalEncounter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('EMR:EncounterDelete', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
