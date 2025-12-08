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
  DollarSign,
  FileText,
  Video,
  XCircle,
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import Topbar from "@/components/layout/Topbar";
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

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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

  const getStatusBadge = (status: string) => {
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
    return (
      appointment.status !== "CANCELLED" &&
      appointment.status !== "COMPLETED" &&
      !isAppointmentPast(appointment.appointmentDate, appointment.endTime)
    );
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
      <div className="flex items-center justify-between mb-6">
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
                    {getStatusBadge(appointment.status)}
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
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {appointment.doctorProfile.currency}{" "}
                      {appointment.consultationFee.toFixed(2)}
                    </span>
                  </div>
                  {appointment.meetingLink && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          window.open(appointment.meetingLink, "_blank")
                        }
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Video Call
                      </Button>
                    </div>
                  )}
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
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
      </div>
    </>
  );
}
