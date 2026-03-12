import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { sendTextMessage } from '@/lib/whatsapp/service';
import { UserRole } from '@prisma/client';
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

    const ticket = await prisma.secretariatTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!ticket.fromPhone) {
      return NextResponse.json({ error: 'No phone number on this ticket' }, { status: 400 });
    }

    const result = await sendTextMessage(ticket.fromPhone, message, ticket.userId || undefined);

    // Update ticket status
    await prisma.secretariatTicket.update({
      where: { id: ticketId },
      data: {
        status: 'AWAITING_MEMBER',
        notes: ticket.notes
          ? `${ticket.notes}\n\n--- Reply sent ---\n${message}`
          : `--- Reply sent ---\n${message}`,
      },
    });

    return NextResponse.json({ success: true, whatsappResult: result });
  } catch (error) {
    logger.error('AdminSecretariatReply', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
