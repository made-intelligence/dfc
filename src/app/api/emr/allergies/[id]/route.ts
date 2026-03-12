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

    const allergy = await prisma.patientAllergy.findUnique({ where: { id } });
    if (!allergy) {
      return NextResponse.json({ error: 'Allergy not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, allergy.patientId, 'UPDATED', 'ALLERGY', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const body = await request.json();
    const { severity, status, notes } = body;

    const updated = await prisma.patientAllergy.update({
      where: { id },
      data: {
        ...(severity !== undefined && { severity }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('EMR:AllergyUpdate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
