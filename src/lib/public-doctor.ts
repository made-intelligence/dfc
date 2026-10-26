import { prisma } from "@/lib/prisma";

/**
 * Public profile of one doctor, by slug, or null when there is no bookable
 * doctor behind it.
 *
 * Shared by the public API and the /book/[slug] page. The page used to fetch
 * the API over HTTP via APP_URL, which 404'd every profile whenever the server
 * was not reachable at that URL (dev on another port, APP_URL pointing at a
 * different deployment).
 */
export async function getPublicDoctorBySlug(slug: string) {
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

  if (!doctor || !doctor.isAvailable || !doctor.user) return null;

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
  // Weekly view only; one-off blocks (days off, extra clinics) are dated.
  const scheduleByDay = doctor.schedules.filter((s) => s.isRecurring).reduce(
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
        bufferTime: schedule.bufferTime,
        scheduleType: schedule.scheduleType,
        consultationMode: schedule.consultationMode,
        location: schedule.location,
      });

      return acc;
    },
    {} as Record<string, Array<{ startTime: string; endTime: string; slotDuration: number; bufferTime: number; scheduleType: string; consultationMode: string; location: string | null }>>,
  );

  // Derive consultation modes from schedules
  const bookable = doctor.schedules.filter((s) => s.scheduleType === "AVAILABLE");
  const hasVideo = bookable.some((s) => s.consultationMode === "VIDEO" || s.consultationMode === "BOTH");
  const hasInPerson = bookable.some((s) => s.consultationMode === "IN_PERSON" || s.consultationMode === "BOTH");
  const clinicLocation = bookable.find((s) => s.consultationMode === "IN_PERSON" || s.consultationMode === "BOTH")?.location || null;

  return {
    id: doctor.user.id,
    slug: doctor.slug,
    name: doctor.user.name,
    // email + phone removed from public API — contact via booking system
    profileImage: doctor.user.profileImage,
    specialty: doctor.specialty?.name || "General",
    specialtyDescription: doctor.specialty?.description,
    // license number removed from public API — sensitive credential
    experience: doctor.experience,
    bio: doctor.bio,
    consultationFee: doctor.consultationFee,
    currency: doctor.currency,
    country: doctor.country,
    isAvailable: doctor.isAvailable,
    hasVideo,
    hasInPerson,
    clinicLocation,
    rating: avgRating,
    totalRatings: doctor.ratings.length,
    totalAppointments: doctor._count.appointments,
    schedules: scheduleByDay,
    // Every block with its dates, for the booking wizard's per-date slots.
    scheduleBlocks: doctor.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: s.slotDuration,
      bufferTime: s.bufferTime,
      scheduleType: s.scheduleType,
      maxBookingsPerSlot: s.maxBookingsPerSlot,
      isRecurring: s.isRecurring,
      validFrom: s.validFrom ? s.validFrom.toISOString().slice(0, 10) : null,
      validUntil: s.validUntil ? s.validUntil.toISOString().slice(0, 10) : null,
      consultationMode: s.consultationMode,
      location: s.location,
    })),
    reviews: doctor.ratings.map((r) => ({
      rating: r.rating,
      review: r.review,
      patientName: r.patient.user.name,
      createdAt: r.createdAt,
    })),
  };
}
