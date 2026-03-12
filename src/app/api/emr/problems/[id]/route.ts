import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

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

    const problem = await prisma.patientProblem.findUnique({ where: { id } });
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, problem.patientId, 'UPDATED', 'PROBLEM', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes, resolvedDate } = body;

    const updated = await prisma.patientProblem.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(resolvedDate !== undefined && { resolvedDate: resolvedDate ? new Date(resolvedDate) : null }),
        ...(status === 'RESOLVED' && !resolvedDate && { resolvedDate: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('EMR:ProblemUpdate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
