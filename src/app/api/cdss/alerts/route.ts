import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role !== 'DFC_MEMBER') {
      return NextResponse.json({ error: 'Only DFC members can access CDSS' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const encounterId = searchParams.get('encounterId');
    const status = searchParams.get('status');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    // Get doctor profile to filter alerts for this physician
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      patientId,
      generatedForId: doctorProfile.id,
    };

    if (encounterId) where.encounterId = encounterId;
    if (status) where.status = status;

    const alerts = await prisma.cDSSAlert.findMany({
      where,
      orderBy: [
        { level: 'asc' }, // CRITICAL first (alphabetical: CRITICAL < INFO < WARNING)
        { createdAt: 'desc' },
      ],
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Re-sort so CRITICAL > WARNING > INFO
    const levelOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    alerts.sort((a, b) => {
      const levelDiff = levelOrder[a.level] - levelOrder[b.level];
      if (levelDiff !== 0) return levelDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    logger.error('CDSS:AlertsList', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role !== 'DFC_MEMBER') {
      return NextResponse.json({ error: 'Only DFC members can access CDSS' }, { status: 403 });
    }

    const body = await request.json();
    const { alertId, action, notes } = body;

    if (!alertId || !action) {
      return NextResponse.json({ error: 'alertId and action are required' }, { status: 400 });
    }

    const validActions = ['ACKNOWLEDGED', 'DISMISSED', 'ACTIONED'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 },
      );
    }

    // Verify alert exists and belongs to this physician
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const alert = await prisma.cDSSAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (alert.generatedForId !== doctorProfile.id) {
      return NextResponse.json({ error: 'You can only update your own alerts' }, { status: 403 });
    }

    // Update alert status and create interaction log in a transaction
    const [updatedAlert, interactionLog] = await prisma.$transaction([
      prisma.cDSSAlert.update({
        where: { id: alertId },
        data: {
          status: action as 'ACKNOWLEDGED' | 'DISMISSED' | 'ACTIONED',
          acknowledgedAt: action === 'ACKNOWLEDGED' ? new Date() : alert.acknowledgedAt,
          dismissedAt: action === 'DISMISSED' ? new Date() : alert.dismissedAt,
        },
      }),
      prisma.cDSSInteractionLog.create({
        data: {
          alertId,
          physicianId: doctorProfile.id,
          action,
          notes: notes || null,
        },
      }),
    ]);

    return NextResponse.json({ alert: updatedAlert, interactionLog });
  } catch (error) {
    logger.error('CDSS:AlertUpdate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
