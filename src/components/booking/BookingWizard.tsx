"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CreditCard, CheckCircle, Loader2 } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePayment = async () => {
    if (!user || !date || !selectedTime) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Initialize Payment on Server
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: doctor.consultationFee,
          callbackUrl: `${window.location.origin}/book/callback`, 
          metadata: {
            doctorId: doctor.id,
            patientId: user.id || user.email, // Use email if id missing or handle auth better
            date: date.toISOString(),
            time: selectedTime,
            reason: "Standard Consultation" 
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      // 2. Redirect to Paystack
      window.location.href = data.authorization_url;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process booking");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
            <p className="mb-4">Please log in to book a consultation.</p>
            <Button onClick={() => router.push(`/auth/login?redirect=/book/${doctor.slug}/book`)}>
                Sign In
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
        {/* Steps Indicator */}
        <div className="flex justify-center mb-8">
            <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>1</div>
                <span className="ml-2 font-medium">Time</span>
            </div>
            <div className={`w-12 h-1 bg-gray-200 mx-4 ${step >= 2 ? "bg-blue-600" : ""}`} />
            <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>2</div>
                <span className="ml-2 font-medium">Review</span>
            </div>
             <div className={`w-12 h-1 bg-gray-200 mx-4 ${step >= 3 ? "bg-blue-600" : ""}`} />
            <div className={`flex items-center ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>3</div>
                <span className="ml-2 font-medium">Pay</span>
            </div>
        </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
            <CardDescription>Choose a convenient slot for your consultation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                onClick={() => setStep(2)} 
                disabled={!date || !selectedTime}
            >
                Continue
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-600">Doctor</span>
                    <span className="font-semibold">{doctor.name}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">Specialty</span>
                    <span className="font-semibold">{doctor.specialty}</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-semibold">{date ? format(date, "PPP") : ""}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">Time</span>
                    <span className="font-semibold">{selectedTime}</span>
                </div>
                 <div className="border-t my-2" />
                 <div className="flex justify-between text-lg">
                    <span className="font-bold text-[#0A2463]">Total Fee</span>
                    <span className="font-bold text-[#0A2463]">{doctor.currency} {doctor.consultationFee.toLocaleString()}</span>
                </div>
            </div>
             {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                    {error}
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
             <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
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
