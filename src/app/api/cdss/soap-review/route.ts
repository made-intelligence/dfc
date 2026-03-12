import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { reviewSOAPNoteQuality } from '@/lib/ai/cdss';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role !== 'DFC_MEMBER') {
      return NextResponse.json({ error: 'Only DFC members can access CDSS' }, { status: 403 });
    }

    const body = await request.json();
    const { encounterId, subjective, objective, assessment, plan } = body;

    if (!encounterId) {
      return NextResponse.json({ error: 'encounterId is required' }, { status: 400 });
    }

    // Verify encounter exists and belongs to this doctor
    const encounter = await prisma.clinicalEncounter.findUnique({
      where: { id: encounterId },
      select: { doctorId: true },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile || encounter.doctorId !== doctorProfile.id) {
      return NextResponse.json({ error: 'You can only review your own encounter notes' }, { status: 403 });
    }

    const result = await reviewSOAPNoteQuality({
      subjective: subjective || '',
      objective: objective || '',
      assessment: assessment || '',
      plan: plan || '',
    });

    // Does NOT create CDSSAlert per spec
    return NextResponse.json(result);
  } catch (error) {
    logger.error('CDSS:SOAPReview', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
