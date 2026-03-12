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
 * Intended to run daily via cron.
 */
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

    for (const rx of expiringPrescriptions) {
      const patientUserId = rx.encounter.patient.userId;
      const doctorName = rx.encounter.doctor.user.name;

      await prisma.notification.create({
        data: {
          userId: patientUserId,
          title: "Prescription expiring soon",
          message: `Your prescription ${rx.rxNumber} from Dr. ${doctorName} expires in 3 days. Please collect your medication.`,
          type: "warning",
          link: `/prescriptions/${rx.id}`,
        },
      });
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
            patient: { select: { user: { select: { name: true } } } },
          },
        },
      },
    });

    for (const rx of undispensedPrescriptions) {
      const patientName = rx.encounter.patient.user.name;

      await prisma.notification.create({
        data: {
          userId: rx.prescribedById,
          title: "Undispensed prescription",
          message: `Prescription ${rx.rxNumber} for ${patientName} has not been collected after 7 days.`,
          type: "info",
          link: `/emr/prescriptions/${rx.id}`,
        },
      });
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
      `Daily adherence: ${expiringPrescriptions.length} expiry warnings, ${undispensedPrescriptions.length} undispensed alerts, ${completedResult.count} medications completed`
    );

    return {
      expiryWarnings: expiringPrescriptions.length,
      undispensedAlerts: undispensedPrescriptions.length,
      completedMedications: completedResult.count,
    };
  } catch (error) {
    logger.error("Adherence", error);
    throw error;
  }
}
