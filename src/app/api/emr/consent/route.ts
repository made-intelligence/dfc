import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

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

    return NextResponse.json(consent, { status: 201 });
  } catch (error) {
    logger.error('EMR:ConsentCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
