import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';

// GET — generate/retrieve PDF report for a completed case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token) as JWTPayload;
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const soCase = await prisma.secondOpinionCase.findUnique({
    where: { id },
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

  if (!soCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  // Verify access: specialist, admin, or patient
  const isAdmin = ['SUPERADMIN', 'SECRETARIAT'].includes(payload.role);
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: payload.userId } });
  const isSpecialist = doctor && soCase.specialistId === doctor.id;
  const isPatient = soCase.userId === payload.userId;

  if (!isAdmin && !isSpecialist && !isPatient) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!soCase.reportContent) {
    return NextResponse.json({ error: 'Report not yet available' }, { status: 404 });
  }

  // If PDF already exists, return URL
  if (soCase.reportPdfUrl) {
    return NextResponse.json({ success: true, pdfUrl: soCase.reportPdfUrl });
  }

  // Generate HTML report for PDF
  const specialistName = soCase.specialist
    ? `${soCase.specialist.title || 'Dr.'} ${soCase.specialist.user.name}`
    : 'Specialist';
  const specialistDetail = soCase.specialist
    ? `${soCase.specialist.specialty?.name || soCase.specialty} | ${soCase.specialist.institution || ''} | ${soCase.specialist.country || ''}`
    : soCase.specialty;

  const html = generateReportHtml({
    reference: soCase.reference,
    patientName: soCase.patientName,
    patientDob: soCase.patientDob,
    specialty: soCase.specialty,
    tier: soCase.tier,
    diagnosis: soCase.diagnosis,
    proposedTreatment: soCase.proposedTreatment,
    specificQuestions: soCase.specificQuestions,
    reportContent: soCase.reportContent,
    specialistName,
    specialistDetail,
    deliveredAt: soCase.reportDeliveredAt || new Date(),
  });

  // Return HTML for client-side PDF generation (using browser print or html2pdf)
  return NextResponse.json({
    success: true,
    html,
    reportContent: soCase.reportContent,
    metadata: {
      reference: soCase.reference,
      specialistName,
      specialty: soCase.specialty,
      deliveredAt: soCase.reportDeliveredAt,
    },
  });
}

function generateReportHtml(data: {
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
}): string {
  const dobStr = data.patientDob
    ? new Date(data.patientDob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not provided';
  const dateStr = new Date(data.deliveredAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Convert markdown-like report content to simple HTML
  const reportHtml = data.reportContent
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Second Opinion Report — ${data.reference}</title>
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
</style>
</head>
<body>
<div class="header">
  <h1>Doctors Foundation for Care</h1>
  <p>Second Opinion Report</p>
  <p class="ref">${data.reference} &nbsp;|&nbsp; ${dateStr}</p>
</div>

<table class="meta-table">
  <tr><td>Patient</td><td>${data.patientName}</td></tr>
  <tr><td>Date of Birth</td><td>${dobStr}</td></tr>
  <tr><td>Specialty</td><td>${data.specialty}</td></tr>
  <tr><td>Service Tier</td><td>${data.tier}</td></tr>
  <tr><td>Reviewing Specialist</td><td>${data.specialistName}</td></tr>
</table>

<div class="section-title">Original Diagnosis</div>
<p style="font-size:14px;">${data.diagnosis}</p>

${data.proposedTreatment ? `<div class="section-title">Proposed Treatment</div><p style="font-size:14px;">${data.proposedTreatment}</p>` : ''}

${data.specificQuestions ? `<div class="section-title">Patient Questions</div><p style="font-size:14px;">${data.specificQuestions}</p>` : ''}

<div class="section-title">Specialist Report</div>
<div class="report-body"><p>${reportHtml}</p></div>

<div class="footer">
  <p class="sig">${data.specialistName}</p>
  <p>${data.specialistDetail}</p>
  <p>Report delivered: ${dateStr}</p>
</div>

<div class="disclaimer">
  <strong>Disclaimer:</strong> This report constitutes an independent medical opinion based on the information provided. It does not replace the advice of your treating physician. Clinical decisions should be made in consultation with your healthcare team. If you are experiencing a medical emergency, please call 112 or visit your nearest emergency department.
</div>
</body>
</html>`;
}
