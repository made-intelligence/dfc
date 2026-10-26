import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getPublicDoctorBySlug } from "@/lib/public-doctor";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const doctorData = await getPublicDoctorBySlug(slug);

    if (!doctorData) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor: doctorData }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (error) {
    logger.error('PublicDoctorDetail', error);
    return NextResponse.json(
      { error: "Failed to fetch doctor" },
      { status: 500 },
    );
  }
}
