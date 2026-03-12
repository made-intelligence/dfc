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
    const showAll = searchParams.get('all') === 'true';

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'PROBLEM',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const where = showAll ? { patientId } : { patientId, status: 'ACTIVE' };

    const problems = await prisma.patientProblem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(problems);
  } catch (error) {
    logger.error('EMR:ProblemsList', error);
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
    const { patientId, problem, icdCode, onsetDate, notes } = body;

    if (!patientId || !problem) {
      return NextResponse.json({ error: 'patientId and problem are required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'PROBLEM',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const record = await prisma.patientProblem.create({
      data: {
        patientId,
        addedById: payload.userId,
        problem,
        icdCode,
        onsetDate: onsetDate ? new Date(onsetDate) : undefined,
        notes,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    logger.error('EMR:ProblemCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
