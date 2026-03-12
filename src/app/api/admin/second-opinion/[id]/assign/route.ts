import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';
import { audit } from '@/lib/audit';

async function requireAdmin(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) return null;
  const payload = await verifyToken(token) as JWTPayload;
  if (!payload || !['SUPERADMIN', 'SECRETARIAT'].includes(payload.role)) return null;
  return payload;
}

// POST — assign a specialist to a case
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { specialistId } = await request.json();

  if (!specialistId) {
    return NextResponse.json({ error: 'specialistId is required' }, { status: 400 });
  }

  const soCase = await prisma.secondOpinionCase.findUnique({ where: { id } });
  if (!soCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  if (!['PAID', 'ASSIGNED'].includes(soCase.status)) {
    return NextResponse.json(
      { error: 'Case must be paid before assigning a specialist' },
      { status: 400 }
    );
  }

  // Verify the specialist exists and has the right specialty
  const specialist = await prisma.doctorProfile.findUnique({
    where: { id: specialistId },
    include: { user: { select: { name: true, email: true } }, specialty: true },
  });

  if (!specialist) {
    return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
  }

  const updated = await prisma.secondOpinionCase.update({
    where: { id },
    data: {
      specialistId,
      assignedAt: new Date(),
      assignedById: admin.userId,
      status: 'ASSIGNED',
    },
  });

  // Create notification for the specialist
  await prisma.notification.create({
    data: {
      userId: specialist.userId,
      title: 'New case assigned',
      message: `You have been assigned a second opinion case (${soCase.reference}) in ${soCase.specialty}. Please review within the SLA.`,
      type: 'info',
      link: `/member/cases/${soCase.id}`,
    },
  });

  audit({
    userId: admin.userId,
    action: "SECOND_OPINION_ASSIGN",
    resource: "second_opinion",
    resourceId: id,
    details: { specialistId, specialistName: specialist.user.name, reference: soCase.reference },
  }, request);

  return NextResponse.json({
    success: true,
    case: updated,
    specialist: { name: specialist.user.name, email: specialist.user.email },
  });
}
