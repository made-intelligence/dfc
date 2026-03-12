"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Search,
  MapPin,
  Building2,
  Stethoscope,
  Users,
  ShieldCheck,
  ArrowRight,
  Filter,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";

interface Specialist {
  id: string;
  slug: string;
  name: string;
  title?: string;
  specialty: string;
  subSpecialty?: string;
  institution: string;
  city: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  endorsementCount: number;
  bio?: string;
}

const SPECIALTIES = [
  "All specialties",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Surgery",
  "Haematology",
  "Infectious Diseases",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Obstetrics & Gynaecology",
  "Oncology",
  "Ophthalmology",
  "Orthopaedics",
  "Otorhinolaryngology (ENT)",
  "Paediatrics",
  "Pathology",
  "Plastic Surgery",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urology",
];

const INSTITUTIONS = [
  "All institutions",
  "LUTH",
  "National Hospital Abuja",
  "UCH Ibadan",
  "Lakeshore Cancer Center",
  "St. Nicholas Hospital",
  "Reddington Hospital",
  "UBTH",
];

const CITIES = [
  "All cities",
  "Lagos",
  "Abuja",
  "Ibadan",
  "Port Harcourt",
  "Enugu",
  "Kano",
];

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState("All specialties");
  const [institution, setInstitution] = useState("All institutions");
  const [city, setCity] = useState("All cities");
  const [statusTab, setStatusTab] = useState<"all" | "verified">("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchSpecialists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (specialty !== "All specialties") params.set("specialty", specialty);
      if (institution !== "All institutions")
        params.set("institution", institution);
      if (city !== "All cities") params.set("city", city);
      if (statusTab === "verified") params.set("status", "ACTIVE");

      const res = await fetch(`/api/public/specialists?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSpecialists(data.specialists ?? data ?? []);
      }
    } catch {
      console.error("Failed to fetch specialists");
    } finally {
      setLoading(false);
    }
  }, [specialty, institution, city, statusTab]);

  useEffect(() => {
    fetchSpecialists();
  }, [fetchSpecialists]);

  const verifiedCount = specialists.filter(
    (s) => s.status === "ACTIVE"
  ).length;
  const activeFilters = [specialty, institution, city].filter(
    (f) => !f.startsWith("All")
  ).length;

  const selectClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] transition-shadow";

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0D1F3C 0%, #122847 40%, #0A4A50 100%)",
          }}
        >
          {/* Decorative orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-3xl"
              style={{ top: "-10%", right: "-5%" }}
            />
            <div
              className="absolute w-[300px] h-[300px] rounded-full bg-[#0A4A50]/20 blur-3xl"
              style={{ bottom: "-15%", left: "10%" }}
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pt-32 pb-16 lg:pt-36 lg:pb-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm text-white/80 mb-6">
                <ShieldCheck className="w-4 h-4" />
                Every specialist is independently verified
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                Nigeria-Based Specialist Network
              </h1>
              <p className="mt-4 text-lg text-white/70 leading-relaxed max-w-2xl">
                Find trusted consultants for referrals and collaboration.
                Specialists in this directory hold a confirmed MDCN licence,
                verified institutional appointment, and peer endorsements from
                DFC members.
              </p>
            </div>

            {/* Verification badges */}
            <div className="mt-8 flex flex-wrap gap-4">
              {[
                {
                  icon: ShieldCheck,
                  label: "MDCN Verified",
                  desc: "Licence confirmed",
                },
                {
                  icon: Building2,
                  label: "Institution Confirmed",
                  desc: "Active appointment",
                },
                {
                  icon: Users,
                  label: "Peer-Endorsed",
                  desc: "Min. 2 endorsements",
                },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10"
                >
                  <badge.icon className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {badge.label}
                    </p>
                    <p className="text-xs text-white/50">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <div className="max-w-6xl mx-auto px-6 sm:px-8 -mt-6 relative z-20">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
            {/* Desktop filters */}
            <div className="hidden sm:grid sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Specialty
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className={`${selectClass} pl-9`}
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Institution
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className={`${selectClass} pl-9`}
                  >
                    {INSTITUTIONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`${selectClass} pl-9`}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSpecialty("All specialties");
                    setInstitution("All institutions");
                    setCity("All cities");
                  }}
                  className="w-full h-[42px] rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </div>

            {/* Mobile filter toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter specialists
                  {activeFilters > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0D1F3C] text-white text-xs">
                      {activeFilters}
                    </span>
                  )}
                </div>
                <Search className="w-4 h-4" />
              </button>
              {showFilters && (
                <div className="mt-3 space-y-3">
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className={selectClass}
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className={selectClass}
                  >
                    {INSTITUTIONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={selectClass}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results section */}
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
          {/* Status tabs + count */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1 border-b border-gray-200">
              <button
                onClick={() => setStatusTab("all")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  statusTab === "all"
                    ? "border-b-2 border-[#0D1F3C] text-[#0D1F3C]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All specialists ({specialists.length})
              </button>
              <button
                onClick={() => setStatusTab("verified")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  statusTab === "verified"
                    ? "border-b-2 border-[#0D1F3C] text-[#0D1F3C]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified ({verifiedCount})
                </span>
              </button>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-4 md:grid-cols-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white p-6"
                >
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && specialists.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white py-20 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-base font-medium text-gray-900 mb-1">
                No specialists found
              </p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Try adjusting your filters or check back later. New specialists
                are verified and added regularly.
              </p>
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setSpecialty("All specialties");
                    setInstitution("All institutions");
                    setCity("All cities");
                  }}
                  className="mt-4 text-sm font-medium text-[#0A4A50] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Specialist cards */}
          {!loading && specialists.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {specialists.map((spec) => (
                <Link
                  key={spec.id}
                  href={`/specialists/${spec.slug}`}
                  className="group block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-[#0D1F3C] flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {spec.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0D1F3C] transition-colors">
                          {spec.title ? `${spec.title} ` : ""}
                          {spec.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {spec.specialty}
                          {spec.subSpecialty ? ` — ${spec.subSpecialty}` : ""}
                        </p>
                      </div>
                    </div>
                    {spec.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-100">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-100">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {spec.institution}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {spec.city}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0D1F3C]/5 px-2.5 py-1 text-xs font-medium text-[#0D1F3C]">
                      <Users className="w-3 h-3" />
                      {spec.endorsementCount} endorsement
                      {spec.endorsementCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs font-medium text-[#0A4A50] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      View profile <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  {spec.bio && (
                    <p className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {spec.bio}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <section className="bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-[#0D1F3C] p-8 text-white">
                <h3 className="text-xl font-bold mb-2">
                  Are you a specialist in Nigeria?
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Join the DFC Local Specialist Network to receive referrals from
                  diaspora colleagues, collaborate on second opinion cases, and
                  access our professional community.
                </p>
                <Link
                  href="/auth/join"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-white text-[#0D1F3C] text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Apply to join <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="rounded-xl bg-[#0A4A50] p-8 text-white">
                <h3 className="text-xl font-bold mb-2">
                  Need a second opinion?
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Get a written clinical assessment from a DFC-verified
                  specialist trained at a leading institution abroad. Reports
                  delivered within 72 hours.
                </p>
                <Link
                  href="/second-opinion"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-white text-[#0A4A50] text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Request a second opinion <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
