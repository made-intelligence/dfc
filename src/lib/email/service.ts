import 'server-only';
import { getTransporter } from './transporter';
import { isZeptoConfigured, sendViaZepto, ZEPTO_FROM } from './zepto';
import { getEmailConfig } from './config';
import { prisma } from '@/lib/prisma';
import React from 'react';

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string; // For logging purposes
  component: React.ReactElement;
  metadata?: Record<string, any>;
}

export type EmailTransport = 'zeptomail' | 'smtp';

/**
 * MAIL_TRANSPORT picks the transport explicitly ("smtp" | "zeptomail").
 * Left unset, ZeptoMail wins when a key is present, since it is the path
 * known to deliver; SMTP (the admin Email Configuration) is the fallback.
 */
export function activeEmailTransport(): EmailTransport {
  const preference = (process.env.MAIL_TRANSPORT || '').toLowerCase();
  if (preference === 'zeptomail') return 'zeptomail';
  if (preference !== 'smtp' && isZeptoConfigured()) return 'zeptomail';
  return 'smtp';
}

export async function sendEmail({ to, subject, templateName, component, metadata }: SendEmailOptions) {
  try {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(component);

    const useZepto = activeEmailTransport() === 'zeptomail';
    let fromEmail = ZEPTO_FROM;

    if (useZepto) {
      await sendViaZepto({ to, subject, html });
    } else {
      const emailSettings = await getEmailConfig();
      fromEmail = emailSettings?.fromEmail || process.env.SMTP_FROM || '"Doctors Foundation for Care" <noreply@dfcare.org>';

      const transporter = await getTransporter();
      await transporter.sendMail({
        from: fromEmail,
        replyTo: emailSettings?.replyEmail || undefined,
        to,
        subject,
        html,
      });
    }

    // Log success
    await prisma.emailLog.create({
      data: {
        recipient: to,
        subject,
        template: templateName,
        status: 'SENT',
        metadata: { ...(metadata || {}), transport: useZepto ? 'zeptomail' : 'smtp', from: fromEmail },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send email:', error);

    // Log failure
    await prisma.emailLog.create({
      data: {
        recipient: to,
        subject,
        template: templateName,
        status: 'FAILED',
        error: error.message || 'Unknown error',
        metadata: metadata || {},
      },
    });

    return { success: false, error };
  }
}
