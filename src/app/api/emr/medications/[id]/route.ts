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

    const medication = await prisma.patientMedication.findUnique({ where: { id } });
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, medication.patientId, 'UPDATED', 'MEDICATION', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const body = await request.json();
    const { status, dose, frequency, endDate, discontinuedReason, notes } = body;

    const updated = await prisma.patientMedication.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(dose !== undefined && { dose }),
        ...(frequency !== undefined && { frequency }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(discontinuedReason !== undefined && { discontinuedReason }),
        ...(notes !== undefined && { notes }),
        ...(status === 'DISCONTINUED' && { endDate: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('EMR:MedicationUpdate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
