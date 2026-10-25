import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { secureEquals } from "@/lib/secure-compare";
import { watNow } from "@/lib/wat";
import { runAppointmentReminders } from "@/lib/jobs/appointment-reminders";
import { runAdherenceMonitoring } from "@/lib/jobs/adherence-monitoring";
import { runRenewalNotifications } from "@/lib/jobs/renewal-notifications";
import { runQuarterlyVolumeTracking } from "@/lib/jobs/hmo-volume-tracking";
import { runRetentionCleanup } from "@/lib/data-retention";

/**
 * The one scheduled run (vercel.json: daily at 06:00 UTC, 07:00 WAT).
 *
 * Daily: appointment reminders, prescription adherence, membership renewal
 * notices, and data-retention cleanup. On the first day of each quarter (WAT)
 * it also reports HMO volume for the quarter just ended.
 *
 * Monthly settlement is deliberately not scheduled: it marks members' earnings
 * as SETTLED but does not pay anyone yet (the Paystack transfer is a TODO),
 * so running it would make unpaid earnings look paid. It stays a manual
 * action via POST /api/admin/cron with job "monthly".
 *
 * Each job runs on its own, so one failure does not stop the others; the
 * response is 500 if any failed, so the failure shows in Vercel's cron logs.
 * Secured by CRON_SECRET, which Vercel Cron sends as a Bearer token.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !secureEquals(request.headers.get("authorization"), `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = watNow().ymd;
  const [, month, day] = today.split("-").map(Number);
  const isQuarterStart = day === 1 && [1, 4, 7, 10].includes(month);

  const jobs: [string, () => Promise<unknown>][] = [
    ["appointmentReminders", runAppointmentReminders],
    ["adherence", runAdherenceMonitoring],
    ["renewal", runRenewalNotifications],
    ["retention", runRetentionCleanup],
  ];
  if (isQuarterStart) jobs.push(["hmoVolume", runQuarterlyVolumeTracking]);

  const results: Record<string, unknown> = {};
  let failed = false;
  for (const [name, run] of jobs) {
    try {
      results[name] = await run();
    } catch (error) {
      failed = true;
      results[name] = { error: error instanceof Error ? error.message : "failed" };
      logger.error(`CronDaily:${name}`, error);
    }
  }

  return NextResponse.json(
    { success: !failed, date: today, results, timestamp: new Date().toISOString() },
    { status: failed ? 500 : 200 }
  );
}
