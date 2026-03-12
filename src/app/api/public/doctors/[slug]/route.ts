import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const doctor = await prisma.doctorProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        schedules: {
          // where: { isActive: true }, 
          orderBy: { dayOfWeek: "asc" },
        },
        ratings: {
          select: {
            rating: true,
            review: true,
            createdAt: true,
            patient: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            appointments: true,
            ratings: true,
          },
        },
      },
    });

    if (!doctor || !doctor.isAvailable || !doctor.user) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Calculate average rating
    const avgRating =
      doctor.ratings.length > 0
        ? Number(
            (
              doctor.ratings.reduce((sum, r) => sum + r.rating, 0) /
              doctor.ratings.length
            ).toFixed(1),
          )
        : 0;

    // Format schedules by day
    const scheduleByDay = doctor.schedules.reduce(
      (acc, schedule) => {
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayName = days[schedule.dayOfWeek];

        if (!acc[dayName]) {
          acc[dayName] = [];
        }

        acc[dayName].push({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDuration: schedule.slotDuration,
          scheduleType: schedule.scheduleType,
        });

        return acc;
      },
      {} as Record<string, Array<{ startTime: string; endTime: string; slotDuration: number; scheduleType: string }>>,
    );

    const doctorData = {
      id: doctor.user.id,
      slug: doctor.slug,
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      profileImage: doctor.user.profileImage,
      specialty: doctor.specialty?.name || "General",
      specialtyDescription: doctor.specialty?.description,
      license: doctor.license,
      experience: doctor.experience,
      bio: doctor.bio,
      consultationFee: doctor.consultationFee,
      currency: doctor.currency,
      country: doctor.country,
      isAvailable: doctor.isAvailable,
      rating: avgRating,
      totalRatings: doctor.ratings.length,
      totalAppointments: doctor._count.appointments,
      schedules: scheduleByDay,
      reviews: doctor.ratings.map((r) => ({
        rating: r.rating,
        review: r.review,
        patientName: r.patient.user.name,
        createdAt: r.createdAt,
      })),
    };

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
