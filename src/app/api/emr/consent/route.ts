import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';
import { auditConsent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'CONSENT',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const consents = await prisma.patientConsent.findMany({
      where: { patientId },
      orderBy: { givenAt: 'desc' },
    });

    return NextResponse.json(consents);
  } catch (error) {
    logger.error('EMR:ConsentList', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { patientId, type, given, witnessName, documentUrl, notes } = body;

    if (!patientId || !type || given === undefined) {
      return NextResponse.json(
        { error: 'patientId, type, and given are required' },
        { status: 400 },
      );
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'CONSENT',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const CONSENT_TYPES = ['TREATMENT', 'TELEMEDICINE', 'SECOND_OPINION_SHARING', 'DATA_PROCESSING', 'RESEARCH', 'PHOTOGRAPHY'];
    if (!CONSENT_TYPES.includes(type) || typeof given !== 'boolean') {
      return NextResponse.json({ error: 'Invalid consent type or value' }, { status: 400 });
    }

    // Withdrawing consent must end the earlier grant; otherwise it stays
    // active, because consent checks look for any unrevoked grant.
    if (!given) {
      await prisma.patientConsent.updateMany({
        where: { patientId, type, given: true, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const consent = await prisma.patientConsent.create({
      data: {
        patientId,
        type,
        given,
        witnessName,
        documentUrl,
        notes,
      },
    });

    // A withdrawal is recorded as a new row with given=false.
    await (given ? auditConsent.grant : auditConsent.revoke)(payload.userId, 'patient_consent', consent.id, {
      patientProfileId: patientId,
      type,
      recordedBy: payload.role,
      witnessName,
    }, request);
    return NextResponse.json(consent, { status: 201 });
  } catch (error) {
    logger.error('EMR:ConsentCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
