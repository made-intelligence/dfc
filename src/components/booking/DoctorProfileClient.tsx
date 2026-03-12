"use client";

import {
  Star,
  MapPin,
  Clock,
  Calendar,
  Award,
  Briefcase,

  Phone,
  Shield,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Video,
  Users,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
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
  hasVideo?: boolean;
  hasInPerson?: boolean;
  clinicLocation?: string | null;
  rating: number;
  totalRatings: number;
  totalAppointments: number;
  schedules: Record<string, Array<{ startTime: string; endTime: string; consultationMode?: string; location?: string | null }>>;
  reviews: Array<{
    rating: number;
    review: string | null;
    patientName: string;
    createdAt: string;
  }>;
}

import { useRouter } from "next/navigation";

const FALLBACK_IMAGE = "/hero.jpg";

export default function DoctorProfileClient({
  doctor,
}: {
  doctor: DoctorDetails | null;
}) {
  const router = useRouter();

  const hasAvailabilitySchedule =
    Object.keys(doctor?.schedules || {}).length > 0;

  const handleBookClick = () => {
    if (!doctor) return;
    router.push(`/book/${doctor.slug}/book`);
  };

  if (!doctor) {
    return (
      <>
        <Topbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Doctor Not Found
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
              The specialist profile you&apos;re looking for doesn&apos;t exist
              or may have been removed.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-[#0D1F3C] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#162d52] transition-colors"
            >
              Browse Specialists
              <ArrowRight className="w-4 h-4" />
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

  const availableDays = daysOfWeek.filter(
    (day) => doctor.schedules[day] && doctor.schedules[day].length > 0
  );

  const feeFormatted =
    Number(doctor.consultationFee) > 0
      ? `${doctor.currency === "NGN" ? "\u20A6" : doctor.currency + " "}${Number(doctor.consultationFee).toLocaleString()}`
      : "Fee on request";

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-[#F8F9FB]">
        {/* ─── Hero Section ──────────────────────────────────────── */}
        <div className="relative pt-20">
          {/* Background gradient + pattern */}
          <div className="absolute inset-0 h-[420px] bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
              <Link href="/book" className="hover:text-white transition-colors">
                Find a Specialist
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white/90">{doctor.name}</span>
            </nav>

            {/* Doctor card overlay */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Image section */}
                <div className="relative lg:w-[340px] h-[280px] lg:h-auto shrink-0">
                  <Image
                    src={doctor.profileImage || FALLBACK_IMAGE}
                    alt={doctor.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Gradient overlay on mobile */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />

                  {/* Availability badge */}
                  {doctor.isAvailable && (
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-green-700 text-sm font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Available
                    </div>
                  )}
                </div>

                {/* Info section */}
                <div className="flex-1 p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* Name + specialty */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1 bg-[#0A6E75]/10 text-[#0A6E75] text-xs font-semibold px-2.5 py-1 rounded-full">
                          {doctor.specialty}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {doctor.country}
                        </span>
                      </div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-[#0D1F3C] mt-2">
                        {doctor.name}
                      </h1>

                      {/* Rating */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(doctor.rating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                          <span className="ml-1.5 text-sm font-semibold text-gray-900">
                            {doctor.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-400">
                            ({doctor.totalRatings} review
                            {doctor.totalRatings !== 1 ? "s" : ""})
                          </span>
                        </div>
                      </div>

                      {/* Consultation mode badges */}
                      <div className="flex items-center gap-2 mt-3">
                        {(doctor.hasVideo || (!doctor.hasVideo && !doctor.hasInPerson)) && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                            <Video className="w-3 h-3" />
                            Video
                          </span>
                        )}
                        {doctor.hasInPerson && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <MapPin className="w-3 h-3" />
                            In-Person
                          </span>
                        )}
                        {doctor.clinicLocation && (
                          <span className="text-xs text-gray-500">
                            {doctor.clinicLocation}
                          </span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>
                            <strong className="text-gray-900">
                              {doctor.experience}
                            </strong>{" "}
                            years experience
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            <strong className="text-gray-900">
                              {doctor.totalAppointments}+
                            </strong>{" "}
                            consultations
                          </span>
                        </div>
                        {doctor.license && (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <span>License: {doctor.license}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fee + CTA (desktop) */}
                    <div className="hidden lg:flex flex-col items-end gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                          Consultation Fee
                        </p>
                        <p className="text-3xl font-bold text-[#0D1F3C] mt-1">
                          {feeFormatted}
                        </p>
                      </div>
                      <button
                        onClick={handleBookClick}
                        disabled={!hasAvailabilitySchedule}
                        className="inline-flex items-center gap-2 bg-[#0A6E75] hover:bg-[#085c62] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#0A6E75]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      >
                        {doctor.hasInPerson && !doctor.hasVideo ? (
                          <MapPin className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        Book Consultation
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      {!hasAvailabilitySchedule && (
                        <p className="text-xs text-red-500 text-right max-w-[200px]">
                          Schedule not yet available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio preview */}
                  {doctor.bio && (
                    <p className="mt-5 text-base text-gray-600 leading-relaxed line-clamp-3 lg:line-clamp-2">
                      {doctor.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Mobile CTA bar */}
              <div className="lg:hidden border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                    Consultation Fee
                  </p>
                  <p className="text-xl font-bold text-[#0D1F3C]">
                    {feeFormatted}
                  </p>
                </div>
                <button
                  onClick={handleBookClick}
                  disabled={!hasAvailabilitySchedule}
                  className="inline-flex items-center gap-2 bg-[#0A6E75] hover:bg-[#085c62] text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {doctor.hasInPerson && !doctor.hasVideo ? (
                    <MapPin className="w-4 h-4" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Content Grid ──────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            {/* Left column */}
            <div className="space-y-8">
              {/* About */}
              <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#0D1F3C] mb-4">
                  About {doctor.name}
                </h2>
                <p className="text-base text-gray-600 leading-relaxed">
                  {doctor.bio || "No biography available for this specialist."}
                </p>
                {doctor.specialtyDescription && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#0A6E75]/5 to-[#0A6E75]/10 rounded-xl border border-[#0A6E75]/10">
                    <h4 className="text-sm font-bold text-[#0A6E75] mb-1.5">
                      About {doctor.specialty}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {doctor.specialtyDescription}
                    </p>
                  </div>
                )}
              </section>

              {/* Availability */}
              <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[#0D1F3C]">
                    Availability
                  </h2>
                  {availableDays.length > 0 && (
                    <span className="text-xs font-semibold text-[#0A6E75] bg-[#0A6E75]/10 px-3 py-1 rounded-full">
                      {availableDays.length} day
                      {availableDays.length !== 1 ? "s" : ""} / week
                    </span>
                  )}
                </div>

                {Object.keys(doctor.schedules).length > 0 ? (
                  <div className="space-y-1">
                    {daysOfWeek.map((day) => {
                      const daySchedules = doctor.schedules[day];
                      const isAvailable =
                        daySchedules && daySchedules.length > 0;
                      return (
                        <div
                          key={day}
                          className={`flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${
                            isAvailable ? "bg-green-50/50" : ""
                          }`}
                        >
                          <span
                            className={`font-medium text-sm w-28 ${
                              isAvailable ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {day}
                          </span>
                          {isAvailable ? (
                            <div className="flex flex-wrap gap-2">
                              {daySchedules.map((schedule, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-lg border shadow-sm ${
                                    schedule.consultationMode === "IN_PERSON"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-white text-green-700 border-green-200"
                                  }`}
                                >
                                  {schedule.consultationMode === "IN_PERSON" ? (
                                    <MapPin className="w-3 h-3" />
                                  ) : (
                                    <Video className="w-3 h-3" />
                                  )}
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-300 italic">
                              Unavailable
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      Schedule not yet configured
                    </p>
                  </div>
                )}
              </section>

              {/* Reviews */}
              <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[#0D1F3C]">
                    Patient Reviews
                  </h2>
                  {doctor.reviews.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-gray-900">
                        {doctor.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({doctor.totalRatings})
                      </span>
                    </div>
                  )}
                </div>

                {doctor.reviews.length > 0 ? (
                  <div className="space-y-5">
                    {doctor.reviews.map((review, idx) => (
                      <div
                        key={idx}
                        className="pb-5 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D1F3C] to-[#0A6E75] flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {review.patientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-gray-900">
                                {review.patientName}
                              </span>
                              <p className="text-xs text-gray-400">
                                {new Date(
                                  review.createdAt
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.review && (
                          <p className="mt-2.5 text-sm text-gray-600 leading-relaxed ml-12">
                            {review.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No reviews yet</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Be the first to leave a review after your consultation
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Right column — sticky booking card */}
            <div>
              <div className="sticky top-24 space-y-6">
                {/* Booking card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0D1F3C] to-[#0A3454] px-6 py-5">
                    <h3 className="text-lg font-bold text-white">
                      Book a Consultation
                    </h3>
                    <p className="text-sm text-white/60 mt-0.5">
                      {doctor.hasInPerson && doctor.hasVideo
                        ? `Video & in-person consultations with ${doctor.name.split(" ")[0]}`
                        : doctor.hasInPerson
                          ? `In-person consultation with ${doctor.name.split(" ")[0]}`
                          : `Secure video consultation with ${doctor.name.split(" ")[0]}`}
                    </p>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Contact info */}
                    <div className="space-y-3">
                      {doctor.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {doctor.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-700">
                          {doctor.country}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Fee */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Consultation fee
                      </span>
                      <span className="text-2xl font-bold text-[#0D1F3C]">
                        {feeFormatted}
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleBookClick}
                      disabled={!hasAvailabilitySchedule}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#0A6E75] hover:bg-[#085c62] text-white font-semibold py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#0A6E75]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none text-base"
                    >
                      {doctor.hasInPerson && !doctor.hasVideo ? (
                        <MapPin className="w-4.5 h-4.5" />
                      ) : (
                        <Video className="w-4.5 h-4.5" />
                      )}
                      Book Appointment
                    </button>

                    {hasAvailabilitySchedule ? (
                      <p className="text-xs text-gray-400 text-center">
                        Choose your preferred date and time on the next step
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 text-center">
                        This specialist hasn&apos;t set up their schedule yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Trust signals */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#0A6E75] shrink-0" />
                      <span className="text-sm text-gray-600">
                        Verified DFC member
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4.5 h-4.5 text-[#0A6E75] shrink-0" />
                      <span className="text-sm text-gray-600">
                        Encrypted video consultation
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="w-4.5 h-4.5 text-[#0A6E75] shrink-0" />
                      <span className="text-sm text-gray-600">
                        Diaspora-trained specialist
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
