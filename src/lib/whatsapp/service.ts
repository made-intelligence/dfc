import 'server-only';
import { prisma } from '@/lib/prisma';
import type { WhatsAppConfig, SendMessageResult } from './types';

function getConfig(): WhatsAppConfig {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  };
}

function getBaseUrl(config: WhatsAppConfig): string {
  return `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
}

export function normalisePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+234' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

async function sendMessage(
  to: string,
  payload: Record<string, unknown>,
  templateName?: string,
  userId?: string
): Promise<SendMessageResult> {
  const config = getConfig();
  if (!config.accessToken) {
    console.warn('WhatsApp not configured — skipping send');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const phone = normalisePhone(to);
  try {
    const res = await fetch(getBaseUrl(config), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, ...payload }),
    });

    const data = await res.json();
    const messageId = data.messages?.[0]?.id;

    await prisma.whatsAppLog.create({
      data: {
        phone,
        direction: 'OUTBOUND',
        templateName: templateName || null,
        messageBody: JSON.stringify(payload).slice(0, 500),
        waMessageId: messageId || null,
        status: res.ok ? 'SENT' : 'FAILED',
        error: res.ok ? null : JSON.stringify(data.error || data),
        userId: userId || null,
      },
    });

    return res.ok
      ? { success: true, messageId }
      : { success: false, error: data.error?.message || 'Send failed' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await prisma.whatsAppLog.create({
      data: {
        phone,
        direction: 'OUTBOUND',
        templateName: templateName || null,
        messageBody: JSON.stringify(payload).slice(0, 500),
        status: 'FAILED',
        error: errorMsg,
        userId: userId || null,
      },
    });
    return { success: false, error: errorMsg };
  }
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  parameters: string[] = [],
  userId?: string
): Promise<SendMessageResult> {
  const components = parameters.length
    ? [{ type: 'body', parameters: parameters.map((p) => ({ type: 'text', text: p })) }]
    : [];

  return sendMessage(
    to,
    {
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      },
    },
    templateName,
    userId
  );
}

export async function sendTextMessage(
  to: string,
  body: string,
  userId?: string
): Promise<SendMessageResult> {
  return sendMessage(to, { type: 'text', text: { body } }, undefined, userId);
}

export async function sendWelcomeMessage(
  to: string,
  name: string,
  userId?: string
): Promise<SendMessageResult> {
  return sendTemplateMessage(to, 'dfc_welcome', [name], userId);
}

export async function sendClaimLink(
  to: string,
  name: string,
  claimUrl: string
): Promise<SendMessageResult> {
  return sendTemplateMessage(to, 'dfc_claim_link', [name, claimUrl]);
}
