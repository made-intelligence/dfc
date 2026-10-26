"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Video,
  XCircle,
} from "lucide-react";
import { isPast } from "date-fns";
import { formatApptDate, formatInstantWat, formatWatRange, watMidnightIso, watNow, ymdOfStoredDate, WAT_LONG_LABEL } from "@/lib/wat";
import { appointmentInstant, appointmentWindow, JOIN_EARLY_MINUTES } from "@/lib/appointment-time";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/toast";
import { Loading } from "@/components/ui/loading";

interface Appointment {
  id: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
  notes?: string;
  consultationFee: number;
  meetingLink?: string;
  consultationMode?: "VIDEO" | "IN_PERSON" | "BOTH";
  doctor: {
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  doctorProfile: {
    specialty: {
      name: string;
    } | null;
    consultationFee: number;
    currency: string;
  };
}

// ... existing imports ...

// Helper
const getDifferenceInMinutes = (date1: Date, date2: Date) => {
    return Math.floor((date1.getTime() - date2.getTime()) / 60000);
};

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Dialog States
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [openSlots, setOpenSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    } else if (user && user.role !== "PATIENT") {
      router.push("/");
    } else if (user) {
      fetchAppointments();
    }
  }, [user, authLoading, router]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/patient/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        setError("Failed to load appointments");
      }
    } catch (err) {
      setError("An error occurred while loading your appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };

  const handleRescheduleClick = (appointment: Appointment) => {
      setSelectedAppointment(appointment);
      setRescheduleDate(ymdOfStoredDate(appointment.appointmentDate));
      setRescheduleTime("");
      setShowRescheduleDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    setCancellingId(selectedAppointment.id);
    setError("");

    try {
      const response = await fetch("/api/patient/appointments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedAppointment.id,
          status: "CANCELLED",
        }),
      });

      if (response.ok) {
        const updatedAppointment = await response.json();
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === updatedAppointment.id ? updatedAppointment : apt
          )
        );
        addToast({
          title: "Appointment Cancelled",
          description: "Your appointment has been cancelled successfully",
          type: "success",
        });
      } else {
        setError("Failed to cancel appointment");
      }
    } catch (err) {
      setError("An error occurred while canceling the appointment");
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
      setSelectedAppointment(null);
    }
  };

  // Open slots for the chosen reschedule day, from the doctor's real schedule.
  useEffect(() => {
    if (!showRescheduleDialog || !selectedAppointment || !rescheduleDate) return;
    let active = true;
    setSlotsLoading(true);
    setRescheduleTime("");
    fetch(
      `/api/public/doctors/booked-slots?doctorId=${selectedAppointment.doctorId}&date=${encodeURIComponent(watMidnightIso(rescheduleDate))}`
    )
      .then((res) => (res.ok ? res.json() : { open: [] }))
      .then((data) => {
        if (!active) return;
        const now = watNow();
        const open: { startTime: string; endTime: string }[] = data.open || [];
        setOpenSlots(rescheduleDate === now.ymd ? open.filter((s) => s.startTime > now.hhmm) : open);
      })
      .catch(() => active && setOpenSlots([]))
      .finally(() => active && setSlotsLoading(false));
    return () => {
      active = false;
    };
  }, [showRescheduleDialog, selectedAppointment, rescheduleDate]);

  const handleRescheduleConfirm = async () => {
      if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;

      try {
           const response = await fetch("/api/patient/appointments", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: selectedAppointment.id,
              appointmentDate: watMidnightIso(rescheduleDate),
              startTime: rescheduleTime,
            }),
          });

          if (response.ok) {
            fetchAppointments(); // Refresh list
            addToast({
              title: "Appointment Rescheduled",
              description: "Your appointment has been successfully rescheduled.",
              type: "success",
            });
            setShowRescheduleDialog(false);
          } else {
            const data = await response.json();
            setError(data.error || "Failed to reschedule appointment");
             addToast({
              title: "Reschedule Failed",
              description: data.error || "Failed to reschedule appointment",
              type: "error",
            });
          }

      } catch (e) {
         setError("An error occurred while rescheduling");
      }
  };

  const getStatusBadge = (appointment: Appointment) => {
    const { status, appointmentDate, endTime } = appointment;
    const isMissed = isAppointmentPast(appointmentDate, endTime) && (status === 'PENDING' || status === 'CONFIRMED');

    if (isMissed) {
         return <Badge variant="destructive">Missed</Badge>;
    }

    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      PENDING: { variant: "secondary", label: "Pending" },
      CONFIRMED: { variant: "default", label: "Confirmed" },
      COMPLETED: { variant: "outline", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      NO_SHOW: { variant: "destructive", label: "No Show" },
    };

    const config = variants[status] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isAppointmentPast = (appointmentDate: string, endTime: string) => {
    return isPast(appointmentInstant(appointmentDate, endTime));
  };

  const canCancelAppointment = (appointment: Appointment) => {
      if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") return false;

      // 24 Hour Check
      const apptDate = appointmentInstant(appointment.appointmentDate, appointment.startTime);
      const diffMinutes = getDifferenceInMinutes(apptDate, new Date());
      return diffMinutes >= 1440; // Allow if more than 24h away
  };

  if (authLoading || loading) {
    return <Loading type="pulse" size="lg" className="min-h-screen" />;
  }

  const upcomingAppointments = appointments.filter(
    (apt) =>
      !isAppointmentPast(apt.appointmentDate, apt.endTime) &&
      apt.status !== "CANCELLED" &&
      apt.status !== "COMPLETED"
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      isAppointmentPast(apt.appointmentDate, apt.endTime) ||
      apt.status === "CANCELLED" ||
      apt.status === "COMPLETED"
  );

  return (
    <>
      <Topbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">
            View and manage your appointments
          </p>
        </div>
        <Button onClick={() => router.push("/book")}>
          <Calendar className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Upcoming Appointments
        </h2>
        {upcomingAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No upcoming appointments scheduled
                </p>
                <Button onClick={() => router.push("/book")}>
                  Book Your First Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Dr. {appointment.doctor.name}
                        </CardTitle>
                        <CardDescription>
                          {appointment.doctorProfile.specialty?.name ||
                            "General Practitioner"}
                        </CardDescription>
                      </div>
                  </div>
                    {getStatusBadge(appointment)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatApptDate(appointment.appointmentDate, "long")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatWatRange(appointment.startTime, appointment.endTime)}
                    </span>
                  </div>
                  {appointment.reason && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4 mt-0.5" />
                      <span>{appointment.reason}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-sm font-bold">₦</span>
                    <span>
                      {appointment.doctorProfile.currency}{" "}
                      {appointment.consultationFee.toFixed(2)}
                    </span>
                  </div>
                  {/* Join Button Logic - Only if timely */}
                  {(() => {
                      if (!appointment.meetingLink) return null;

                      if (appointment.consultationMode === "IN_PERSON") return null;
                      const { start: startDateTime, end: endDateTime } = appointmentWindow(
                        appointment.appointmentDate,
                        appointment.startTime,
                        appointment.endTime
                      );
                      const now = new Date();
                      const joinWindowStart = new Date(startDateTime.getTime() - JOIN_EARLY_MINUTES * 60000);

                      const isTooEarly = now < joinWindowStart;
                      const isEnded = now > endDateTime;
                      const canJoin = !isTooEarly && !isEnded;

                      // if (!canJoin) return null; // User wants it visible but disabled

                     return (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        // Full page load: the room's camera/microphone permission
                        // header only applies to a document loaded at that URL.
                        onClick={() => window.location.assign(appointment.meetingLink!)}
                        disabled={!canJoin}
                        title={!canJoin ? `Opens ${formatInstantWat(joinWindowStart)}` : "Join Meeting"}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Video Call
                      </Button>
                    </div>
                  );
                  })()}
                  {canCancelAppointment(appointment) && (
                    <div className="pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCancelClick(appointment)}
                        disabled={cancellingId === appointment.id}
                      >
                        {cancellingId === appointment.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Cancel Appointment
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleRescheduleClick(appointment)}
                        disabled={cancellingId === appointment.id}
                      >
                         <Clock className="h-4 w-4 mr-2" />
                         Reschedule
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Past Appointments */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Past Appointments
        </h2>
        {pastAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No past appointments</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            Dr. {appointment.doctor.name}
                          </h3>
                          {getStatusBadge(appointment)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatApptDate(appointment.appointmentDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatWatRange(appointment.startTime)}
                          </span>
                          {appointment.doctorProfile.specialty && (
                            <span className="text-gray-400">
                              • {appointment.doctorProfile.specialty.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment with Dr.{" "}
              {selectedAppointment?.doctor.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Dialog */}
      <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Appointment</AlertDialogTitle>
            <AlertDialogDescription>
                Select a new date and time for your appointment with Dr. {selectedAppointment?.doctor.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4 py-4">
               <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                   <label className="text-right text-sm font-medium">Date</label>
                   <Input
                        type="date"
                        className="col-span-3"
                        min={watNow().ymd}
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                   />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4">
                   <label className="text-right text-sm font-medium sm:pt-2">Time</label>
                   <div className="col-span-3">
                     {slotsLoading ? (
                       <p className="text-sm text-gray-500">Loading available times...</p>
                     ) : openSlots.length === 0 ? (
                       <p className="text-sm text-gray-500">No open times on this day. Try another date.</p>
                     ) : (
                       <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
                         {openSlots.map((s) => (
                           <Button
                             key={s.startTime}
                             type="button"
                             size="sm"
                             variant={rescheduleTime === s.startTime ? "default" : "outline"}
                             onClick={() => setRescheduleTime(s.startTime)}
                           >
                             {s.startTime}
                           </Button>
                         ))}
                       </div>
                     )}
                     <p className="mt-2 text-xs text-gray-500">All times are {WAT_LONG_LABEL}.</p>
                   </div>
               </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleRescheduleConfirm} disabled={!rescheduleDate || !rescheduleTime}>
                Confirm Reschedule
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
      <Footer />
    </>
  );
}
