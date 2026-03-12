import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Only patients can revoke access to their own records
    if (payload.role !== UserRole.PATIENT) {
      return NextResponse.json({ error: 'Only patients can revoke access' }, { status: 403 });
    }

    const { id } = await params;

    const grant = await prisma.recordAccessGrant.findUnique({ where: { id } });
    if (!grant) {
      return NextResponse.json({ error: 'Access grant not found' }, { status: 404 });
    }

    // Verify ownership
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: payload.userId },
    });
    if (!patientProfile || patientProfile.id !== grant.patientId) {
      return NextResponse.json({ error: 'You can only revoke your own access grants' }, { status: 403 });
    }

    await prisma.recordAccessGrant.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('EMR:AccessRevoke', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
