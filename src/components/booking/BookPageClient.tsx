"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Star, MapPin, Stethoscope } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";
import { SPECIALTIES } from "@/lib/specialties";

const INSTITUTIONS = [
  "Lagos University Teaching Hospital (LUTH)",
  "National Hospital Abuja",
  "University College Hospital (UCH) Ibadan",
  "Lagos Island General Hospital",
  "Lakeshore Cancer Center",
  "St. Nicholas Hospital Lagos",
  "Reddington Hospital Lagos",
  "University of Benin Teaching Hospital",
];

const CITIES = ["Lagos", "Abuja", "Ibadan", "Port Harcourt", "Enugu", "Kano"];

interface Specialty {
  id: string;
  name: string;
  description: string | null;
  doctorCount: number;
}

interface Doctor {
  id: string;
  slug: string;
  name: string;
  profileImage: string | null;
  specialty: string;
  specialtyId: string | null;
  consultationFee: number | string;
  currency: string;
  country: string;
  bio: string | null;
  experience: number;
  rating: number;
  totalRatings: number;
  institution?: string;
  city?: string;
}

function BookPageContent() {
  const searchParams = useSearchParams();
  const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Initialize from URL params
  useEffect(() => {
    const specialty = searchParams.get("specialty");
    const city = searchParams.get("city") || searchParams.get("location");
    if (specialty) setSelectedSpecialtyName(decodeURIComponent(specialty));
    if (city) setSelectedCity(decodeURIComponent(city));
  }, [searchParams]);

  // Fetch specialties from API
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch("/api/public/specialties");
        const data = await response.json();
        setSpecialties(data.specialties || []);
      } catch (error) {
        console.error("Failed to fetch specialties:", error);
      }
    };
    fetchSpecialties();
  }, []);

  // Match specialty name to ID when both are available
  useEffect(() => {
    if (selectedSpecialtyName && specialties.length > 0) {
      const match = specialties.find(
        (s) => s.name.toLowerCase() === selectedSpecialtyName.toLowerCase()
      );
      setSelectedSpecialtyId(match?.id || null);
    } else {
      setSelectedSpecialtyId(null);
    }
  }, [selectedSpecialtyName, specialties]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedSpecialtyId) params.append("specialtyId", selectedSpecialtyId);
        if (selectedInstitution) params.append("institution", selectedInstitution);
        if (selectedCity) params.append("city", selectedCity);
        params.append("page", page.toString());
        params.append("limit", "12");

        const response = await fetch(`/api/public/doctors?${params}`);
        const data = await response.json();
        setDoctors(data.doctors || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchDoctors, 200);
    return () => clearTimeout(debounce);
  }, [selectedSpecialtyId, selectedInstitution, selectedCity, page]);

  const handleSpecialtyPillClick = (specialtyId: string) => {
    if (selectedSpecialtyId === specialtyId) {
      setSelectedSpecialtyId(null);
      setSelectedSpecialtyName("");
    } else {
      setSelectedSpecialtyId(specialtyId);
      const match = specialties.find((s) => s.id === specialtyId);
      setSelectedSpecialtyName(match?.name || "");
    }
    setPage(1);
  };

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-white">
        {/* Header */}
        <div className="relative text-white pt-24 md:pt-48 pb-12 md:pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/hero2.jpg"
              alt="Medical professionals"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[#0D1F3C]/80"></div>
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Find a Specialist
              </h1>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                Search by specialty and institution to find a diaspora-trained specialist.
              </p>
            </div>

            {/* Filter Dropdowns */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row gap-3">
                <select
                  value={selectedSpecialtyName}
                  onChange={(e) => {
                    setSelectedSpecialtyName(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent bg-white"
                >
                  <option value="">All specialties</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedInstitution}
                  onChange={(e) => {
                    setSelectedInstitution(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent bg-white"
                >
                  <option value="">All institutions</option>
                  {INSTITUTIONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent bg-white"
                >
                  <option value="">All cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Specialty Pills */}
        <div className="bg-gray-50 py-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSpecialtyId === null ? "default" : "outline"}
                onClick={() => {
                  setSelectedSpecialtyId(null);
                  setSelectedSpecialtyName("");
                  setPage(1);
                }}
                className="rounded-full text-sm"
                size="sm"
              >
                All Specialties
              </Button>
              {specialties.map((specialty) => (
                <Button
                  key={specialty.id}
                  variant={selectedSpecialtyId === specialty.id ? "default" : "outline"}
                  onClick={() => handleSpecialtyPillClick(specialty.id)}
                  className="rounded-full text-sm"
                  size="sm"
                >
                  {specialty.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {selectedSpecialtyName
              ? `${selectedSpecialtyName} Specialists`
              : "Available Specialists"}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse rounded-2xl">
                  <CardHeader>
                    <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-16">
              <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No specialists found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => {
                  setSelectedSpecialtyName("");
                  setSelectedSpecialtyId(null);
                  setSelectedInstitution("");
                  setSelectedCity("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden border border-gray-200"
                  >
                    <CardHeader className="p-0">
                      <div className="relative w-full h-56 bg-gray-100">
                        {doctor.profileImage ? (
                          <Image
                            src={doctor.profileImage}
                            alt={doctor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="w-24 h-24 rounded-full bg-[#0D1F3C] flex items-center justify-center text-white text-4xl font-bold">
                              {doctor.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-3">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                          {doctor.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 font-medium">
                          {doctor.specialty}
                          {doctor.experience > 0
                            ? ` · ${doctor.experience} years experience`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{doctor.country}</span>
                        </div>
                        {doctor.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-gray-700">
                              {doctor.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="p-5 pt-0">
                      <Link href={`/book/${doctor.slug}`} className="w-full">
                        <Button
                          className="w-full bg-[#0D1F3C] hover:bg-[#162d52] text-white rounded-lg py-5 text-base font-medium"
                          size="lg"
                        >
                          View Profile
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-full px-6"
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-full px-6"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BookPageClient() {
  return (
    <Suspense fallback={<Loading />}>
      <BookPageContent />
    </Suspense>
  );
}
