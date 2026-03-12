import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';

// GET — list cases assigned to the logged-in specialist
export async function GET(request: NextRequest) {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token) as JWTPayload;
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find doctor profile
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: payload.userId },
  });

  if (!doctor) {
    return NextResponse.json({ error: 'No specialist profile found' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where: Prisma.SecondOpinionCaseWhereInput = { specialistId: doctor.id };
  if (status) where.status = status as Prisma.EnumSecondOpinionStatusFilter;

  const cases = await prisma.secondOpinionCase.findMany({
    where,
    orderBy: { assignedAt: 'desc' },
    select: {
      id: true,
      reference: true,
      patientName: true,
      specialty: true,
      tier: true,
      status: true,
      assignedAt: true,
      createdAt: true,
      diagnosis: true,
      reviewStartedAt: true,
      reportDeliveredAt: true,
    },
  });

  return NextResponse.json({ success: true, cases });
}
