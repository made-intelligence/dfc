import 'server-only';
import crypto from 'crypto';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { appUrl } from '@/lib/app-url';
import { secureEquals } from '@/lib/secure-compare';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import SecondOpinionUpdate, { type SecondOpinionEvent } from '@/emails/SecondOpinionUpdate';

/**
 * Second opinion report delivery.
 *
 * Most second opinion requesters have no DFC account, so the report reaches
 * them through an emailed link rather than a portal. The link carries an HMAC
 * of the case id: unguessable, verifiable without a DB lookup, and valid only
 * for that one case.
 */

function signingKey(): string {
  return process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
}

export function reportToken(caseId: string): string {
  return crypto
    .createHmac('sha256', signingKey())
    .update(`second-opinion-report:${caseId}`)
    .digest('base64url');
}

export function verifyReportToken(caseId: string, token: string | null | undefined): boolean {
  return secureEquals(token, reportToken(caseId));
}

export function reportUrl(caseId: string): string {
  return `${appUrl()}/second-opinion/report/${caseId}?t=${reportToken(caseId)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape first, then apply the light markdown the specialists write in. */
function formatReportBody(text: string): string {
  return escapeHtml(text)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

export interface ReportData {
  reference: string;
  patientName: string;
  patientDob: Date | null;
  specialty: string;
  tier: string;
  diagnosis: string;
  proposedTreatment: string | null;
  specificQuestions: string | null;
  reportContent: string;
  specialistName: string;
  specialistDetail: string;
  deliveredAt: Date;
}

/** Load a case with everything needed to render its report, or null if there is no report yet. */
export async function loadReportData(caseId: string): Promise<ReportData | null> {
  const soCase = await prisma.secondOpinionCase.findUnique({
    where: { id: caseId },
    include: {
      specialist: {
        select: {
          title: true,
          institution: true,
          country: true,
          user: { select: { name: true } },
          specialty: { select: { name: true } },
        },
      },
    },
  });
  if (!soCase || !soCase.reportContent) return null;

  const sp = soCase.specialist;
  return {
    reference: soCase.reference,
    patientName: soCase.patientName,
    patientDob: soCase.patientDob,
    specialty: soCase.specialty,
    tier: soCase.tier,
    diagnosis: soCase.diagnosis,
    proposedTreatment: soCase.proposedTreatment,
    specificQuestions: soCase.specificQuestions,
    reportContent: soCase.reportContent,
    specialistName: sp ? `${sp.title || 'Dr.'} ${sp.user.name}` : 'Specialist',
    specialistDetail: sp
      ? [sp.specialty?.name || soCase.specialty, sp.institution, sp.country].filter(Boolean).join(' | ')
      : soCase.specialty,
    deliveredAt: soCase.reportDeliveredAt || new Date(),
  };
}

export function generateReportHtml(data: ReportData): string {
  const e = escapeHtml;
  const longDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dobStr = data.patientDob ? longDate(data.patientDob) : 'Not provided';
  const dateStr = longDate(data.deliveredAt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Second Opinion Report — ${e(data.reference)}</title>
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Georgia', serif; color: #1a1a1a; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 40px 20px; }
  .header { border-bottom: 3px solid #0D1F3C; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 14px; color: #0D1F3C; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
  .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
  .ref { font-family: monospace; font-size: 13px; color: #0D1F3C; font-weight: bold; }
  .meta-table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 13px; }
  .meta-table td { padding: 6px 12px; border: 1px solid #e5e5e5; }
  .meta-table td:first-child { font-weight: bold; width: 160px; background: #f8f9fa; }
  .section-title { font-size: 15px; font-weight: bold; color: #0D1F3C; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .report-body p { margin: 0 0 12px; font-size: 14px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #0D1F3C; font-size: 11px; color: #666; }
  .footer .sig { font-size: 13px; color: #1a1a1a; font-weight: bold; }
  .disclaimer { margin-top: 24px; padding: 12px; background: #f8f9fa; border: 1px solid #e5e5e5; font-size: 11px; color: #666; }
  .print { position: fixed; top: 16px; right: 16px; background: #0D1F3C; color: #fff; border: 0; border-radius: 8px; padding: 10px 16px; font: 600 14px Arial, sans-serif; cursor: pointer; }
  @media print { .print { display: none; } }
</style>
</head>
<body>
<button class="print" onclick="window.print()">Print / Save as PDF</button>
<div class="header">
  <h1>Doctors Foundation for Care</h1>
  <p>Second Opinion Report</p>
  <p class="ref">${e(data.reference)} &nbsp;|&nbsp; ${dateStr}</p>
</div>

<table class="meta-table">
  <tr><td>Patient</td><td>${e(data.patientName)}</td></tr>
  <tr><td>Date of Birth</td><td>${dobStr}</td></tr>
  <tr><td>Specialty</td><td>${e(data.specialty)}</td></tr>
  <tr><td>Service Tier</td><td>${e(data.tier)}</td></tr>
  <tr><td>Reviewing Specialist</td><td>${e(data.specialistName)}</td></tr>
</table>

<div class="section-title">Original Diagnosis</div>
<p style="font-size:14px;">${e(data.diagnosis)}</p>

${data.proposedTreatment ? `<div class="section-title">Proposed Treatment</div><p style="font-size:14px;">${e(data.proposedTreatment)}</p>` : ''}

${data.specificQuestions ? `<div class="section-title">Patient Questions</div><p style="font-size:14px;">${e(data.specificQuestions)}</p>` : ''}

<div class="section-title">Specialist Report</div>
<div class="report-body"><p>${formatReportBody(data.reportContent)}</p></div>

<div class="footer">
  <p class="sig">${e(data.specialistName)}</p>
  <p>${e(data.specialistDetail)}</p>
  <p>Report delivered: ${dateStr}</p>
</div>

<div class="disclaimer">
  <strong>Disclaimer:</strong> This report constitutes an independent medical opinion based on the information provided. It does not replace the advice of your treating physician. Clinical decisions should be made in consultation with your healthcare team. If you are experiencing a medical emergency, please call 112 or visit your nearest emergency department.
</div>
</body>
</html>`;
}

