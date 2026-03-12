import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { classifySecretariatRequest } from '@/lib/ai/service';
import { sendTextMessage } from '@/lib/whatsapp/service';
import type { WhatsAppWebhookEntry } from '@/lib/whatsapp/types';
import { logger } from '@/lib/logger';

import crypto from 'crypto';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'dfc_webhook_verify_secret';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && timingSafeEqual(token, VERIFY_TOKEN)) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Incoming messages + status updates (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries: WhatsAppWebhookEntry[] = body.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes) {
        const value = change.value;

        // Handle status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await prisma.whatsAppLog.updateMany({
              where: { waMessageId: status.id },
              data: { status: status.status.toUpperCase() },
            });
          }
        }

        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
          // Batch: collect unique phone suffixes and do a single user lookup
          const phoneNumbers = value.messages.map((msg: { from: string }) => msg.from);
          const uniqueSuffixes = [...new Set(phoneNumbers.map((p: string) => p.slice(-10)))];
          const matchedUsers = await prisma.user.findMany({
            where: { OR: uniqueSuffixes.map(suffix => ({ phone: { contains: suffix } })) },
            select: { id: true, phone: true },
          });
          const phoneToUser = new Map(
            matchedUsers.map(u => [u.phone?.slice(-10) || '', u])
          );

          for (const msg of value.messages) {
            const phone = msg.from;
            const text = msg.text?.body || '';
            const contactName = value.contacts?.[0]?.profile?.name || 'Unknown';

            // Log inbound message
            await prisma.whatsAppLog.create({
              data: {
                phone: `+${phone}`,
                direction: 'INBOUND',
                messageBody: text,
                waMessageId: msg.id,
                status: 'SENT',
              },
            });

            // Match to existing user by phone (from batch lookup)
            const matchedUser = phoneToUser.get(phone.slice(-10)) || null;

            // Classify intent
            let classification;
            try {
              classification = await classifySecretariatRequest(text);
            } catch {
              classification = {
                type: 'GENERAL_ENQUIRY',
                priority: 'NORMAL',
                draftReply: 'Thank you for contacting the DFC Secretariat. We will review your message and respond shortly.',
              };
            }

            // Create secretariat ticket
            await prisma.secretariatTicket.create({
              data: {
                source: 'WHATSAPP',
                fromPhone: `+${phone}`,
                fromName: contactName,
                userId: matchedUser?.id || null,
                rawMessage: text,
                intent: classification.type,
                requestType: classification.type,
                aiClassification: classification as Prisma.InputJsonValue,
                status: 'OPEN',
                subject: `WhatsApp message from ${contactName}`,
              },
            });

            // Send auto-reply
            if (classification.draftReply) {
              await sendTextMessage(
                `+${phone}`,
                classification.draftReply,
                matchedUser?.id
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error('WhatsAppWebhook', error);
    return NextResponse.json({ success: true }, { status: 200 }); // Always 200 to Meta
  }
}
