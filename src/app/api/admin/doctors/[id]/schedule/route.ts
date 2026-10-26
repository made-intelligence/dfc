import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { auditAppointment } from "@/lib/audit";
import { scheduleBlockData } from "@/lib/doctor-schedule";

// The secretariat manages a doctor's schedule and fee on their behalf: the
// same blocks and rules as the doctor's own schedule page (/api/doctor/schedule).

type Params = { params: Promise<{ id: string }> };

/** The doctor (by user id) the request is about, or an error response. */
async function loadDoctor(request: NextRequest, params: Params["params"]) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return { response: auth };

  const { id } = await params;
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: id },
    select: {
      id: true,
      consultationFee: true,
      consultationFeeNote: true,
      user: { select: { id: true, name: true } },
    },
  });
  if (!doctor) {
    return { response: NextResponse.json({ error: "Doctor not found" }, { status: 404 }) };
  }
  return { auth, doctor };
}

function logChange(adminId: string, doctorUserId: string, change: string, details: Record<string, unknown>, request: NextRequest) {
  return auditAppointment.schedule(adminId, doctorUserId, { change, by: "secretariat", ...details }, request);
}

/** Tell the doctor someone else changed their schedule. Never throws. */
function notifyDoctor(doctorUserId: string, message: string) {
  return prisma.notification
    .create({
      data: {
        userId: doctorUserId,
        title: "Schedule updated by the secretariat",
        message,
        type: "info",
        link: "/doctor/schedule",
      },
    })
    .catch((err) => logger.error("AdminDoctorScheduleNotify", err));
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const loaded = await loadDoctor(request, params);
    if ("response" in loaded) return loaded.response;
    const { doctor } = loaded;

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      doctor: { id: doctor.user.id, name: doctor.user.name },
      schedules,
      consultationFee: doctor.consultationFee?.toString() || "0",
      consultationFeeNote: doctor.consultationFeeNote || "",
    });
  } catch (error) {
    logger.error("AdminDoctorSchedule", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const loaded = await loadDoctor(request, params);
    if ("response" in loaded) return loaded.response;
    const { auth, doctor } = loaded;

    const body = await request.json();
    delete body.id; // a new block has no id to exclude from the overlap check
    const checked = await scheduleBlockData(doctor.id, body);
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const schedule = await prisma.doctorSchedule.create({
      data: { doctorId: doctor.id, ...checked.data },
    });

    await Promise.all([
      logChange(auth.userId, doctor.user.id, "create", { scheduleId: schedule.id }, request),
      notifyDoctor(doctor.user.id, "A block was added to your schedule. Please review it."),
    ]);
    return NextResponse.json(schedule);
  } catch (error) {
    logger.error("AdminDoctorSchedule", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const loaded = await loadDoctor(request, params);
    if ("response" in loaded) return loaded.response;
    const { auth, doctor } = loaded;

    const body = await request.json();
    if (typeof body.id !== "string") {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }
    const checked = await scheduleBlockData(doctor.id, body);
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const schedule = await prisma.doctorSchedule.update({
      where: { id: body.id, doctorId: doctor.id },
      data: checked.data,
    });

    await Promise.all([
      logChange(auth.userId, doctor.user.id, "update", { scheduleId: schedule.id }, request),
      notifyDoctor(doctor.user.id, "A block on your schedule was changed. Please review it."),
    ]);
    return NextResponse.json(schedule);
  } catch (error) {
    logger.error("AdminDoctorSchedule", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const loaded = await loadDoctor(request, params);
    if ("response" in loaded) return loaded.response;
    const { auth, doctor } = loaded;

    const { consultationFee, consultationFeeNote } = await request.json();
    const fee = Number(consultationFee ?? 0);
    if (!Number.isFinite(fee) || fee < 0) {
      return NextResponse.json({ error: "Enter a valid fee." }, { status: 400 });
    }

    await prisma.doctorProfile.update({
      where: { id: doctor.id },
      data: {
        consultationFee: fee,
        consultationFeeNote: consultationFeeNote || null,
      },
    });

    await Promise.all([
      logChange(
        auth.userId,
        doctor.user.id,
        "fee",
        { from: doctor.consultationFee?.toString(), to: fee },
        request,
      ),
      notifyDoctor(doctor.user.id, `Your consultation fee was set to ₦${fee.toLocaleString()}.`),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("AdminDoctorSchedule", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const loaded = await loadDoctor(request, params);
    if ("response" in loaded) return loaded.response;
    const { auth, doctor } = loaded;

    const scheduleId = new URL(request.url).searchParams.get("id");
    if (!scheduleId) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    await prisma.doctorSchedule.delete({
      where: { id: scheduleId, doctorId: doctor.id },
    });

    await Promise.all([
      logChange(auth.userId, doctor.user.id, "delete", { scheduleId }, request),
      notifyDoctor(doctor.user.id, "A block was removed from your schedule. Please review it."),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("AdminDoctorSchedule", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
