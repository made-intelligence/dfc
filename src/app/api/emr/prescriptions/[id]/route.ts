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

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        encounter: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            patient: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, prescription.patientId, 'VIEWED', 'PRESCRIPTION', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    return NextResponse.json(prescription);
  } catch (error) {
    logger.error('EMR:PrescriptionDetail', error);
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

    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, prescription.patientId, 'UPDATED', 'PRESCRIPTION', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Only cancellation is supported via PATCH' }, { status: 400 });
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('EMR:PrescriptionCancel', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
