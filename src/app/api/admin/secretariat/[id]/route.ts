import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== UserRole.SECRETARIAT && user.role !== UserRole.SUPERADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const ticket = await prisma.secretariatTicket.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    logger.error('AdminSecretariatDetail', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== UserRole.SECRETARIAT && user.role !== UserRole.SUPERADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const data: Prisma.SecretariatTicketUpdateInput = {};
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.resolution !== undefined) data.notes = body.resolution;
    if (body.assignedToId !== undefined) data.assignedTo = { connect: { id: body.assignedToId } };
    if (body.status === 'COMPLETED' || body.status === 'CLOSED') {
      data.resolvedAt = new Date();
    }

    const ticket = await prisma.secretariatTicket.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    logger.error('AdminSecretariatDetail', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
