"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "@/lib/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarCog, CalendarPlus } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import Image from "next/image";
import { formatApptDate, formatWatRange } from "@/lib/wat";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchDoctorDetails(params.id as string);
    }
  }, [params.id]);

  const fetchDoctorDetails = async (doctorId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/doctors/${doctorId}`);
      const data = await response.json();
      setDoctor(data);
    } catch (error) {
      console.error("Failed to fetch doctor details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading type="pulse" size="lg" />;
  }

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  type Block = { id: string; dayOfWeek: number; startTime: string; endTime: string; isRecurring: boolean; scheduleType: string };
  const weeklyBlocks = ((doctor.schedules ?? []) as Block[])
    .filter((s) => s.isRecurring && s.scheduleType === "AVAILABLE")
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Doctor Details</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
                {doctor.profileImage && (
                  <div className="flex justify-center sm:justify-start">
                    <Image
                      src={doctor.profileImage}
                      alt={doctor.name}
                      width={120}
                      height={120}
                      className="rounded-full object-cover border-2 border-gray-200 w-20 h-20 sm:w-30 sm:h-30"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center sm:text-left">{doctor.name}</h2>
                  <div className="flex justify-center sm:justify-start mb-2">
                    <Badge variant="secondary">{doctor.specialty}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                    <div className="break-all">
                      <span className="font-medium">Email:</span> {doctor.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {doctor.phone || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">License:</span> {doctor.license}
                    </div>
                    <div>
                      <span className="font-medium">Experience:</span> {doctor.experience} years
                    </div>
                  </div>
                </div>
              </div>
              {doctor.bio && (
                <div>
                  <h3 className="font-medium mb-2">Bio</h3>
                  <p className="text-gray-600">{doctor.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule &amp; Bookings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyBlocks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {weeklyBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex flex-col sm:flex-row sm:justify-between gap-1 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-sm sm:text-base">{DAYS[block.dayOfWeek]}</span>
                      <span className="text-sm sm:text-base">{formatWatRange(block.startTime, block.endTime)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No weekly availability set, so patients cannot book this doctor yet.</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => router.push(`/admin/doctors/${params.id}/schedule`)}>
                  <CalendarCog className="h-4 w-4 mr-2" />
                  Manage schedule
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/appointments?book=${params.id}`)}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Book a patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base">Consultation Fee:</span>
                <span className="font-medium text-sm sm:text-base">₦{doctor.consultationFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base">Rating:</span>
                <span className="font-medium text-sm sm:text-base">
                  {doctor.avgRating?.toFixed(1)} ({doctor.totalRatings} reviews)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base">Total Patients:</span>
                <span className="font-medium">{doctor.totalPatients || 0}</span>
              </div>
            </CardContent>
          </Card>

          {doctor.recentAppointments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {doctor.recentAppointments.slice(0, 5).map((apt: any) => (
                    <div
                      key={apt.id}
                      className="flex flex-col sm:flex-row sm:justify-between gap-1 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-sm sm:text-base">{apt.patient}</span>
                      <span className="text-xs sm:text-sm text-gray-600 sm:text-right">
                        {formatApptDate(apt.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}