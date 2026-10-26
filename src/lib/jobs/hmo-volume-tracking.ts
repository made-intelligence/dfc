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
 * Runs on the first day of each quarter (src/app/api/cron/daily) and reports
 * on the quarter that has just ended. Report only: it logs the adjustment for
 * the secretariat and changes no tariffs.
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

    const { start: quarterStart, end: quarterEnd } = previousQuarter();
    const reports: VolumeReport[] = [];

    for (const contract of activeContracts) {
      // 2. Count cases delivered this quarter via SPL cases linked to this HMO
      const deliveredCount = await prisma.sPLCase.count({
        where: {
          hmoPartnerId: contract.hmoId,
          status: { in: ["DELIVERED", "BILLED", "PAID"] },
          deliveredAt: { gte: quarterStart, lt: quarterEnd },
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

/** The most recently completed calendar quarter, as UTC dates. */
function previousQuarter(now: Date = new Date()): { start: Date; end: Date } {
  const thisQuarterMonth = Math.floor(now.getUTCMonth() / 3) * 3;
  const end = new Date(Date.UTC(now.getUTCFullYear(), thisQuarterMonth, 1));
  const start = new Date(Date.UTC(now.getUTCFullYear(), thisQuarterMonth - 3, 1));
  return { start, end };
}
