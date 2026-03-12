import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Monthly settlement job for EarningsLedger.
 *
 * Processes all PENDING earnings entries older than 30 days,
 * groups by member, and marks as SETTLED.
 *
 * In production this would trigger Paystack transfers to
 * member sub-accounts. For now it marks entries and logs totals.
 *
 * Intended to run via cron on the 1st of each month.
 */
export async function runMonthlySettlement(): Promise<{
  membersSettled: number;
  entriesSettled: number;
  totalAmount: number;
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  try {
    // 1. Find all pending entries older than 30 days
    const pendingEntries = await prisma.earningsLedger.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pendingEntries.length === 0) {
      logger.info("Settlement", "No pending entries to settle");
      return { membersSettled: 0, entriesSettled: 0, totalAmount: 0 };
    }

    // 2. Group by member
    const memberTotals = new Map<string, { entryIds: string[]; total: number }>();

    for (const entry of pendingEntries) {
      const existing = memberTotals.get(entry.userId) || { entryIds: [], total: 0 };
      existing.entryIds.push(entry.id);
      existing.total += Number(entry.amount);
      memberTotals.set(entry.userId, existing);
    }

    // 3. Process settlements per member
    let totalAmount = 0;

    for (const [memberId, data] of memberTotals) {
      await prisma.$transaction(async (tx) => {
        // Mark all entries as SETTLED
        await tx.earningsLedger.updateMany({
          where: { id: { in: data.entryIds } },
          data: {
            status: "SETTLED",
            settledAt: new Date(),
          },
        });

        // In production: trigger Paystack transfer to member sub-account
        // const member = await tx.dFCMember.findUnique({ where: { id: memberId } });
        // if (member?.paystackSubAccountCode) { ... transfer ... }
      });

      totalAmount += data.total;

      logger.info(
        "Settlement",
        `Settled ₦${data.total.toLocaleString()} for member ${memberId} (${data.entryIds.length} entries)`
      );
    }

    logger.info(
      "Settlement",
      `Monthly settlement complete: ${memberTotals.size} members, ${pendingEntries.length} entries, ₦${totalAmount.toLocaleString()}`
    );

    return {
      membersSettled: memberTotals.size,
      entriesSettled: pendingEntries.length,
      totalAmount,
    };
  } catch (error) {
    logger.error("Settlement", error);
    throw error;
  }
}
