import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { runRetentionCleanup } from "@/lib/data-retention";
import { runMonthlySettlement } from "@/lib/jobs/monthly-settlement";
import { runQuarterlyVolumeTracking } from "@/lib/jobs/hmo-volume-tracking";
import { runAdherenceMonitoring } from "@/lib/jobs/adherence-monitoring";
import { runRenewalNotifications } from "@/lib/jobs/renewal-notifications";

/**
 * POST /api/admin/cron
 *
 * Runs background jobs. Secured via CRON_SECRET header.
 * Deploy with Vercel Cron or external cron service.
 *
 * Body: { job: "daily" | "monthly" | "quarterly" | "retention" | "all" }
 *
 * Recommended schedule:
 * - daily: adherence monitoring + renewal notifications
 * - monthly: settlement
 * - quarterly: HMO volume tracking
 * - retention: data cleanup (weekly)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth via shared secret (not cookie auth — cron jobs are server-to-server)
    const cronSecret = request.headers.get("x-cron-secret");
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { job } = body;

    if (!job || !["daily", "monthly", "quarterly", "retention", "all"].includes(job)) {
      return NextResponse.json(
        { error: "Invalid job. Use: daily, monthly, quarterly, retention, or all" },
        { status: 400 }
      );
    }

    const results: Record<string, unknown> = {};

    if (job === "daily" || job === "all") {
      results.adherence = await runAdherenceMonitoring();
      results.renewal = await runRenewalNotifications();
    }

    if (job === "monthly" || job === "all") {
      results.settlement = await runMonthlySettlement();
    }

    if (job === "quarterly" || job === "all") {
      results.hmoVolume = await runQuarterlyVolumeTracking();
    }

    if (job === "retention" || job === "all") {
      results.retention = await runRetentionCleanup();
    }

    logger.info("Cron", `Job "${job}" completed successfully`);

    return NextResponse.json({ success: true, job, results });
  } catch (error) {
    logger.error("Cron", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
