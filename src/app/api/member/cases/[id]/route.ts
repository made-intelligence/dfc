import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';

async function getSpecialistId(payload: JWTPayload): Promise<string | null> {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: payload.userId },
  });
  return doctor?.id || null;
}

// GET — single case detail for specialist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token) as JWTPayload;
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const specialistId = await getSpecialistId(payload);

  // Admin or assigned specialist can view
  const isAdmin = ['SUPERADMIN', 'SECRETARIAT'].includes(payload.role);

  const soCase = await prisma.secondOpinionCase.findUnique({
    where: { id },
  });

  if (!soCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  if (!isAdmin && soCase.specialistId !== specialistId) {
    return NextResponse.json({ error: 'Not authorized to view this case' }, { status: 403 });
  }

  return NextResponse.json({ success: true, case: soCase });
}

// PATCH — specialist updates (start review, save notes, submit report)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token) as JWTPayload;
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const specialistId = await getSpecialistId(payload);
  const isAdmin = ['SUPERADMIN', 'SECRETARIAT'].includes(payload.role);

  const soCase = await prisma.secondOpinionCase.findUnique({ where: { id } });
  if (!soCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  if (!isAdmin && soCase.specialistId !== specialistId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Prisma.SecondOpinionCaseUpdateInput = {};

  // Start review
  if (body.action === 'start_review') {
    if (soCase.status !== 'ASSIGNED') {
      return NextResponse.json({ error: 'Case is not in ASSIGNED state' }, { status: 400 });
    }
    updateData.status = 'IN_REVIEW';
    updateData.reviewStartedAt = new Date();
  }

  // Save specialist notes (drafting)
  if (body.specialistNotes !== undefined) {
    updateData.specialistNotes = body.specialistNotes;
  }

  // Save report content (draft)
  if (body.reportContent !== undefined) {
    updateData.reportContent = body.reportContent;
    if (soCase.status === 'IN_REVIEW') {
      updateData.status = 'REPORT_DRAFT';
    }
  }

  // Submit report (mark completed)
  if (body.action === 'submit_report') {
    if (!soCase.reportContent && !body.reportContent) {
      return NextResponse.json({ error: 'Report content is required' }, { status: 400 });
    }
    if (body.reportContent) updateData.reportContent = body.reportContent;
    updateData.status = 'COMPLETED';
    updateData.reportDeliveredAt = new Date();
  }

  const updated = await prisma.secondOpinionCase.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, case: updated });
}
