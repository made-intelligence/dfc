import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'ACCESS_GRANT',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const grants = await prisma.recordAccessGrant.findMany({
      where: { patientId },
      orderBy: { grantedAt: 'desc' },
    });

    return NextResponse.json(grants);
  } catch (error) {
    logger.error('EMR:AccessGrantsList', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Only patients can grant access to their own records
    if (payload.role !== UserRole.PATIENT) {
      return NextResponse.json({ error: 'Only patients can grant access' }, { status: 403 });
    }

    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: payload.userId },
    });
    if (!patientProfile) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { grantedToId, scope, expiresAt, reason } = body;

    if (!grantedToId) {
      return NextResponse.json({ error: 'grantedToId is required' }, { status: 400 });
    }

    // Upsert in case a revoked grant already exists
    const grant = await prisma.recordAccessGrant.upsert({
      where: {
        patientId_grantedToId: {
          patientId: patientProfile.id,
          grantedToId,
        },
      },
      update: {
        isActive: true,
        scope: scope || 'READ',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        revokedAt: null,
        reason,
      },
      create: {
        patientId: patientProfile.id,
        grantedToId,
        scope: scope || 'READ',
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        reason,
      },
    });

    return NextResponse.json(grant, { status: 201 });
  } catch (error) {
    logger.error('EMR:AccessGrant', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
