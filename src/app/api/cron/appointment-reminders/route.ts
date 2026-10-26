import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { secureEquals } from "@/lib/secure-compare";
import { runAppointmentReminders } from "@/lib/jobs/appointment-reminders";

/**
 * Appointment reminder emails on their own, for a manual or more frequent run;
 * the scheduled daily run is /api/cron/daily. Secured by CRON_SECRET as a
 * Bearer token. Scheduling this every 15 minutes would make the "starting
 * soon" email reliable; any cadence is safe because each reminder is sent once.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !secureEquals(request.headers.get("authorization"), `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAppointmentReminders();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error("CronAppointmentReminders", error);
    return NextResponse.json({ error: "Reminder job failed" }, { status: 500 });
  }
}
