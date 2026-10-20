import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';
import { generateReportHtml, loadReportData, reportUrl } from '@/lib/second-opinion-report';

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

  const data = await loadReportData(id);
  if (!data) {
    return NextResponse.json({ error: 'Report not yet available' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    reportUrl: reportUrl(id),
    html: generateReportHtml(data),
    reportContent: soCase.reportContent,
    metadata: {
      reference: data.reference,
      specialistName: data.specialistName,
      specialty: data.specialty,
      deliveredAt: soCase.reportDeliveredAt,
    },
  });
}
