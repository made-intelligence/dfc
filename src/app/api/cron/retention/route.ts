import { NextRequest, NextResponse } from "next/server";
import { runRetentionCleanup } from "@/lib/data-retention";
import { logger } from "@/lib/logger";
import { secureEquals } from "@/lib/secure-compare";

/**
 * Data retention cleanup cron endpoint.
 * Secured by CRON_SECRET — call from Vercel Cron, GitHub Actions, or similar.
 * Schedule: daily at 03:00 UTC
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !secureEquals(authHeader, `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runRetentionCleanup();

    logger.info("CronRetention", `Completed — tokens=${result.tokens}, notifications=${result.notifications}`);

    return NextResponse.json({
      success: true,
      cleaned: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("CronRetention", error);
    return NextResponse.json(
      { error: "Retention cleanup failed" },
      { status: 500 }
    );
  }
}
