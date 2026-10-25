import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  formatApptDate,
  formatWatRange,
  watDayRange,
  watMidnightIso,
  watNow,
  ymdOfStoredDate,
} from "@/lib/wat";
import { requireAdminAuth, isAuthError, validateEmail } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";
import { logger } from "@/lib/logger";
import { auditAppointment } from "@/lib/audit";
import { appointmentInstant } from "@/lib/appointment-time";
import { findOpenSlot, getBookedSlots } from "@/lib/booking-availability";
import { blocksForDate, toMinutes, type Slot } from "@/lib/schedule-slots";
import { sendAppointmentEmails } from "@/lib/appointment-email";
import { startBookingAccount, normalizeEmail, TemporaryPasswordError } from "@/lib/temporary-password";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const { page, limit, skip } = parsePagination(searchParams);

    const statusParam = (searchParams.get("status") || "").toUpperCase();
    const status = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(statusParam)
      ? (statusParam as AppointmentStatus)
      : undefined;

    const searchWhere = search
      ? {
          OR: [
            {
              patient: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              doctor: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};
    const where = { ...searchWhere, ...(status ? { status } : {}) };

    // "Today" is the WAT day, the clock appointments are booked on.
    const { gte: today, lt: tomorrow } = watDayRange(watNow().ymd);

    const [appointments, matching, todayTotal, confirmed, pending, cancelled] =
      await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { appointmentDate: "desc" },
          include: {
            patient: {
              select: { name: true },
            },
            doctor: {
              select: { name: true },
            },
          },
        }),
        prisma.appointment.count({ where }),
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: today,
              lt: tomorrow,
            },
            status: "CONFIRMED",
          },
        }),
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: today,
              lt: tomorrow,
            },
            status: "PENDING",
          },
        }),
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: today,
              lt: tomorrow,
            },
            status: "CANCELLED",
          },
        }),
      ]);

    const appointmentsWithDetails = appointments.map((appointment) => ({
      id: appointment.id,
      patient: appointment.patient.name,
      doctor: appointment.doctor.name,
      date: ymdOfStoredDate(appointment.appointmentDate),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status.toLowerCase(),
      reason: appointment.reason,
      consultationFee: appointment.consultationFee,
    }));

    return NextResponse.json({
      appointments: appointmentsWithDetails,
      stats: {
        todayTotal,
        confirmed,
        pending,
        cancelled,
      },
      pagination: {
        page,
        limit,
        total: matching,
        pages: Math.ceil(matching / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

/**
 * The patient account to book for: an existing user by id, or one found or
 * created by email. A new account gets an emailed password so the patient can
 * sign in and see the appointment.
 */
async function resolvePatient(
  body: {
    patientId?: unknown;
    newPatient?: { name?: unknown; email?: unknown; phone?: unknown };
  },
  adminId: string,
  request: NextRequest,
): Promise<{ error: string; status: number } | { userId: string; profileId: string }> {
  let userId: string;

  if (typeof body.patientId === "string" && body.patientId) {
    const user = await prisma.user.findUnique({
      where: { id: body.patientId },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) return { error: "Patient not found.", status: 404 };
    userId = user.id;
  } else if (body.newPatient) {
    const { name, email, phone } = body.newPatient;
    if (typeof name !== "string" || !name.trim()) {
      return { error: "Enter the patient's name.", status: 400 };
    }
    if (typeof email !== "string" || !validateEmail(email.trim())) {
      return { error: "Enter a valid email address for the patient.", status: 400 };
    }
    try {
      await startBookingAccount(
        {
          email,
          name,
          phone: typeof phone === "string" ? phone : undefined,
          createdBy: adminId,
        },
        request,
      );
    } catch (error) {
      if (error instanceof TemporaryPasswordError) {
        return { error: error.message, status: error.status };
      }
      throw error;
    }
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) return { error: "That account is deactivated.", status: 400 };
    userId = user.id;
  } else {
    return { error: "Choose a patient or enter a new patient's details.", status: 400 };
  }

  const profile =
    (await prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } })) ??
    (await prisma.patientProfile.create({ data: { userId }, select: { id: true } }));
  return { userId, profileId: profile.id };
}

/**
 * The secretariat books a patient with a doctor. Normally into one of the
 * doctor's open slots, the same rule as a patient booking; with offSchedule a
 * time outside the published schedule, provided it doesn't clash with another
 * booking. No payment is taken here: the fee is recorded (or waived) and
 * collected outside the booking flow.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { doctorId, date, startTime, reason, notes } = body;
    const offSchedule = body.offSchedule === true;
    const feeWaived = body.feeWaived === true;
    const consultationMode = body.consultationMode === "IN_PERSON" ? "IN_PERSON" : "VIDEO";

    if (typeof doctorId !== "string" || !doctorId) {
      return NextResponse.json({ error: "Choose a doctor." }, { status: 400 });
    }
    if (typeof date !== "string" || !DATE_RE.test(date)) {
      return NextResponse.json({ error: "Choose a date." }, { status: 400 });
    }
    if (typeof startTime !== "string" || !TIME_RE.test(startTime)) {
      return NextResponse.json({ error: "Choose a time." }, { status: 400 });
    }
    const dateIso = watMidnightIso(date);
    if (appointmentInstant(dateIso, startTime) <= new Date()) {
      return NextResponse.json({ error: "The appointment must be in the future." }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      select: {
        consultationFee: true,
        schedules: true,
        user: { select: { name: true, isActive: true } },
      },
    });
    if (!doctor || !doctor.user.isActive) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    let slot: Slot | null;
    if (offSchedule) {
      const { endTime } = body;
      if (typeof endTime !== "string" || !TIME_RE.test(endTime) || toMinutes(endTime) <= toMinutes(startTime)) {
        return NextResponse.json({ error: "The end time must be after the start time." }, { status: 400 });
      }
      const booked = await getBookedSlots(doctorId, dateIso);
      const clash = booked.find(
        (b) => toMinutes(b.startTime) < toMinutes(endTime) && toMinutes(startTime) < toMinutes(b.endTime),
      );
      if (clash) {
        return NextResponse.json(
          { error: `Dr. ${doctor.user.name} already has a booking ${formatWatRange(clash.startTime, clash.endTime)} that day.` },
          { status: 409 },
        );
      }
      slot = { startTime, endTime };
    } else {
      slot = await findOpenSlot(doctorId, dateIso, startTime);
      if (!slot) {
        return NextResponse.json(
          { error: "That time is no longer open on the doctor's schedule. Pick another slot, or book it as off-schedule." },
          { status: 409 },
        );
      }
    }

    const patient = await resolvePatient(body, auth.userId, request);
    if ("error" in patient) {
      return NextResponse.json({ error: patient.error }, { status: patient.status });
    }
    if (patient.userId === doctorId) {
      return NextResponse.json({ error: "A doctor cannot be booked with themselves." }, { status: 400 });
    }

    // For an in-person visit, default to the clinic of the block the slot falls in.
    let clinicLocation =
      typeof body.clinicLocation === "string" && body.clinicLocation.trim() ? body.clinicLocation.trim() : null;
    if (consultationMode === "IN_PERSON" && !clinicLocation) {
      const start = toMinutes(slot.startTime);
      const block = blocksForDate(doctor.schedules, date).find(
        (b) =>
          b.scheduleType === "AVAILABLE" &&
          b.location &&
          toMinutes(b.startTime) <= start &&
          start < toMinutes(b.endTime),
      );
      clinicLocation = block?.location ?? null;
    }

    const bookedBy = `Booked by ${auth.name || "the secretariat"} (secretariat).`;
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: patient.userId,
        appointmentDate: dateIso,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: AppointmentStatus.CONFIRMED,
        reason: (typeof reason === "string" && reason.trim()) || "Consultation",
        notes: typeof notes === "string" && notes.trim() ? `${notes.trim()}\n\n${bookedBy}` : bookedBy,
        consultationFee: feeWaived ? 0 : Number(doctor.consultationFee),
        consultationMode,
        clinicLocation,
        meetingLink: `/room/${uuidv4()}`,
      },
      include: { patient: { select: { name: true } } },
    });

    const when = `${formatApptDate(appointment.appointmentDate)} at ${formatWatRange(appointment.startTime)}`;
    await Promise.allSettled([
      sendAppointmentEmails(appointment.id, "CONFIRMED"),
      prisma.notification.createMany({
        data: [
          {
            userId: doctorId,
            title: "New Appointment",
            message: `The secretariat booked ${appointment.patient.name} with you on ${when}${offSchedule ? " (outside your published schedule)" : ""}.`,
            type: "info",
            link: "/doctor/appointments",
          },
          {
            userId: patient.userId,
            title: "Appointment Confirmed",
            message: `Your appointment with Dr. ${doctor.user.name} on ${when} has been confirmed.`,
            type: "success",
            link: "/appointments",
          },
        ],
      }),
      auditAppointment.book(
        auth.userId,
        appointment.id,
        {
          via: "secretariat",
          doctorId,
          patientId: patient.userId,
          date,
          time: `${slot.startTime}-${slot.endTime}`,
          offSchedule,
          feeWaived,
        },
        request,
      ),
    ]);

    return NextResponse.json({ success: true, appointmentId: appointment.id }, { status: 201 });
  } catch (error) {
    logger.error("AdminBookAppointment", error);
    return NextResponse.json({ error: "Failed to book the appointment" }, { status: 500 });
  }
}
