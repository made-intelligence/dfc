import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (isAuthError(authResult)) return authResult;

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const unsignedNotes = await prisma.clinicalEncounter.findMany({
      where: {
        status: 'DRAFT',
        createdAt: { lt: cutoff },
      },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        patient: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const results = unsignedNotes.map((note) => {
      const now = new Date();
      const diffMs = now.getTime() - note.createdAt.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: note.id,
        doctorName: note.doctor.user.name,
        doctorUserId: note.doctor.user.id,
        patientName: note.patient.user.name,
        patientId: note.patientId,
        encounterDate: note.encounterDate,
        createdAt: note.createdAt,
        daysOverdue,
      };
    });

    return NextResponse.json({ success: true, unsignedNotes: results });
  } catch (error) {
    logger.error('AdminClinicalUnsigned', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
