"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { format, isPast, parseISO } from "date-fns";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/toast";
import { Loading } from "@/components/ui/loading";

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
  notes?: string;
  consultationFee: number;
  meetingLink?: string;
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
      setRescheduleDate(appointment.appointmentDate.split('T')[0]); // Pre-fill
      setRescheduleTime(appointment.startTime);
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

  const handleRescheduleConfirm = async () => {
      if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;

      try {
           // Calculate End Time (Assuming same duration or 30 min default if we don't have duration)
           // We'll keep it simple and just set end time to +30 mins or reuse existing duration
           // Ideally we should calculate duration from old start/end
           let newEndTime = "";
           
           const [oldStartH, oldStartM] = selectedAppointment.startTime.split(':').map(Number);
           const [oldEndH, oldEndM] = selectedAppointment.endTime.split(':').map(Number);
           const durationMinutes = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);
           
           const [newStartH, newStartM] = rescheduleTime.split(':').map(Number);
           const totalStartMinutes = newStartH * 60 + newStartM;
           const totalEndMinutes = totalStartMinutes + durationMinutes;
           
           const newEndH = Math.floor(totalEndMinutes / 60);
           const newEndM = totalEndMinutes % 60;
           newEndTime = `${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`;

           const response = await fetch("/api/patient/appointments", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: selectedAppointment.id,
              appointmentDate: rescheduleDate, // YYYY-MM-DD
              startTime: rescheduleTime,
              endTime: newEndTime
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
    const dateTime = parseISO(`${appointmentDate.split("T")[0]}T${endTime}`);
    return isPast(dateTime);
  };

  const canCancelAppointment = (appointment: Appointment) => {
      if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") return false;

      // 24 Hour Check
      const apptDate = new Date(appointment.appointmentDate);
      const [hours, mins] = appointment.startTime.split(':').map(Number);
      apptDate.setHours(hours, mins, 0, 0);
      
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
                      {format(
                        new Date(appointment.appointmentDate),
                        "EEEE, MMMM dd, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {appointment.startTime} - {appointment.endTime}
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

                      // Parse Appointment Date & Time
                      const apptBase = new Date(appointment.appointmentDate);
                      const [startH, startM] = appointment.startTime.split(':').map(Number);
                      const [endH, endM] = appointment.endTime.split(':').map(Number);
                      
                      const startDateTime = new Date(apptBase);
                      startDateTime.setHours(startH, startM, 0, 0);

                      const endDateTime = new Date(apptBase);
                      endDateTime.setHours(endH, endM, 0, 0);

                      const now = new Date();
                      
                      // 10 minute buffer before start
                      const joinWindowStart = new Date(startDateTime.getTime() - 10 * 60000); 

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
                        onClick={() =>
                          window.open(appointment.meetingLink, "_blank")
                        }
                        disabled={!canJoin}
                        title={!canJoin ? `Link becomes active at ${joinWindowStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Join Meeting"}
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
                            {format(
                              new Date(appointment.appointmentDate),
                              "MMM dd, yyyy"
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appointment.startTime}
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
                        min={new Date().toISOString().split('T')[0]}
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                   />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                   <label className="text-right text-sm font-medium">Time</label>
                   <Input 
                        type="time" 
                        className="col-span-3" 
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                   />
               </div>
               {/* 
                  Note: In a full production app, we would fetch available slots here. 
                  For now, we rely on the backend to reject unavailable slots.
               */}
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
