import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Renewal notification sequence.
 *
 * Sends staged renewal reminders to DFC members based on
 * their dues expiry date:
 *
 * Day -60: First reminder (email + in-app)
 * Day -30: Second reminder (email + WhatsApp)
 * Day -14: Urgency reminder (email + WhatsApp)
 * Day -7:  Final reminder (email + WhatsApp)
 * Day  0:  Expiry notice (email + WhatsApp, membership paused)
 * Day +7:  Grace period ending (WhatsApp)
 * Day +30: Membership suspended
 *
 * Intended to run daily via cron.
 */

interface RenewalNotificationResult {
  day60: number;
  day30: number;
  day14: number;
  day7: number;
  expired: number;
  gracePeriodEnding: number;
  suspended: number;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function runRenewalNotifications(): Promise<RenewalNotificationResult> {
  const result: RenewalNotificationResult = {
    day60: 0, day30: 0, day14: 0, day7: 0,
    expired: 0, gracePeriodEnding: 0, suspended: 0,
  };

  try {
    const now = new Date();

    // Get all active/pending members with dues expiry dates
    const members = await prisma.dFCMember.findMany({
      where: {
        status: { in: ["ACTIVE", "PENDING"] },
        duesExpiresAt: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    for (const member of members) {
      if (!member.duesExpiresAt) continue;

      const daysUntilExpiry = daysBetween(member.duesExpiresAt, now);
      const userId = member.user.id;
      const memberName = member.user.name;

      // Day -60: First reminder
      if (daysUntilExpiry >= 59 && daysUntilExpiry <= 61) {
        await createRenewalNotification(
          userId,
          "Membership renewal in 60 days",
          `Hi ${memberName}, your DFC membership renewal is due in 60 days. Visit your renewal page to see your annual impact report.`,
          "/renew"
        );
        result.day60++;
      }

      // Day -30: Second reminder
      if (daysUntilExpiry >= 29 && daysUntilExpiry <= 31) {
        await createRenewalNotification(
          userId,
          "Membership renewal in 30 days",
          `Hi ${memberName}, your DFC membership expires in 30 days. Renew now to maintain access to all member benefits.`,
          "/renew"
        );
        // TODO: Send WhatsApp via Meta Cloud API
        result.day30++;
      }

      // Day -14: Urgency reminder
      if (daysUntilExpiry >= 13 && daysUntilExpiry <= 15) {
        await createRenewalNotification(
          userId,
          "Membership renewal in 2 weeks",
          `Hi ${memberName}, your membership expires in 2 weeks. Renew today to keep your specialist profile active.`,
          "/renew"
        );
        result.day14++;
      }

      // Day -7: Final reminder
      if (daysUntilExpiry >= 6 && daysUntilExpiry <= 8) {
        await createRenewalNotification(
          userId,
          "Membership expires in 7 days",
          `Urgent: ${memberName}, your DFC membership expires in 7 days. Space bookings, diagnostic referrals, and second opinions will be paused.`,
          "/renew"
        );
        result.day7++;
      }

      // Day 0: Expiry notice — pause good standing
      if (daysUntilExpiry >= -1 && daysUntilExpiry <= 1) {
        await prisma.dFCMember.update({
          where: { id: member.id },
          data: {
            goodStanding: false,
            duesStatus: "OUTSTANDING",
          },
        });
        await createRenewalNotification(
          userId,
          "Membership expired",
          `${memberName}, your DFC membership has expired. Your specialist profile is now paused. Renew to reactivate.`,
          "/renew"
        );
        result.expired++;
      }

      // Day +7: Grace period ending
      if (daysUntilExpiry >= -8 && daysUntilExpiry <= -6) {
        await createRenewalNotification(
          userId,
          "Grace period ending soon",
          `${memberName}, your membership grace period ends in 23 days. Renew now to avoid suspension.`,
          "/renew"
        );
        result.gracePeriodEnding++;
      }

      // Day +30: Suspend membership
      if (daysUntilExpiry <= -30 && member.status === "ACTIVE") {
        await prisma.dFCMember.update({
          where: { id: member.id },
          data: {
            status: "SUSPENDED",
            goodStanding: false,
            duesStatus: "OUTSTANDING",
          },
        });
        await createRenewalNotification(
          userId,
          "Membership suspended",
          `${memberName}, your DFC membership has been suspended due to non-renewal. Contact the secretariat to reinstate.`,
          "/renew"
        );
        result.suspended++;
      }
    }

    logger.info(
      "Renewal",
      `Renewal notifications: -60d=${result.day60}, -30d=${result.day30}, -14d=${result.day14}, -7d=${result.day7}, expired=${result.expired}, grace=${result.gracePeriodEnding}, suspended=${result.suspended}`
    );

    return result;
  } catch (error) {
    logger.error("Renewal", error);
    throw error;
  }
}

async function createRenewalNotification(
  userId: string,
  title: string,
  message: string,
  link: string
): Promise<void> {
  await prisma.notification.create({
    data: { userId, title, message, type: "warning", link },
  });
}
