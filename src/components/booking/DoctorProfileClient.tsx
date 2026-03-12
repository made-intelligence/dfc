"use client";

import {
  Star,
  MapPin,
  Clock,
  Calendar,
  Award,
  Briefcase,
  Mail,
  Phone,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface DoctorDetails {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  specialty: string;
  specialtyDescription: string | null;
  license: string;
  experience: number;
  bio: string | null;
  consultationFee: number | string;
  currency: string;
  country: string;
  isAvailable: boolean;
  rating: number;
  totalRatings: number;
  totalAppointments: number;
  schedules: Record<string, Array<{ startTime: string; endTime: string }>>;
  reviews: Array<{
    rating: number;
    review: string | null;
    patientName: string;
    createdAt: string;
  }>;
}

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

// ... imports

export default function DoctorProfileClient({
  doctor,
}: {
  doctor: DoctorDetails | null;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if doctor has any availability schedule
  const hasAvailabilitySchedule = Object.keys(doctor?.schedules || {}).length > 0;

  const handleBookClick = () => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!doctor) return;
    router.push(`/book/${doctor.slug}/book`);
  };
  
  if (!doctor) {
    return (
      <>
        <Topbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Doctor Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The doctor you are looking for does not exist.
            </p>
            <Link href="/book">
              <Button size="lg" className="rounded-full">
                Back to Doctors
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Doctor Header Card */}
          <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#0A2463] to-blue-700 h-32"></div>
            <CardContent className="relative px-8 pb-8">
              <div className="flex flex-col md:flex-row gap-6 -mt-12">
                {/* Profile Image */}
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-white shrink-0">
                  {doctor.profileImage ? (
                    <Image
                      src={doctor.profileImage}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <span className="text-4xl font-bold text-blue-600">
                        {doctor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 pt-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                            <MapPin className="w-3 h-3 mr-1" /> {doctor.country}
                         </Badge>
                         {doctor.isAvailable && (
                            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                Available Now
                            </Badge>
                         )}
                      </div>
                      <h1 className="text-3xl font-bold text-gray-900 my-2">
                        {doctor.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-4 py-1 text-sm">
                          {doctor.specialty}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">
                            {doctor.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            ({doctor.totalRatings} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{doctor.experience} years experience</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>License: {doctor.license}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{doctor.totalAppointments}+ appointments</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">
                        Consultation Fee
                      </p>
                      <p className="text-3xl font-bold text-[#0A2463]">
                        {doctor.currency}{" "}
                        {doctor.consultationFee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Right Column - Booking Card (Mobile First) */}
            <div className="lg:hidden">
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-[#0A2463] to-blue-700 text-white rounded-t-2xl">
                  <CardTitle className="text-xl">Book Appointment</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="h-5 w-5 text-[#0A2463]" />
                      <span className="text-sm">{doctor.email}</span>
                    </div>
                    {doctor.phone && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone className="h-5 w-5 text-[#0A2463]" />
                        <span className="text-sm">{doctor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-[#0A2463]" />
                      <span className="text-sm">
                        Available in: Abuja | UK | Lagos
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600">Consultation Fee</span>
                      <span className="text-2xl font-bold text-[#0A2463]">
                        {doctor.currency}{" "}
                        {doctor.consultationFee.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      className="w-full bg-[#0A2463] hover:bg-[#0A2463]/90 text-white rounded-full py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                      onClick={handleBookClick}
                      disabled={!hasAvailabilitySchedule}
                    >
                      Book Appointment
                    </Button>
                    {hasAvailabilitySchedule ? (
                      <p className="text-xs text-gray-500 text-center mt-3">
                        You'll be able to choose your preferred date and time
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 text-center mt-3">
                        This doctor has not set up their availability schedule yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Left Column - About & Reviews */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#0A2463]">
                    About {doctor.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {doctor.bio || "No bio available."}
                  </p>
                  {doctor.specialtyDescription && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-[#0A2463] mb-2">
                        About {doctor.specialty}
                      </h4>
                      <p className="text-sm text-gray-700">
                        {doctor.specialtyDescription}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schedule Section */}
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#0A2463]">
                    Availability Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(doctor.schedules).length > 0 ? (
                    <div className="space-y-3">
                      {daysOfWeek.map((day) => {
                        const daySchedules = doctor.schedules[day];
                        return (
                          <div
                            key={day}
                            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                          >
                            <span className="font-semibold text-gray-900 w-32">
                              {day}
                            </span>
                            {daySchedules && daySchedules.length > 0 ? (
                              <div className="flex-1 flex flex-wrap gap-2">
                                {daySchedules.map((schedule, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                  >
                                    {schedule.startTime} - {schedule.endTime}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">
                                Not available
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No schedule available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#0A2463]">
                    Patient Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {doctor.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {doctor.reviews.map((review, idx) => (
                        <div
                          key={idx}
                          className="pb-4 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {review.patientName}
                            </span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.review && (
                            <p className="text-gray-700 text-sm">
                              {review.review}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No reviews yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Booking Card */}
            <div>
              <Card className="border-0 shadow-lg rounded-2xl sticky top-24">
                <CardHeader className="bg-gradient-to-r from-[#0A2463] to-blue-700 text-white rounded-t-2xl">
                  <CardTitle className="text-xl">Book Appointment</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="h-5 w-5 text-[#0A2463]" />
                      <span className="text-sm">{doctor.email}</span>
                    </div>
                    {doctor.phone && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone className="h-5 w-5 text-[#0A2463]" />
                        <span className="text-sm">{doctor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-[#0A2463]" />
                      <span className="text-sm">
                        Available in: Abuja | UK | Lagos
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600">Consultation Fee</span>
                      <span className="text-2xl font-bold text-[#0A2463]">
                        {doctor.currency}{" "}
                        {doctor.consultationFee.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      className="w-full bg-[#0A2463] hover:bg-[#0A2463]/90 text-white rounded-full py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                      onClick={handleBookClick}
                      disabled={!hasAvailabilitySchedule}
                    >
                      Book Appointment
                    </Button>
                    {hasAvailabilitySchedule ? (
                      <p className="text-xs text-gray-500 text-center mt-3">
                        You'll be able to choose your preferred date and time
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 text-center mt-3">
                        This doctor has not set up their availability schedule yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
