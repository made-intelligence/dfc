import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { validateFields, MAX_LENGTHS } from '@/lib/validation';
import { signCaseDocuments } from '@/lib/second-opinion-documents';
import { deliverSecondOpinionReport, notifySecondOpinion } from '@/lib/second-opinion-report';

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

  const documents = await signCaseDocuments(soCase.documents);

  return NextResponse.json({ success: true, case: { ...soCase, documents } });
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
    videoCallLink: { maxLength: MAX_LENGTHS.mediumText },
  });
  if (fieldError) return fieldError;

  // Coordinators may only move a case to these states; the rest are set by
  // payment, assignment and the specialist's own workflow.
  const SETTABLE_STATUSES = ['COMPLETED', 'CANCELLED', 'REFUNDED'] as const;
  if (body.status && !SETTABLE_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const soCase = await prisma.secondOpinionCase.findUnique({ where: { id } });
  if (!soCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  if (body.status === 'COMPLETED' && !soCase.reportContent) {
    return NextResponse.json(
      { error: 'The specialist has not submitted a report yet' },
      { status: 400 }
    );
  }

  const updateData: Prisma.SecondOpinionCaseUpdateInput = {};

  if (body.coordinatorNotes !== undefined) updateData.coordinatorNotes = body.coordinatorNotes;
  if (body.status) updateData.status = body.status;
  if (body.cancelReason) updateData.cancelReason = body.cancelReason;

  if (body.status === 'CANCELLED') {
    updateData.cancelReason = body.cancelReason || 'Cancelled by coordinator';
  }

  const completing = body.status === 'COMPLETED' && soCase.status !== 'COMPLETED';
  if (completing) {
    updateData.reportDeliveredAt = soCase.reportDeliveredAt ?? new Date();
  }

  // Video consultation (COMPLEX and ONCOLOGY tiers)
  let callScheduled = false;
  if (body.videoCallScheduledAt !== undefined) {
    if (body.videoCallScheduledAt === null) {
      updateData.videoCallScheduledAt = null;
      updateData.videoCallLink = null;
    } else {
      const when = new Date(body.videoCallScheduledAt);
      if (Number.isNaN(when.getTime())) {
        return NextResponse.json({ error: 'Invalid video call time' }, { status: 400 });
      }
      const link = typeof body.videoCallLink === 'string' ? body.videoCallLink.trim() : '';
      if (link && !/^https:\/\//i.test(link)) {
        return NextResponse.json({ error: 'Video call link must start with https://' }, { status: 400 });
      }
      updateData.videoCallScheduledAt = when;
      updateData.videoCallLink = link || null;
      callScheduled = true;
    }
  }
  if (body.videoCallCompleted === true) {
    updateData.videoCallCompletedAt = new Date();
  }

  const updated = await prisma.secondOpinionCase.update({
    where: { id },
    data: updateData,
  });

  if (completing) {
    await deliverSecondOpinionReport(id, admin.userId);
  }
  if (callScheduled) {
    await notifySecondOpinion(id, 'VIDEO_CALL');
  }

  audit({
    userId: admin.userId,
    action: "ADMIN_ACTION",
    resource: "second_opinion",
    resourceId: id,
    details: { action: "update", status: body.status, reference: soCase.reference },
  }, request);

  return NextResponse.json({ success: true, case: updated });
}
