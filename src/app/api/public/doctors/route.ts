import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { parsePagination } from "@/lib/pagination";
import { normalizeSpecialtyName } from "@/lib/specialties";

// Upper bound on rows scanned when rating has to be filtered/sorted in memory.
const RATING_SCAN_LIMIT = 500;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get("specialtyId") || "";
    const specialtyName = searchParams.get("specialty") || "";
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

    // Specialty filter — by id, or by name when the caller only has a label.
    // Matching by name must never fall through to "no filter", otherwise a
    // search for a specialty nobody practises returns the whole directory.
    if (specialtyId) {
      where.specialtyId = specialtyId;
    } else if (specialtyName) {
      const target = normalizeSpecialtyName(specialtyName);
      const allSpecialties = await prisma.specialty.findMany({
        select: { id: true, name: true },
      });
      const matchedIds = allSpecialties
        .filter((s) => normalizeSpecialtyName(s.name) === target)
        .map((s) => s.id);
      // An empty list is intentional: unknown specialty => zero results.
      where.specialtyId = { in: matchedIds };
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

    const include = {
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
        where: { scheduleType: 'AVAILABLE' as const },
        select: { consultationMode: true, location: true },
      },
    };

    // Rating is computed from related rows, not a DB column, so filtering or
    // sorting by it has to happen after the query. Doing that on a single page
    // would make `total` disagree with what is actually rendered (the page can
    // end up empty while the header still claims N results), so in that case we
    // load the matching set and paginate in memory instead.
    const ratingInMemory = minRating > 0 || sortBy === "rating";

    const [doctors, dbTotal] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip: ratingInMemory ? 0 : skip,
        take: ratingInMemory ? RATING_SCAN_LIMIT : limit,
        orderBy,
        include,
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

    let totalDoctors = dbTotal;

    if (ratingInMemory) {
      if (minRating > 0) {
        doctorsWithStats = doctorsWithStats.filter((d) => d.rating >= minRating);
      }
      if (sortBy === "rating") {
        doctorsWithStats.sort((a, b) => b.rating - a.rating);
      }
      // Count what the caller can actually reach, so an empty page and a
      // "0 found" header always agree.
      totalDoctors = doctorsWithStats.length;
      doctorsWithStats = doctorsWithStats.slice(skip, skip + limit);
    }

    return NextResponse.json(
      {
        doctors: doctorsWithStats,
        pagination: {
          page,
          limit,
          total: totalDoctors,
          pages: Math.max(1, Math.ceil(totalDoctors / limit)),
        },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  } catch (error) {
    logger.error('PublicDoctors', error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}
