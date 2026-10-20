import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getBookedSlots } from "@/lib/booking-availability";

// Times already taken on a day, so the booking wizard can hide them.
// Returns only start/end times, nothing about who booked.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    if (!doctorId || !date || isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: "doctorId and date are required" }, { status: 400 });
    }
    const booked = await getBookedSlots(doctorId, date);
    return NextResponse.json({ booked });
  } catch (error) {
    logger.error("BookedSlots", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
