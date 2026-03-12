import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Data retention periods per data type.
 * Based on Nigerian Medical & Dental Council guidelines,
 * tax requirements, and NDPR compliance.
 */
export const RETENTION_PERIODS = {
  /** Medical records: 10 years (Nigerian Medical & Dental Council) */
  medicalRecords: 10 * 365,
  /** Payment records: 6 years (tax requirements) */
  paymentRecords: 6 * 365,
  /** Audit logs: 7 years (healthcare compliance) */
  auditLogs: 7 * 365,
  /** Session/refresh tokens: 30 days */
  sessions: 30,
  /** Expired notifications: 90 days */
  notifications: 90,
  /** Revoked refresh tokens: 7 days */
  revokedTokens: 7,
} as const;

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Clean up expired refresh tokens (revoked or past expiry).
 * Safe to run frequently — idempotent.
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null, lt: daysAgo(RETENTION_PERIODS.revokedTokens) } },
        ],
      },
    });
    return result.count;
  } catch (error) {
    logger.error("DataRetention:Tokens", error);
    return 0;
  }
}

/**
 * Clean up old read notifications.
 */
export async function cleanupOldNotifications(): Promise<number> {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: daysAgo(RETENTION_PERIODS.notifications) },
      },
    });
    return result.count;
  } catch (error) {
    logger.error("DataRetention:Notifications", error);
    return 0;
  }
}

/**
 * Run all retention cleanup tasks.
 * Intended to be called from a cron job or admin endpoint.
 */
export async function runRetentionCleanup(): Promise<{
  tokens: number;
  notifications: number;
}> {
  const [tokens, notifications] = await Promise.all([
    cleanupExpiredTokens(),
    cleanupOldNotifications(),
  ]);

  logger.info("DataRetention", `Cleanup — tokens=${tokens}, notifications=${notifications}`);

  return { tokens, notifications };
}
