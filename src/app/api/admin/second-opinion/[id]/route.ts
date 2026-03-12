import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { validateFields, MAX_LENGTHS } from '@/lib/validation';

async function requireAdmin(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) return null;
  const payload = await verifyToken(token) as JWTPayload;
  if (!payload || !['SUPERADMIN', 'SECRETARIAT'].includes(payload.role)) return null;
  return payload;
}

// GET — single case with full detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const soCase = await prisma.secondOpinionCase.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      specialist: {
        select: {
          id: true,
          slug: true,
          title: true,
          institution: true,
          country: true,
          user: { select: { name: true, email: true } },
          specialty: { select: { name: true } },
        },
      },
    },
  });

  if (!soCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, case: soCase });
}

// PATCH — update case (coordinator notes, status, cancel, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const fieldError = validateFields(body, {
    coordinatorNotes: { maxLength: MAX_LENGTHS.longText },
    cancelReason: { maxLength: MAX_LENGTHS.mediumText },
    status: { maxLength: MAX_LENGTHS.shortText },
  });
  if (fieldError) return fieldError;

  const soCase = await prisma.secondOpinionCase.findUnique({ where: { id } });
  if (!soCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const updateData: Prisma.SecondOpinionCaseUpdateInput = {};

  if (body.coordinatorNotes !== undefined) updateData.coordinatorNotes = body.coordinatorNotes;
  if (body.status) updateData.status = body.status;
  if (body.cancelReason) updateData.cancelReason = body.cancelReason;

  // Handle cancellation
  if (body.status === 'CANCELLED') {
    updateData.cancelReason = body.cancelReason || 'Cancelled by coordinator';
  }

  // When delivering, set timestamp and create clinical document
  if (body.status === 'DELIVERED') {
    updateData.reportDeliveredAt = new Date();

    // If the patient is a registered user, create a ClinicalDocument in their EMR
    if (soCase.userId) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: soCase.userId },
      });

      if (patientProfile && (soCase.reportContent || soCase.reportPdfUrl)) {
        await prisma.clinicalDocument.create({
          data: {
            patientId: patientProfile.id,
            uploadedById: admin.userId,
            type: 'SECOND_OPINION',
            title: `Second Opinion Report — ${soCase.specialty} (${soCase.reference})`,
            description: `Second opinion for: ${soCase.diagnosis}`,
            fileUrl: soCase.reportPdfUrl || '',
            fileType: soCase.reportPdfUrl ? 'PDF' : 'OTHER',
            isPatientVisible: true,
          },
        });
      }
    }
  }

  const updated = await prisma.secondOpinionCase.update({
    where: { id },
    data: updateData,
  });

  audit({
    userId: admin.userId,
    action: "ADMIN_ACTION",
    resource: "second_opinion",
    resourceId: id,
    details: { action: "update", status: body.status, reference: soCase.reference },
  }, request);

  return NextResponse.json({ success: true, case: updated });
}
