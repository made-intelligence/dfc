import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Quarterly HMO volume tracking job.
 *
 * For each active HMO contract, counts cases delivered this quarter
 * and applies tariff tier adjustments:
 *   - Below 50%: +5% surcharge
 *   - 50-74%: standard rate (0%)
 *   - 75-89%: -5% discount
 *   - 90-100%: -10% discount
 *   - Above 100%: -12% discount
 *
 * Intended to run quarterly via cron.
 */

interface VolumeReport {
  contractId: string;
  hmoName: string;
  committedVolume: number;
  deliveredVolume: number;
  utilizationPercent: number;
  tariffAdjustment: number;
}

function getTariffAdjustment(utilizationPercent: number): number {
  if (utilizationPercent > 100) return -12;
  if (utilizationPercent >= 90) return -10;
  if (utilizationPercent >= 75) return -5;
  if (utilizationPercent >= 50) return 0;
  return 5;
}

export async function runQuarterlyVolumeTracking(): Promise<VolumeReport[]> {
  try {
    // 1. Get all active HMO contracts
    const activeContracts = await prisma.hMOContract.findMany({
      where: { status: "ACTIVE" },
      include: {
        hmo: { select: { name: true } },
      },
    });

    if (activeContracts.length === 0) {
      logger.info("HMOVolume", "No active HMO contracts to track");
      return [];
    }

    const quarterStart = getQuarterStart();
    const reports: VolumeReport[] = [];

    for (const contract of activeContracts) {
      // 2. Count cases delivered this quarter via SPL cases linked to this HMO
      const deliveredCount = await prisma.sPLCase.count({
        where: {
          hmoPartnerId: contract.hmoId,
          status: { in: ["DELIVERED", "BILLED", "PAID"] },
          deliveredAt: { gte: quarterStart },
        },
      });

      // 3. Parse volume commitments from contract
      const volumeCommitments = contract.volumeCommitments as Record<string, number> | null;
      const committedVolume = volumeCommitments
        ? Object.values(volumeCommitments).reduce((sum, v) => sum + v, 0)
        : 0;

      const utilizationPercent = committedVolume > 0
        ? Math.round((deliveredCount / committedVolume) * 100)
        : 0;

      const tariffAdjustment = getTariffAdjustment(utilizationPercent);

      reports.push({
        contractId: contract.id,
        hmoName: contract.hmo.name,
        committedVolume,
        deliveredVolume: deliveredCount,
        utilizationPercent,
        tariffAdjustment,
      });

      logger.info(
        "HMOVolume",
        `${contract.hmo.name}: ${deliveredCount}/${committedVolume} (${utilizationPercent}%), tariff adjustment: ${tariffAdjustment}%`
      );
    }

    logger.info(
      "HMOVolume",
      `Quarterly volume tracking complete: ${reports.length} contracts reviewed`
    );

    return reports;
  } catch (error) {
    logger.error("HMOVolume", error);
    throw error;
  }
}

function getQuarterStart(): Date {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  return new Date(now.getFullYear(), quarter * 3, 1);
}
