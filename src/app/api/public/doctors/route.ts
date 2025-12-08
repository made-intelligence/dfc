import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const specialtyId = searchParams.get("specialtyId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isAvailable: true,
      user: {
        isActive: true,
      },
    };

    // Add search filter
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" as const } } },
        { bio: { contains: search, mode: "insensitive" as const } },
      ];
    }

    // Add specialty filter
    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    const [doctors, totalDoctors] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          specialty: {
            select: {
              id: true,
              name: true,
            },
          },
          ratings: {
            select: { rating: true },
          },
        },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    const doctorsWithStats = doctors.map((doctor) => ({
      id: doctor.user.id,
      slug: doctor.slug,
      name: doctor.user.name,
      profileImage: doctor.user.profileImage,
      specialty: doctor.specialty?.name || "General",
      specialtyId: doctor.specialtyId,
      consultationFee: doctor.consultationFee,
      currency: doctor.currency,
      country: doctor.country,
      bio: doctor.bio,
      experience: doctor.experience,
      rating:
        doctor.ratings.length > 0
          ? Number(
              (
                doctor.ratings.reduce((sum, r) => sum + r.rating, 0) /
                doctor.ratings.length
              ).toFixed(1),
            )
          : 0,
      totalRatings: doctor.ratings.length,
    }));

    return NextResponse.json({
      doctors: doctorsWithStats,
      pagination: {
        page,
        limit,
        total: totalDoctors,
        pages: Math.ceil(totalDoctors / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}
