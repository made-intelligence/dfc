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
    const status = searchParams.get('status');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'INVESTIGATION',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const where: Record<string, unknown> = { patientId };
    if (status) where.status = status;

    const investigations = await prisma.investigationOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { result: true },
    });

    return NextResponse.json(investigations);
  } catch (error) {
    logger.error('EMR:InvestigationsList', error);
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
    const { encounterId, patientId, type, name, instructions, urgency } = body;

    if (!encounterId || !patientId || !type || !name) {
      return NextResponse.json(
        { error: 'encounterId, patientId, type, and name are required' },
        { status: 400 },
      );
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'INVESTIGATION',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const investigation = await prisma.investigationOrder.create({
      data: {
        encounterId,
        patientId,
        orderedById: payload.userId,
        type,
        name,
        instructions,
        urgency: urgency || 'ROUTINE',
      },
    });

    return NextResponse.json(investigation, { status: 201 });
  } catch (error) {
    logger.error('EMR:InvestigationCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
