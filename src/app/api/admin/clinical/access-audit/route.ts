import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (isAuthError(authResult)) return authResult;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const accessLogs = await prisma.recordAccessLog.findMany({
      where: {
        accessedAt: { gte: sevenDaysAgo },
      },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { accessedAt: 'desc' },
    });

    // Group by accessedById
    const grouped: Record<
      string,
      {
        accessedById: string;
        patientIds: Set<string>;
        count: number;
        logs: typeof accessLogs;
      }
    > = {};

    for (const log of accessLogs) {
      if (!grouped[log.accessedById]) {
        grouped[log.accessedById] = {
          accessedById: log.accessedById,
          patientIds: new Set(),
          count: 0,
          logs: [],
        };
      }
      grouped[log.accessedById].patientIds.add(log.patientId);
      grouped[log.accessedById].count += 1;
      grouped[log.accessedById].logs.push(log);
    }

    // For each accessor, check if they have appointments with the patients they accessed
    const results = await Promise.all(
      Object.values(grouped).map(async (group) => {
        const accessor = await prisma.user.findUnique({
          where: { id: group.accessedById },
          select: { id: true, name: true, role: true },
        });

        const patientUserIds: string[] = [];
        for (const log of group.logs) {
          if (!patientUserIds.includes(log.patient.user.id)) {
            patientUserIds.push(log.patient.user.id);
          }
        }

        // Find appointments between this accessor and the patients they accessed
        const appointments = await prisma.appointment.findMany({
          where: {
            doctorId: group.accessedById,
            patientId: { in: patientUserIds },
          },
          select: { patientId: true },
        });

        const appointedPatientIds = new Set(appointments.map((a) => a.patientId));

        // Flag patients accessed without an appointment
        const anomalies = patientUserIds
          .filter((pid) => !appointedPatientIds.has(pid))
          .map((pid) => {
            const patientLog = group.logs.find((l) => l.patient.user.id === pid);
            return {
              patientId: pid,
              patientName: patientLog?.patient.user.name ?? 'Unknown',
            };
          });

        return {
          physicianId: group.accessedById,
          physicianName: accessor?.name ?? 'Unknown',
          physicianRole: accessor?.role,
          recordsAccessed: group.count,
          uniquePatients: patientUserIds.length,
          anomalies,
          flagged: anomalies.length > 0,
        };
      })
    );

    return NextResponse.json({ success: true, accessAudit: results });
  } catch (error) {
    logger.error('AdminClinicalAccessAudit', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
