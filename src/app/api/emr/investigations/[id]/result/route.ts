import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;

    const investigation = await prisma.investigationOrder.findUnique({ where: { id } });
    if (!investigation) {
      return NextResponse.json({ error: 'Investigation order not found' }, { status: 404 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, investigation.patientId, 'CREATED', 'LAB_RESULT', id,
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const body = await request.json();
    const {
      testName, labName, reportDate, documentUrl,
      results, interpretation, isAbnormal, notes,
    } = body;

    if (!testName || !reportDate) {
      return NextResponse.json(
        { error: 'testName and reportDate are required' },
        { status: 400 },
      );
    }

    const labResult = await prisma.labResult.create({
      data: {
        patientId: investigation.patientId,
        investigationId: id,
        uploadedById: payload.userId,
        testName,
        labName,
        reportDate: new Date(reportDate),
        documentUrl,
        results,
        interpretation,
        isAbnormal: isAbnormal || false,
        notes,
      },
    });

    // Update investigation order status
    await prisma.investigationOrder.update({
      where: { id },
      data: {
        status: 'RESULTED',
        resultedAt: new Date(),
        resultId: labResult.id,
      },
    });

    // If abnormal, create notification for the patient
    if (isAbnormal) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { id: investigation.patientId },
        select: { userId: true },
      });

      if (patientProfile) {
        await prisma.notification.create({
          data: {
            userId: patientProfile.userId,
            title: 'Abnormal Lab Result',
            message: `Your ${testName} results require attention. Please review with your doctor.`,
            type: 'LAB_RESULT',
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json(labResult, { status: 201 });
  } catch (error) {
    logger.error('EMR:InvestigationResult', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
