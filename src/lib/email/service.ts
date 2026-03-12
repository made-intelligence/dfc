import 'server-only';
import { getTransporter } from './transporter';
import { prisma } from '@/lib/prisma';
import React from 'react';

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string; // For logging purposes
  component: React.ReactElement;
  metadata?: Record<string, any>;
}

export async function sendEmail({ to, subject, templateName, component, metadata }: SendEmailOptions) {
  try {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(component);

    // Get email configuration from database
    const settings = await prisma.systemSettings.findFirst();
    const emailSettings = settings?.email as any;
    const fromEmail = emailSettings?.fromEmail || process.env.SMTP_FROM || '"DFC Medical Support" <noreply@dfcmedical.com>';

    // Get transporter with database configuration
    const transporter = await getTransporter();

    // Send email
    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });

    // Log success
    await prisma.emailLog.create({
      data: {
        recipient: to,
        subject,
        template: templateName,
        status: 'SENT',
        metadata: metadata || {},
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
