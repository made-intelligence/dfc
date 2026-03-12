import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get("specialtyId") || "";
    const institution = searchParams.get("institution") || "";
    const city = searchParams.get("city") || "";
    const country = searchParams.get("country") || "";
    const search = searchParams.get("search") || "";
    const minExperience = parseInt(searchParams.get("minExperience") || "0");
    const maxFee = searchParams.get("maxFee") || "";
    const minFee = searchParams.get("minFee") || "";
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const sortBy = searchParams.get("sort") || "newest";
    const { page, limit, skip } = parsePagination(searchParams);

    // Build where clause
    const where: Prisma.DoctorProfileWhereInput = {
      isAvailable: true,
      user: {
        isActive: true,
      },
    };

    // Text search (doctor name or specialty name)
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { specialty: { name: { contains: search, mode: "insensitive" } } },
        { subSpecialty: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }

    // Specialty filter
    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    // Institution filter
    if (institution) {
      where.institution = { contains: institution, mode: "insensitive" as const };
    }

    // City filter
    if (city) {
      where.city = { contains: city, mode: "insensitive" as const };
    }

    // Country filter
    if (country) {
      where.country = { contains: country, mode: "insensitive" as const };
    }

    // Experience filter
    if (minExperience > 0) {
      where.experience = { gte: minExperience };
    }

    // Fee range filter
    const feeFilter: Prisma.DoctorProfileWhereInput["consultationFee"] = {};
    if (minFee) feeFilter.gte = parseFloat(minFee);
    if (maxFee) feeFilter.lte = parseFloat(maxFee);
    if (Object.keys(feeFilter).length > 0) {
      where.consultationFee = feeFilter;
    }

    // Sort
    let orderBy: Prisma.DoctorProfileOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "experience") orderBy = { experience: "desc" };
    if (sortBy === "fee_low") orderBy = { consultationFee: "asc" };
    if (sortBy === "fee_high") orderBy = { consultationFee: "desc" };

    const [doctors, totalDoctors] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
          schedules: {
            where: { scheduleType: 'AVAILABLE' },
            select: { consultationMode: true, location: true },
          },
        },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    let doctorsWithStats = doctors.map((doctor) => {
      // Derive available consultation modes from schedules
      const modes = new Set<string>();
      let clinicLocation: string | null = null;
      for (const s of doctor.schedules) {
        const mode = s.consultationMode || 'VIDEO';
        if (mode === 'BOTH') { modes.add('VIDEO'); modes.add('IN_PERSON'); }
        else { modes.add(mode); }
        if (s.location) clinicLocation = s.location;
      }

      return {
        id: doctor.user.id,
        slug: doctor.slug,
        name: doctor.user.name,
        profileImage: doctor.user.profileImage,
        specialty: doctor.specialty?.name || "General",
        specialtyId: doctor.specialtyId,
        consultationFee: doctor.consultationFee,
        currency: doctor.currency,
        country: doctor.country,
        institution: doctor.institution,
        city: doctor.city,
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
        hasVideo: modes.has('VIDEO') || modes.size === 0, // default to video if no schedules
        hasInPerson: modes.has('IN_PERSON'),
        clinicLocation,
      };
    });

    // Post-query rating filter (rating is computed, not a DB column)
    if (minRating > 0) {
      doctorsWithStats = doctorsWithStats.filter((d) => d.rating >= minRating);
    }

    // Sort by rating (post-query)
    if (sortBy === "rating") {
      doctorsWithStats.sort((a, b) => b.rating - a.rating);
    }

    return NextResponse.json(
      {
        doctors: doctorsWithStats,
        pagination: {
          page,
          limit,
          total: totalDoctors,
          pages: Math.ceil(totalDoctors / limit),
        },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch (error) {
    logger.error('PublicDoctors', error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}
