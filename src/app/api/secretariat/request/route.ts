import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { classifySecretariatRequest } from '@/lib/ai/service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { requestType, description } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const ticket = await prisma.secretariatTicket.create({
      data: {
        userId: payload.userId,
        source: 'WEB',
        status: 'OPEN',
        requestType: requestType || 'GENERAL_ENQUIRY',
        rawMessage: description,
        subject: `${requestType || 'Request'} — ${user.name}`,
        fromName: user.name,
        fromPhone: user.phone,
      },
    });

    // Non-blocking AI classification
    classifySecretariatRequest(description)
      .then(async (classification) => {
        await prisma.secretariatTicket.update({
          where: { id: ticket.id },
          data: {
            intent: classification.type,
            aiClassification: classification as Prisma.InputJsonValue,
          },
        });
      })
      .catch((err) => logger.error('SecretariatRequestClassify', err));

    return NextResponse.json(
      { success: true, ticket: { id: ticket.id, reference: ticket.reference, status: ticket.status } },
      { status: 201 }
    );
  } catch (error) {
    logger.error('SecretariatRequest', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
