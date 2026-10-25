import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Daily adherence monitoring job.
 *
 * Checks active prescriptions for:
 * 1. Prescriptions approaching expiry (3 days) — notify patient
 * 2. Prescriptions not yet dispensed after 7 days — notify physician
 * 3. Medications past their end date — mark as COMPLETED
 *
 * Runs daily (src/app/api/cron/daily). Each alert is sent once per
 * prescription, however many daily runs fall inside its window.
 */

/** True if this user already has a notification with this title about this prescription. */
async function alreadyNotified(userId: string, title: string, rxNumber: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: { userId, title, message: { contains: rxNumber } },
    select: { id: true },
  });
  return !!existing;
}
export async function runAdherenceMonitoring(): Promise<{
  expiryWarnings: number;
  undispensedAlerts: number;
  completedMedications: number;
}> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Prescriptions expiring within 3 days — notify patient
    const expiringPrescriptions = await prisma.prescription.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: threeDaysFromNow, gt: now },
      },
      include: {
        encounter: {
          select: {
            patient: { select: { userId: true } },
            doctor: { select: { user: { select: { name: true } } } },
          },
        },
      },
    });

    let expiryWarnings = 0;
    for (const rx of expiringPrescriptions) {
      const patientUserId = rx.encounter.patient.userId;
      const doctorName = rx.encounter.doctor.user.name;
      const title = "Prescription expiring soon";
      if (await alreadyNotified(patientUserId, title, rx.rxNumber)) continue;

      await prisma.notification.create({
        data: {
          userId: patientUserId,
          title,
          message: `Your prescription ${rx.rxNumber} from Dr. ${doctorName} expires within 3 days. Please collect your medication.`,
          type: "warning",
          link: "/profile",
        },
      });
      expiryWarnings++;
    }

    // 2. Prescriptions not dispensed after 7 days — notify physician
    const undispensedPrescriptions = await prisma.prescription.findMany({
      where: {
        status: "ACTIVE",
        dispensedAt: null,
        createdAt: { lt: sevenDaysAgo },
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        rxNumber: true,
        prescribedById: true,
        encounter: {
          select: {
            patient: { select: { id: true, user: { select: { name: true } } } },
          },
        },
      },
    });

    let undispensedAlerts = 0;
    for (const rx of undispensedPrescriptions) {
      const patientName = rx.encounter.patient.user.name;
      const title = "Undispensed prescription";
      if (await alreadyNotified(rx.prescribedById, title, rx.rxNumber)) continue;

      await prisma.notification.create({
        data: {
          userId: rx.prescribedById,
          title,
          message: `Prescription ${rx.rxNumber} for ${patientName} has not been collected after 7 days.`,
          type: "info",
          link: `/doctor/emr/${rx.encounter.patient.id}`,
        },
      });
      undispensedAlerts++;
    }

    // 3. Medications past end date — mark as COMPLETED
    const completedResult = await prisma.patientMedication.updateMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now },
      },
      data: {
        status: "COMPLETED",
      },
    });

    logger.info(
      "Adherence",
      `Daily adherence: ${expiryWarnings} expiry warnings, ${undispensedAlerts} undispensed alerts, ${completedResult.count} medications completed`
    );

    return {
      expiryWarnings,
      undispensedAlerts,
      completedMedications: completedResult.count,
    };
  } catch (error) {
    logger.error("Adherence", error);
    throw error;
  }
}
