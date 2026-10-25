"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Loader2, X } from "lucide-react";
import { WAT_LABEL, WAT_LONG_LABEL, watMidnightIso, watNow } from "@/lib/wat";

interface DoctorOption {
  id: string; // user id
  name: string;
  specialty?: string;
  consultationFee?: number | string;
}

interface PatientOption {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface Slot {
  startTime: string;
  endTime: string;
}

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Doctor (user id) to start with, e.g. when opened from a doctor's page. */
  initialDoctorId?: string;
}

const selectClass = "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base";

/** Results for `query` from `url`, fetched once typing pauses. */
function useSearch<T>(url: (q: string) => string, query: string, pick: (data: Record<string, T[]>) => T[]) {
  const [results, setResults] = useState<T[]>([]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(url(query.trim()))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setResults(data ? pick(data) : []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  return results;
}

export default function BookAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialDoctorId,
}: BookAppointmentModalProps) {
  const { addToast } = useToast();
  const today = watNow().ymd;

  const [doctor, setDoctor] = useState<DoctorOption | null>(null);
  const [doctorQuery, setDoctorQuery] = useState("");
  const doctorResults = useSearch<DoctorOption>(
    (q) => `/api/admin/doctors?status=active&limit=8&search=${encodeURIComponent(q)}`,
    doctorQuery,
    (data) => data.doctors ?? [],
  );

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [offSchedule, setOffSchedule] = useState(false);
  const [customStart, setCustomStart] = useState("09:00");
  const [customEnd, setCustomEnd] = useState("09:30");

  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const patientResults = useSearch<PatientOption>(
    (q) => `/api/admin/appointments/patients?search=${encodeURIComponent(q)}`,
    patientQuery,
    (data) => data.patients ?? [],
  );
  const [newPatient, setNewPatient] = useState({ name: "", email: "", phone: "" });

  const [reason, setReason] = useState("");
  const [consultationMode, setConsultationMode] = useState<"VIDEO" | "IN_PERSON">("VIDEO");
  const [clinicLocation, setClinicLocation] = useState("");
  const [feeWaived, setFeeWaived] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Start from the doctor the modal was opened for.
  useEffect(() => {
    if (!isOpen || !initialDoctorId) return;
    fetch(`/api/admin/doctors/${initialDoctorId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.userId) {
          setDoctor({
            id: data.userId,
            name: data.name,
            specialty: data.specialty,
            consultationFee: data.consultationFee,
          });
        }
      })
      .catch(() => {});
  }, [isOpen, initialDoctorId]);

  // The doctor's open slots on the chosen day.
  useEffect(() => {
    setStartTime("");
    if (!doctor || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(`/api/public/doctors/booked-slots?doctorId=${doctor.id}&date=${encodeURIComponent(watMidnightIso(date))}`)
      .then((res) => (res.ok ? res.json() : { open: [] }))
      .then((data) => {
        if (cancelled) return;
        const now = watNow();
        const open: Slot[] = data.open ?? [];
        setSlots(date === now.ymd ? open.filter((s) => s.startTime > now.hhmm) : open);
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctor, date]);

  const reset = () => {
    setDoctor(null);
    setDoctorQuery("");
    setDate("");
    setStartTime("");
    setOffSchedule(false);
    setPatientMode("existing");
    setPatient(null);
    setPatientQuery("");
    setNewPatient({ name: "", email: "", phone: "" });
    setReason("");
    setConsultationMode("VIDEO");
    setClinicLocation("");
    setFeeWaived(false);
    setNotes("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const timeChosen = offSchedule ? customStart && customEnd && customEnd > customStart : !!startTime;
  const patientChosen =
    patientMode === "existing" ? !!patient : !!newPatient.name.trim() && !!newPatient.email.trim();
  const canSubmit = !!doctor && !!date && timeChosen && patientChosen && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !doctor) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          date,
          startTime: offSchedule ? customStart : startTime,
          endTime: offSchedule ? customEnd : undefined,
          offSchedule,
          ...(patientMode === "existing" ? { patientId: patient?.id } : { newPatient }),
          reason,
          consultationMode,
          clinicLocation: consultationMode === "IN_PERSON" ? clinicLocation : undefined,
          feeWaived,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast({ type: "error", title: "Couldn't book the appointment", description: data.error });
        return;
      }
      addToast({
        type: "success",
        title: "Appointment booked",
        description: "The patient and the doctor have been notified by email.",
      });
      reset();
      onSuccess();
    } catch {
      addToast({ type: "error", title: "Couldn't book the appointment", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const fee = doctor?.consultationFee != null ? Number(doctor.consultationFee) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an appointment</DialogTitle>
          <DialogDescription>
            Schedule a patient with a doctor. Times are {WAT_LONG_LABEL}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Doctor */}
          <section className="space-y-2">
            <Label>Doctor</Label>
            {doctor ? (
              <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-medium">Dr. {doctor.name}</p>
                  <p className="text-sm text-gray-500">
                    {doctor.specialty}
                    {fee != null && ` · ₦${fee.toLocaleString()}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDoctor(null)} aria-label="Change doctor">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search by name or specialty..."
                  value={doctorQuery}
                  onChange={(e) => setDoctorQuery(e.target.value)}
                />
                {doctorResults.length > 0 && (
                  <ul className="divide-y rounded-lg border">
                    {doctorResults.map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-50"
                          onClick={() => {
                            setDoctor(d);
                            setDoctorQuery("");
                          }}
                        >
                          <span className="font-medium">Dr. {d.name}</span>
                          <span className="ml-2 text-sm text-gray-500">{d.specialty}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {/* Date and time */}
          <section className="space-y-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Date</Label>
                <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm sm:self-end sm:pb-3">
                <input
                  type="checkbox"
                  checked={offSchedule}
                  onChange={(e) => setOffSchedule(e.target.checked)}
                />
                Book outside the published schedule
              </label>
            </div>

            {offSchedule ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start ({WAT_LABEL})</Label>
                    <Input type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                  </div>
                  <div>
                    <Label>End ({WAT_LABEL})</Label>
                    <Input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                  </div>
                </div>
                <p className="text-sm text-amber-700">
                  Only do this once the doctor has agreed to the time. It is still checked against their other bookings.
                </p>
              </div>
            ) : !doctor || !date ? (
              <p className="text-sm text-gray-500">Choose a doctor and a date to see open slots.</p>
            ) : slotsLoading ? (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading open slots...
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-500">
                No open slots that day. Pick another date, adjust the doctor&apos;s schedule, or book outside the
                published schedule.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.startTime}
                    type="button"
                    onClick={() => setStartTime(s.startTime)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      startTime === s.startTime
                        ? "border-[#0A6E75] bg-[#0A6E75] text-white"
                        : "border-gray-200 hover:border-[#0A6E75]"
                    }`}
                  >
                    {s.startTime} – {s.endTime}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Patient */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Patient</Label>
              <div className="flex gap-1 text-sm">
                {(["existing", "new"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPatientMode(mode)}
                    className={`rounded-md px-3 py-1 ${
                      patientMode === mode ? "bg-[#0D1F3C] text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {mode === "existing" ? "Existing patient" : "New patient"}
                  </button>
                ))}
              </div>
            </div>

            {patientMode === "existing" ? (
              patient ? (
                <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-gray-500">
                      {patient.email}
                      {patient.phone && ` · ${patient.phone}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPatient(null)} aria-label="Change patient">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search by name, email or phone..."
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                  />
                  {patientResults.length > 0 ? (
                    <ul className="divide-y rounded-lg border">
                      {patientResults.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-gray-50"
                            onClick={() => {
                              setPatient(p);
                              setPatientQuery("");
                            }}
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="ml-2 text-sm text-gray-500">{p.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    patientQuery.trim().length >= 2 && (
                      <p className="text-sm text-gray-500">
                        No match. Use &ldquo;New patient&rdquo; to create their account.
                      </p>
                    )
                  )}
                </>
              )
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Full name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  />
                  <Input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  They&apos;ll get an email with a password to sign in and see the appointment. If the email already
                  has an account, the booking goes on that account.
                </p>
              </div>
            )}
          </section>

          {/* Details */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Reason for visit</Label>
                <Input placeholder="Consultation" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div>
                <Label>Consultation mode</Label>
                <select
                  className={selectClass}
                  value={consultationMode}
                  onChange={(e) => setConsultationMode(e.target.value as "VIDEO" | "IN_PERSON")}
                >
                  <option value="VIDEO">Video</option>
                  <option value="IN_PERSON">In-person</option>
                </select>
              </div>
            </div>
            {consultationMode === "IN_PERSON" && (
              <div>
                <Label>Clinic location</Label>
                <Input
                  placeholder="Defaults to the clinic on the doctor's schedule"
                  value={clinicLocation}
                  onChange={(e) => setClinicLocation(e.target.value)}
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={feeWaived} onChange={(e) => setFeeWaived(e.target.checked)} />
              Complimentary (no consultation fee)
            </label>
            {!feeWaived && fee != null && fee > 0 && (
              <p className="text-sm text-gray-500">
                ₦{fee.toLocaleString()} is recorded as the fee. No online payment is taken for secretariat bookings.
              </p>
            )}
            <div>
              <Label>Notes for the doctor (optional)</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
