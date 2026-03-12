import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (isAuthError(authResult)) return authResult;

    const { id } = await params;

    const encounter = await prisma.clinicalEncounter.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        patient: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    if (encounter.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Encounter is already signed' }, { status: 400 });
    }

    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
    }).format(encounter.encounterDate);

    const notification = await prisma.notification.create({
      data: {
        userId: encounter.doctor.user.id,
        title: 'Unsigned clinical note',
        message: `You have an unsigned note from ${formattedDate}. Please review and sign.`,
        type: 'warning',
        link: `/doctor/emr/${encounter.patient.user.id}`,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    logger.error('AdminClinicalRemind', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