/**
 * Email the requester about a case milestone. Never throws: a failed email is
 * logged (sendEmail writes an EmailLog row) but must not fail the action that
 * triggered it.
 */
export async function notifySecondOpinion(caseId: string, event: SecondOpinionEvent): Promise<void> {
  try {
    const soCase = await prisma.secondOpinionCase.findUnique({ where: { id: caseId } });
    if (!soCase?.contactEmail) return;

    const callTime = soCase.videoCallScheduledAt
      ? soCase.videoCallScheduledAt.toLocaleString('en-GB', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Africa/Lagos',
        }) + ' (Lagos time)'
      : undefined;

    const subjects: Record<SecondOpinionEvent, string> = {
      PAID: `Second opinion request received (${soCase.reference})`,
      ASSIGNED: `A specialist is reviewing your case (${soCase.reference})`,
      VIDEO_CALL: `Your video consultation is scheduled (${soCase.reference})`,
      REPORT_READY: `Your second opinion report is ready (${soCase.reference})`,
    };

    await sendEmail({
      to: soCase.contactEmail,
      subject: subjects[event],
      templateName: `second-opinion-${event.toLowerCase()}`,
      component: React.createElement(SecondOpinionUpdate, {
        event,
        patientName: soCase.patientName,
        reference: soCase.reference,
        specialty: soCase.specialty,
        reportUrl: event === 'REPORT_READY' ? reportUrl(soCase.id) : undefined,
        callTime,
        callLink: soCase.videoCallLink || undefined,
      }),
      metadata: { caseId: soCase.id, reference: soCase.reference, event },
    });
  } catch (error) {
    logger.error('SecondOpinionNotify', error);
  }
}

/**
 * Run once when a case reaches COMPLETED, whoever completed it: files the
 * report in the patient's EMR when they have an account, then emails the link.
 */
export async function deliverSecondOpinionReport(caseId: string, deliveredById: string): Promise<void> {
  try {
    const soCase = await prisma.secondOpinionCase.findUnique({ where: { id: caseId } });
    if (!soCase || !soCase.reportContent) return;

    if (soCase.userId) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: soCase.userId },
      });
      if (patientProfile) {
        const title = `Second Opinion Report — ${soCase.specialty} (${soCase.reference})`;
        const existing = await prisma.clinicalDocument.findFirst({
          where: { patientId: patientProfile.id, title },
        });
        if (!existing) {
          await prisma.clinicalDocument.create({
            data: {
              patientId: patientProfile.id,
              uploadedById: deliveredById,
              type: 'SECOND_OPINION',
              title,
              description: `Second opinion for: ${soCase.diagnosis}`,
              fileUrl: soCase.reportPdfUrl || reportUrl(soCase.id),
              fileType: soCase.reportPdfUrl ? 'PDF' : 'HTML',
              isPatientVisible: true,
            },
          });
        }
        await prisma.notification
          .create({
            data: {
              userId: soCase.userId,
              title: 'Second opinion report ready',
              message: `Your ${soCase.specialty} second opinion (${soCase.reference}) is ready to view.`,
              type: 'info',
              link: reportUrl(soCase.id),
            },
          })
          .catch(() => {});
      }
    }

    await notifySecondOpinion(caseId, 'REPORT_READY');
  } catch (error) {
    logger.error('SecondOpinionDeliver', error);
  }
}
