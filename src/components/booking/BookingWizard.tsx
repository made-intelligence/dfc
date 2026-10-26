"use client";

import { useState, useEffect, useMemo } from "react";
import { blocksForDate, generateDaySlots, localYmd, type ScheduleBlock, type Slot } from "@/lib/schedule-slots";
import { formatApptDate, watMidnightIso, watNow, WAT_LABEL, WAT_LONG_LABEL } from "@/lib/wat";

type WizardBlock = ScheduleBlock & { consultationMode?: string; location?: string | null };
import { Calendar as CalendarIcon, Clock, CreditCard, CheckCircle, Loader2, Video, MapPin, User, Mail, Phone, Lock, MailCheck } from "lucide-react";
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
import { Loading } from "@/components/ui/loading";

interface BookingWizardProps {
  doctor: any;
}

export function BookingWizard({ doctor }: BookingWizardProps) {
  const { user, login } = useAuth();
  const [step, setStep] = useState(1);
  // The calendar works in calendar days; the day picked is a WAT date (see lib/wat).
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"VIDEO" | "IN_PERSON" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking needs an account. Someone not signed in gives their details and
  // is then asked for a password: their own, or one we email to a new
  // account (or as a "forgot password" replacement).
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [accountState, setAccountState] = useState<"details" | "checking" | "password">("details");
  // Why we're asking for a password, for the hint shown with the field.
  const [passwordHint, setPasswordHint] = useState<"existing" | "new" | "resent">("existing");
  const [sendingPassword, setSendingPassword] = useState(false);
  const [signInPassword, setSignInPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const bookingName = user?.name || guestName;

  const scheduleBlocks: WizardBlock[] = doctor.scheduleBlocks || [];
  // Blocks that apply on a calendar day: weekly ones plus dated one-offs.
  const blocksOn = (day: Date): WizardBlock[] => blocksForDate(scheduleBlocks, localYmd(day));

  // Times already booked on the selected day, hidden from the slot list.
  const [bookedSlots, setBookedSlots] = useState<Slot[]>([]);
  useEffect(() => {
    if (!date) return;
    let active = true;
    setBookedSlots([]);
    fetch(`/api/public/doctors/booked-slots?doctorId=${doctor.id}&date=${encodeURIComponent(watMidnightIso(localYmd(date)))}`)
      .then((res) => (res.ok ? res.json() : { booked: [] }))
      .then((data) => {
        if (active) setBookedSlots(data.booked || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [date, doctor.id]);

  // Get available modes for the selected date
  const availableModes = useMemo(() => {
    if (!date) return { modes: new Set<string>(), location: null as string | null };
    // Only blocks that still yield a slot (not wiped out by a day off) count.
    const daySchedules = blocksOn(date).filter(
      (b) => b.scheduleType === 'AVAILABLE' && generateDaySlots([b, ...blocksOn(date).filter((o) => o.scheduleType !== 'AVAILABLE')]).length > 0
    );

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
  }, [date, scheduleBlocks]);

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
    let slots = generateDaySlots(blocksOn(date), bookedSlots).map((slot) => slot.startTime);

    // Slots are WAT times, so "already passed" is judged on the WAT clock.
    const nowWat = watNow();
    if (localYmd(date) === nowWat.ymd) {
      slots = slots.filter((slot) => slot > nowWat.hhmm);
    }

    return slots;
  }, [date, scheduleBlocks, bookedSlots]);

  const isDayAvailable = (day: Date) => {
    // Days off and holidays leave no slots, so the day is not offered.
    return generateDaySlots(blocksOn(day)).length > 0;
  };

  const isGuestInfoValid = () => {
    return guestName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && guestPhone.trim().length >= 10;
  };

  // Details entered: an existing account is asked for its password; a new
  // email gets an account and an emailed password.
  const startAccount = async () => {
    setAccountState("checking");
    setError(null);
    try {
      const res = await fetch("/api/auth/booking-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: guestName.trim(),
          email: guestEmail.trim().toLowerCase(),
          phone: guestPhone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setPasswordHint(data.accountExists ? "existing" : "new");
      setSignInPassword("");
      setAccountState("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAccountState("details");
    }
  };

  const signIn = async () => {
    setSigningIn(true);
    setError(null);
    const result = await login(guestEmail.trim().toLowerCase(), signInPassword);
    // On success the signed-in user moves the wizard on to Review & Pay.
    if (!result.success) setError(result.error || "Sign in failed");
    setSigningIn(false);
  };

  const sendNewPassword = async () => {
    setSendingPassword(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send a new password");
      setPasswordHint("resent");
      setSignInPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a new password");
    } finally {
      setSendingPassword(false);
    }
  };

  const handlePayment = async () => {
    if (!date || !selectedTime || !selectedMode || !user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: doctor.consultationFee,
          callbackUrl: `${window.location.origin}/book/callback`,
          metadata: {
            doctorId: doctor.id,
            patientId: user.id,
            date: watMidnightIso(localYmd(date)),
            time: selectedTime,
            consultationMode: selectedMode,
            clinicLocation: selectedMode === 'IN_PERSON' ? availableModes.location : null,
            reason: "Standard Consultation",
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

  // Not signed in: 1=Time, 2=Account, 3=Review/Pay. Signed in: 1=Time,
  // 2=Review/Pay, so signing in on step 2 lands straight on Review.
  const totalSteps = user ? 2 : 3;
  const reviewStep = user ? 2 : 3;
  const detailsStep = 2; // only for guests

  const stepLabels = user
    ? [{ n: 1, label: "Time" }, { n: 2, label: "Review & Pay" }]
    : [{ n: 1, label: "Time" }, { n: 2, label: "Account" }, { n: 3, label: "Review & Pay" }];

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
                  disabled={(day) => localYmd(day) < watNow().ymd || !isDayAvailable(day)}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Available Slots</h3>
                <p className="mb-3 text-xs text-gray-500">
                  All times are {WAT_LONG_LABEL}.
                </p>
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

      {/* STEP 2 (not signed in): Account — details, then just a password */}
      {!user && step === detailsStep && (
        <Card>
          <CardHeader>
            <CardTitle>
              {accountState !== "password"
                ? "Your Details"
                : passwordHint === "existing"
                  ? "Welcome back"
                  : "Check your email"}
            </CardTitle>
            <CardDescription>
              {accountState !== "password"
                ? "Enter your details to continue with your booking."
                : passwordHint === "existing"
                  ? "You already have an account. Enter your password to continue."
                  : "Enter the password we just emailed you to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountState !== "password" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      autoComplete="name"
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
                      autoComplete="email"
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none transition text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="+234 800 000 0000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none transition text-base"
                    />
                  </div>
                </div>
              </>
            )}

            {accountState === "password" && (
              <>
                {passwordHint !== "existing" && (
                  <p className="flex items-start gap-2 rounded-xl border border-[#0A6E75]/20 bg-[#0A6E75]/5 p-3 text-sm text-[#0D1F3C]">
                    <MailCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#0A6E75]" />
                    <span>
                      {passwordHint === "new" ? "We created your account and sent" : "We sent a new"} password
                      to <strong>{guestEmail.trim().toLowerCase()}</strong>. Check your spam folder if you
                      can&apos;t see it.
                    </span>
                  </p>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && signInPassword && !signingIn) signIn();
                      }}
                      autoComplete={passwordHint === "existing" ? "current-password" : "one-time-code"}
                      autoFocus
                      placeholder={passwordHint === "existing" ? "Your password" : "Password from the email"}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none transition text-base"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={sendNewPassword}
                  disabled={sendingPassword}
                  className="text-sm font-medium text-[#0A6E75] underline-offset-2 hover:underline disabled:text-gray-400"
                >
                  {sendingPassword
                    ? "Sending…"
                    : passwordHint === "existing"
                      ? "Forgot password? Email me a new one"
                      : "Didn't get it? Send another"}
                </button>
              </>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                if (accountState === "password") {
                  setAccountState("details");
                  setSignInPassword("");
                } else {
                  setStep(1);
                }
              }}
            >
              {accountState === "password" ? "Change details" : "Back"}
            </Button>
            {accountState === "password" ? (
              <Button onClick={signIn} disabled={!signInPassword || signingIn}>
                {signingIn && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Continue
              </Button>
            ) : (
              <Button onClick={startAccount} disabled={!isGuestInfoValid() || accountState === "checking"}>
                {accountState === "checking" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Continue
              </Button>
            )}
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
                <span className="font-semibold">{date ? formatApptDate(watMidnightIso(localYmd(date)), "long") : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-semibold">{selectedTime ? `${selectedTime} ${WAT_LABEL}` : ""}</span>
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
