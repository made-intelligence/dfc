"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading";
import { FilterChips, ListPager } from "@/components/admin/ListControls";
import BookAppointmentModal from "@/components/admin/BookAppointmentModal";
import { formatApptDate, formatWatRange } from "@/lib/wat";

interface AppointmentData {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string | null;
  consultationFee: number;
}

interface AppointmentsResponse {
  appointments: AppointmentData[];
  stats: {
    todayTotal: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  pagination: { page: number; limit: number; total: number; pages: number };
}

type StatusFilter = "" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No-show" },
];

const PAGE_SIZE = 25;

function getStatusIcon(status: string) {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending":
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-[#0A6E75]" />;
    case "cancelled":
    case "no_show":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<string>();

  // /admin/appointments?book=<doctor user id> opens the booking form for that doctor.
  useEffect(() => {
    const doctorId = new URLSearchParams(window.location.search).get("book");
    if (doctorId) {
      setBookingDoctorId(doctorId);
      setBookingOpen(true);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", String(page));
      params.append("limit", String(PAGE_SIZE));

      const response = await fetch(`/api/admin/appointments?${params}`);
      const data: AppointmentsResponse = await response.json();

      setAppointments(data.appointments);
      setStats(data.stats);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total ?? data.appointments.length);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consultations booked across the platform. Patients book and pay from a doctor&apos;s
            profile; the secretariat can also book on a patient&apos;s behalf.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setBookingDoctorId(undefined);
            setBookingOpen(true);
          }}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Book appointment
        </Button>
      </div>

      <BookAppointmentModal
        isOpen={bookingOpen}
        initialDoctorId={bookingDoctorId}
        onClose={() => setBookingOpen(false)}
        onSuccess={() => {
          setBookingOpen(false);
          fetchAppointments();
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Appointments", value: stats.todayTotal, icon: Calendar, color: "text-[#0D1F3C]" },
          { label: "Confirmed Today", value: stats.confirmed, icon: CheckCircle, color: "text-green-600" },
          { label: "Pending Today", value: stats.pending, icon: AlertCircle, color: "text-amber-600" },
          { label: "Cancelled Today", value: stats.cancelled, icon: XCircle, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <CardTitle>All Appointments</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patient or doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:w-64"
                />
              </div>
            </div>
            <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} />
          ) : appointments.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              No appointments match these filters.
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A6E75]/10">
                    <Calendar className="h-5 w-5 text-[#0A6E75]" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{appointment.patient}</h3>
                      <span className="text-gray-400">with</span>
                      <span className="font-medium text-[#0A6E75]">{appointment.doctor}</span>
                      {appointment.reason && (
                        <Badge variant="outline">{appointment.reason}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatApptDate(appointment.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatWatRange(appointment.startTime, appointment.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">{appointment.status.replace("_", " ")}</span>
                      </span>
                      <span>₦{appointment.consultationFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <ListPager
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              totalPages={totalPages}
              noun="appointment"
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
