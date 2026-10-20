import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/lib/auth';
import { authRateLimit } from '@/lib/rate-limit';
import { isBlockedEmailDomain } from '@/lib/signup-guard';
import { validateFields, MAX_LENGTHS } from '@/lib/validation';
import { classifySecretariatRequest } from '@/lib/ai/service';
import { logger } from '@/lib/logger';

// Contact form topics, mapped onto the secretariat's request types.
const TOPICS: Record<string, string> = {
  general: 'GENERAL_ENQUIRY',
  membership: 'MEMBERSHIP_QUERY',
  partnership: 'PARTNERSHIP',
  'second-opinion': 'SECOND_OPINION',
  technical: 'TECHNICAL_SUPPORT',
};

const TOPIC_LABELS: Record<string, string> = {
  general: 'General enquiry',
  membership: 'Membership',
  partnership: 'Partnership',
  'second-opinion': 'Second opinion',
  technical: 'Technical support',
};

// POST /api/contact — public contact form. Files a ticket in the secretariat inbox.
export async function POST(request: NextRequest) {
  try {
    // Unauthenticated and writes to the DB, so it gets the strict preset.
    const limited = await authRateLimit(request);
    if (limited) return limited;

    const body = await request.json();
    const { name, email, phone, subject, message, website } = body;

    // Honeypot: hidden from people, filled in by scripts. Pretend it worked.
    if (typeof website === 'string' && website.trim() !== '') {
      logger.warn?.('Contact', 'honeypot filled; submission dropped');
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const fieldError = validateFields(body, {
      name: { required: true, maxLength: MAX_LENGTHS.shortText },
      email: { required: true, maxLength: MAX_LENGTHS.email },
      phone: { maxLength: MAX_LENGTHS.shortText },
      subject: { required: true, maxLength: MAX_LENGTHS.shortText },
      message: { required: true, maxLength: MAX_LENGTHS.mediumText },
    });
    if (fieldError) return fieldError;

    if (!validateEmail(email) || isBlockedEmailDomain(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid, permanent email address.' },
        { status: 400 }
      );
    }
    if (!TOPICS[subject]) {
      return NextResponse.json({ error: 'Please choose a topic.' }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please tell us a little more about your enquiry.' },
        { status: 400 }
      );
    }

    const ticket = await prisma.secretariatTicket.create({
      data: {
        source: 'WEB',
        status: 'OPEN',
        requestType: TOPICS[subject],
        subject: `${TOPIC_LABELS[subject]} — ${name.trim()}`,
        rawMessage: message.trim(),
        fromName: name.trim(),
        fromEmail: email.trim().toLowerCase(),
        fromPhone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
      },
    });

    classifySecretariatRequest(message)
      .then((classification) =>
        prisma.secretariatTicket.update({
          where: { id: ticket.id },
          data: {
            intent: classification.type,
            aiClassification: classification as Prisma.InputJsonValue,
          },
        })
      )
      .catch((err) => logger.error('ContactClassify', err));

    return NextResponse.json({ success: true, reference: ticket.reference }, { status: 201 });
  } catch (error) {
    logger.error('Contact', error);
    return NextResponse.json(
      { error: 'We could not send your message. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}
