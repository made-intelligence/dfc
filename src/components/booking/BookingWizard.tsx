"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CreditCard, CheckCircle, Loader2, Video, MapPin, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/loading";

interface BookingWizardProps {
  doctor: any;
}

export function BookingWizard({ doctor }: BookingWizardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"VIDEO" | "IN_PERSON" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest info (used when not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Derive booking identity — logged-in user or guest
  const bookingEmail = user?.email || guestEmail;
  const bookingName = user?.name || guestName;
  const bookingId = user?.id || null; // null for guests

  const schedules = doctor.schedules || {};

  const generateTimeSlots = (startTime: string, endTime: string, slotDuration: number) => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    while (current < end) {
      const hour = Math.floor(current / 60);
      const min = current % 60;
      slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      current += slotDuration;
    }
    return slots;
  };

  // Get available modes for the selected date
  const availableModes = useMemo(() => {
    if (!date) return { modes: new Set<string>(), location: null as string | null };
    const dayOfWeek = date.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const daySchedules: any[] = schedules[dayName] || [];

    const modes = new Set<string>();
    let location: string | null = null;

    daySchedules.forEach((schedule: any) => {
      if (schedule.scheduleType === 'AVAILABLE') {
        const mode = schedule.consultationMode || 'VIDEO';
        if (mode === 'BOTH') {
          modes.add('VIDEO');
          modes.add('IN_PERSON');
        } else {
          modes.add(mode);
        }
        if (schedule.location) location = schedule.location;
      }
    });

    return { modes, location };
  }, [date, schedules]);

  // Auto-select mode when only one is available
  useEffect(() => {
    if (availableModes.modes.size === 1) {
      setSelectedMode(Array.from(availableModes.modes)[0] as "VIDEO" | "IN_PERSON");
    } else if (availableModes.modes.size === 0) {
      setSelectedMode(null);
    }
  }, [availableModes]);

  const timeSlots = useMemo(() => {
    if (!date) return [];
    const dayOfWeek = date.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const daySchedules = schedules[dayName] || [];

    const availableSlots = new Set<string>();
    const blockedSlots = new Set<string>();

    daySchedules.forEach((schedule: any) => {
      const generatedSlots = generateTimeSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);
      if (schedule.scheduleType === 'AVAILABLE') {
        generatedSlots.forEach(slot => availableSlots.add(slot));
      } else {
        generatedSlots.forEach(slot => blockedSlots.add(slot));
      }
    });

    let slots = Array.from(availableSlots).filter(slot => !blockedSlots.has(slot));

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      slots = slots.filter(slot => slot > currentTime);
    }

    return slots.sort();
  }, [date, schedules]);

  const isDayAvailable = (day: Date) => {
    const dayOfWeek = day.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const daySchedules = schedules[dayName] || [];
    return daySchedules.some((s: any) => s.scheduleType === 'AVAILABLE');
  };

  const isGuestInfoValid = () => {
    if (user) return true; // Logged-in users don't need guest info
    return guestName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && guestPhone.trim().length >= 10;
  };

  const handlePayment = async () => {
    if (!date || !selectedTime || !selectedMode) return;
    if (!user && !isGuestInfoValid()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: bookingEmail,
          amount: doctor.consultationFee,
          callbackUrl: `${window.location.origin}/book/callback`,
          metadata: {
            doctorId: doctor.id,
            patientId: bookingId, // null for guests
            date: date.toISOString(),
            time: selectedTime,
            consultationMode: selectedMode,
            clinicLocation: selectedMode === 'IN_PERSON' ? availableModes.location : null,
            reason: "Standard Consultation",
            // Guest info — used to create account after payment
            ...(!user && {
              guestName: guestName.trim(),
              guestEmail: guestEmail.trim().toLowerCase(),
              guestPhone: guestPhone.trim(),
              isGuest: true,
            }),
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      window.location.href = data.authorization_url;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process booking");
      setLoading(false);
    }
  };

  // For guests: steps are 1=Time, 2=Details, 3=Review/Pay
  // For logged-in: steps are 1=Time, 2=Review/Pay (skip details)
  const totalSteps = user ? 2 : 3;
  const reviewStep = user ? 2 : 3;
  const detailsStep = 2; // only for guests

  const stepLabels = user
    ? [{ n: 1, label: "Time" }, { n: 2, label: "Review & Pay" }]
    : [{ n: 1, label: "Time" }, { n: 2, label: "Details" }, { n: 3, label: "Review & Pay" }];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Steps Indicator */}
      <div className="flex justify-center mb-8">
        {stepLabels.map((s, i) => (
          <div key={s.n} className="flex items-center">
            {i > 0 && <div className={`w-12 h-0.5 mx-4 ${step >= s.n ? "bg-[#0A6E75]" : "bg-gray-200"}`} />}
            <div className={`flex items-center ${step >= s.n ? "text-[#0A6E75]" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold ${step >= s.n ? "border-[#0A6E75] bg-[#0A6E75]/10" : "border-gray-300"}`}>{s.n}</div>
              <span className="ml-2 font-medium">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* STEP 1: Date & Time */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
            <CardDescription>Choose a convenient slot for your consultation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Consultation Mode Selection */}
            {availableModes.modes.size > 1 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">How would you like to consult?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMode("VIDEO")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedMode === "VIDEO"
                        ? "border-[#0A6E75] bg-[#0A6E75]/5 ring-1 ring-[#0A6E75]/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedMode === "VIDEO" ? "bg-[#0A6E75] text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Video Call</p>
                      <p className="text-xs text-gray-500">Secure teleconsultation</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode("IN_PERSON")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedMode === "IN_PERSON"
                        ? "border-[#0A6E75] bg-[#0A6E75]/5 ring-1 ring-[#0A6E75]/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedMode === "IN_PERSON" ? "bg-[#0A6E75] text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">In-Person</p>
                      <p className="text-xs text-gray-500">Visit the clinic</p>
                    </div>
                  </button>
                </div>
                {selectedMode === "IN_PERSON" && availableModes.location && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {availableModes.location}
                  </div>
                )}
              </div>
            )}

            {/* Single mode indicator */}
            {availableModes.modes.size === 1 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                {selectedMode === "VIDEO" ? (
                  <><Video className="w-4 h-4 text-[#0A6E75]" /> This is a <strong>video consultation</strong></>
                ) : (
                  <><MapPin className="w-4 h-4 text-[#0A6E75]" /> This is an <strong>in-person consultation</strong>
                    {availableModes.location && <span> at {availableModes.location}</span>}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    setSelectedTime(null);
                  }}
                  className="rounded-md border mx-auto"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today || !isDayAvailable(date);
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-3">Available Slots</h3>
                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {timeSlots.map(slot => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? "default" : "outline"}
                        className="w-full"
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No available slots for this date</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={() => setStep(user ? 2 : 2)}
              disabled={!date || !selectedTime || !selectedMode}
            >
              Continue
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2 (guests only): Your Details */}
      {!user && step === detailsStep && (
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>We'll use this to confirm your booking. No account needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none transition text-base"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none transition text-base"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Booking confirmation will be sent here</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none transition text-base"
                />
              </div>
            </div>

            <div className="bg-[#0A6E75]/5 border border-[#0A6E75]/20 rounded-xl p-4 mt-2">
              <p className="text-sm text-[#0A6E75]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push(`/auth/login?redirect=/book/${doctor.slug}/book`)}
                  className="font-semibold underline underline-offset-2 hover:text-[#085459]"
                >
                  Sign in
                </button>{" "}
                to book faster and manage your appointments.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!isGuestInfoValid()}
            >
              Continue
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* REVIEW & PAY step */}
      {step === reviewStep && (
        <Card>
          <CardHeader>
            <CardTitle>Review Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-5 rounded-xl space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Patient</span>
                <span className="font-semibold">{bookingName}</span>
              </div>
              <div className="border-t border-gray-200 my-1" />
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor</span>
                <span className="font-semibold">{doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Specialty</span>
                <span className="font-semibold">{doctor.specialty}</span>
              </div>
              <div className="border-t border-gray-200 my-1" />
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold">{date ? format(date, "PPP") : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-semibold">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Consultation Type</span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  {selectedMode === "VIDEO" ? (
                    <><Video className="w-4 h-4 text-blue-600" /> Video Call</>
                  ) : (
                    <><MapPin className="w-4 h-4 text-green-600" /> In-Person</>
                  )}
                </span>
              </div>
              {selectedMode === "IN_PERSON" && availableModes.location && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold text-right max-w-[60%]">{availableModes.location}</span>
                </div>
              )}
              <div className="border-t border-gray-200 my-1" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-[#0D1F3C]">Total Fee</span>
                <span className="font-bold text-[#0D1F3C]">{doctor.currency} {doctor.consultationFee.toLocaleString()}</span>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(user ? 1 : detailsStep)}>Back</Button>
            <Button onClick={handlePayment} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Pay Now
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
