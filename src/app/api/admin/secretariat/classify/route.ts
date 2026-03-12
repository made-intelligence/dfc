import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { classifySecretariatRequest } from '@/lib/ai/service';
import { UserRole, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== UserRole.SECRETARIAT && user.role !== UserRole.SUPERADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ticketId, message } = await request.json();
    if (!ticketId || !message) {
      return NextResponse.json({ error: 'ticketId and message are required' }, { status: 400 });
    }

    const classification = await classifySecretariatRequest(message);

    await prisma.secretariatTicket.update({
      where: { id: ticketId },
      data: {
        intent: classification.type,
        aiClassification: classification as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true, classification });
  } catch (error) {
    logger.error('AdminSecretariatClassify', error);
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 });
  }
}
