import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { sendTextMessage } from '@/lib/whatsapp/service';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';
import React from 'react';
import { sendEmail } from '@/lib/email/service';
import SecretariatReply from '@/emails/SecretariatReply';

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

    const ticket = await prisma.secretariatTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // WhatsApp when we have a number (that is how most tickets arrive),
    // otherwise email: web contact-form and portal tickets often have no phone.
    const replyEmail = ticket.fromEmail || ticket.user?.email || null;
    let channel: 'whatsapp' | 'email';
    let result: unknown;

    if (ticket.fromPhone) {
      channel = 'whatsapp';
      result = await sendTextMessage(ticket.fromPhone, message, ticket.userId || undefined);
    } else if (replyEmail) {
      channel = 'email';
      result = await sendEmail({
        to: replyEmail,
        subject: ticket.subject ? `Re: ${ticket.subject}` : 'A reply from the DFC Secretariat',
        templateName: 'secretariat-reply',
        component: React.createElement(SecretariatReply, {
          name: ticket.fromName || ticket.user?.name || 'there',
          message,
          originalMessage: ticket.rawMessage,
        }),
        metadata: { ticketId: ticket.id },
      });
      if (!(result as { success?: boolean }).success) {
        return NextResponse.json({ error: 'The reply email could not be sent' }, { status: 502 });
      }
    } else {
      return NextResponse.json(
        { error: 'This ticket has no phone number or email address to reply to' },
        { status: 400 }
      );
    }

    // Update ticket status
    await prisma.secretariatTicket.update({
      where: { id: ticketId },
      data: {
        status: 'AWAITING_MEMBER',
        notes: ticket.notes
          ? `${ticket.notes}\n\n--- Reply sent (${channel}) ---\n${message}`
          : `--- Reply sent (${channel}) ---\n${message}`,
      },
    });

    return NextResponse.json({ success: true, channel, result });
  } catch (error) {
    logger.error('AdminSecretariatReply', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
