import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { hasValidConsent } from "@/lib/consent";
import { appointmentWindow, JOIN_EARLY_MINUTES } from "@/lib/appointment-time";
import { createMeetingToken, ensureRoom, isDailyConfigured } from "@/lib/daily";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Meeting ID (uuid from url)
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Meeting links are "/room/<uuid>"; match the whole link, not a substring.
    const appointment = await prisma.appointment.findFirst({
      where: { meetingLink: `/room/${id}` },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            doctorProfile: {
              select: {
                specialty: { select: { name: true } },
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Verify participant
    const isDoctor = appointment.doctorId === payload.userId;
    const isPatient = appointment.patientId === payload.userId;

    if (!isDoctor && !isPatient) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json({ error: "This appointment was cancelled." }, { status: 403 });
    }
    if (appointment.consultationMode === "IN_PERSON") {
      return NextResponse.json(
        { error: "This is an in-person appointment, so there is no video call." },
        { status: 403 }
      );
    }

    // Join window: from shortly before the start until the end of the slot.
    const { start, end } = appointmentWindow(
      appointment.appointmentDate,
      appointment.startTime,
      appointment.endTime
    );
    const now = new Date();
    if (now.getTime() < start.getTime() - JOIN_EARLY_MINUTES * 60_000) {
      return NextResponse.json(
        {
          error: `It is too early to join this consultation. The room opens ${JOIN_EARLY_MINUTES} minutes before the start time.`,
          code: "TOO_EARLY",
          startsAt: start.toISOString(),
        },
        { status: 403 }
      );
    }
    if (now > end) {
      return NextResponse.json({ error: "This consultation has ended.", code: "ENDED" }, { status: 403 });
    }

    // Telemedicine consent. The patient gives it here on first join, so a
    // missing consent is a prompt for them rather than a dead end. The doctor
    // may wait in the room meanwhile; the patient cannot enter without it.
    if (isPatient) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: appointment.patientId },
        select: { id: true },
      });
      if (patientProfile && !(await hasValidConsent(patientProfile.id, "TELEMEDICINE"))) {
        return NextResponse.json(
          {
            error: "Please confirm your consent to a video consultation.",
            code: "CONSENT_REQUIRED",
            patientProfileId: patientProfile.id,
          },
          { status: 403 }
        );
      }
    }

    // Location if provided (sanitized)
    const rawLocation = new URL(request.url).searchParams.get("location");
    const location = rawLocation
      ? rawLocation.replace(/<[^>]*>/g, "").replace(/[<>"'&]/g, "").trim().slice(0, 255)
      : "";

    // Attendance and location, in one write
    const attendance: Record<string, unknown> = {};
    if (isDoctor && !appointment.doctorJoinedAt) attendance.doctorJoinedAt = now;
    if (isPatient && !appointment.patientJoinedAt) attendance.patientJoinedAt = now;
    if (location) attendance[isDoctor ? "doctorLocation" : "patientLocation"] = location;
    if (Object.keys(attendance).length > 0) {
      await prisma.appointment.update({ where: { id: appointment.id }, data: attendance });
      if (location) {
        if (isDoctor) appointment.doctorLocation = location;
        else appointment.patientLocation = location;
      }
    }

    // Back-to-back appointment after this one (doctor only)
    let nextAppointmentStartTime = null;
    if (isDoctor) {
      const nextAppt = await prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.endTime,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startTime: true },
      });
      if (nextAppt) nextAppointmentStartTime = nextAppt.startTime;
    }

    // Video room and this participant's admission token
    let call: { url: string; token: string } | null = null;
    let callError: string | null = null;
    if (!isDailyConfigured()) {
      callError = "Video calling is not configured yet. Please contact DFC support.";
      logger.error("RoomDetail", "DAILY_API_KEY is not set");
    } else {
      try {
        const room = await ensureRoom(appointment.id, end);
        const meetingToken = await createMeetingToken({
          roomName: room.name,
          userId: payload.userId,
          userName: isDoctor ? appointment.doctor.name : appointment.patient.name,
          isOwner: isDoctor,
          endsAt: end,
        });
        call = { url: room.url, token: meetingToken };
      } catch (err) {
        logger.error("RoomDaily", err);
        callError = "We could not start the video call. Please refresh to try again.";
      }
    }

    return NextResponse.json({
      success: true,
      call,
      callError,
      appointment: {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        appointmentDate: appointment.appointmentDate,
        reason: appointment.reason,
        doctor: appointment.doctor,
        patient: appointment.patient,
        patientLocation: appointment.patientLocation,
        doctorLocation: appointment.doctorLocation,
        nextAppointmentStartTime,
        currentUser: {
          id: payload.userId,
          role: isDoctor ? "DFC_MEMBER" : "PATIENT",
          name: isDoctor ? appointment.doctor.name : appointment.patient.name,
        },
      },
    });
  } catch (error) {
    logger.error("RoomDetail", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
