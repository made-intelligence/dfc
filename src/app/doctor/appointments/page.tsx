"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Phone, Search, Filter, Video } from "lucide-react";
import { isPast } from "date-fns";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
  notes: string;
  consultationFee: number;
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  meetingLink?: string;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/doctor/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/doctor/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        fetchAppointments();
        addToast({
          title: "Success",
          description: `Appointment ${status.toLowerCase()} successfully`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      appointment.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-gray-600">Manage your patient appointments</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">
                        {appointment.patient.name}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(
                          appointment.appointmentDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {appointment.startTime} - {appointment.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{appointment.patient.phone}</span>
                    </div>
                    <div>
                      <span className="font-medium">Fee: </span>₦
                      {appointment.consultationFee.toLocaleString()}
                    </div>
                  </div>

                  {appointment.reason && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Reason: </span>
                      <span className="text-sm text-gray-600">
                        {appointment.reason}
                      </span>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mt-2">
                      <span className="font-medium text-sm">Notes: </span>
                      <span className="text-sm text-gray-600">
                        {appointment.notes}
                      </span>
                    </div>
                  )}

                  {/* Join Button Logic */}
                  {(() => {
                      if (!appointment.meetingLink) return null;

                      // Parse Appointment Date & Time
                      // Assuming appointmentDate is YYYY-MM-DD or ISO
                      const apptBase = new Date(appointment.appointmentDate);
                      const [startH, startM] = appointment.startTime.split(':').map(Number);
                      const [endH, endM] = appointment.endTime.split(':').map(Number);
                      
                      const startDateTime = new Date(apptBase);
                      startDateTime.setHours(startH, startM, 0, 0);

                      const endDateTime = new Date(apptBase);
                      endDateTime.setHours(endH, endM, 0, 0);

                      const now = new Date();
                      
                      // 10 minute buffer before start
                      const joinWindowStart = new Date(startDateTime.getTime() - 10 * 60000); // 10 mins in ms

                      const isTooEarly = now < joinWindowStart;
                      const isEnded = now > endDateTime;
                      const canJoin = !isTooEarly && !isEnded;

                      // Show disabled if not joinable
                      // if (isEnded) return null; // Optionally hide if ended, but user asked to "appear but disabled" generally.
                      // Let's stick to showing it disabled for now as per specific request.

                      return (
                        <div className="mt-3">
                           <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => window.open(appointment.meetingLink, "_blank")}
                                disabled={!canJoin}
                                title={!canJoin ? `Link becomes active at ${joinWindowStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Join Meeting"}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join Video Call
                              </Button>
                              {isTooEarly && (
                                <span className="text-xs text-amber-600 font-medium">
                                  Available 10m before start
                                </span>
                              )}
                           </div>
                        </div>
                      );
                  })()}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {appointment.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateAppointmentStatus(appointment.id, "CONFIRMED")
                        }
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateAppointmentStatus(appointment.id, "CANCELLED")
                        }
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {appointment.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateAppointmentStatus(appointment.id, "COMPLETED")
                      }
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAppointments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Your appointments will appear here once patients book with you"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
