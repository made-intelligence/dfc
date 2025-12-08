"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Stethoscope,
  Award,
  Users,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
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
}

function BookPageContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null,
  );
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Initialize search from URL
  useEffect(() => {
    const query = searchParams.get("search");
    if (query && query !== searchTerm) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Fetch specialties
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

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (selectedSpecialty) params.append("specialtyId", selectedSpecialty);
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

    const debounce = setTimeout(() => {
      fetchDoctors();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, selectedSpecialty, page]);

  const handleSpecialtyClick = (specialtyId: string) => {
    if (selectedSpecialty === specialtyId) {
      setSelectedSpecialty(null);
    } else {
      setSelectedSpecialty(specialtyId);
    }
    setPage(1);
  };

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative text-white pt-24 md:pt-60 pb- md:pb-20 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/hero2.jpg"
              alt="Medical professionals"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-br from-[#0A2463]/50 via-blue-700/50 to-blue-900/70"></div>
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Find Your Perfect Doctor
              </h1>
              <p className="text-lg text-blue-100 mb-8 max-w-3xl mx-auto">
                Connect with qualified healthcare professionals and book
                appointments instantly
              </p>

              {/* Search Bar */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-3 flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Search for doctors e.g Bariatric Surgeon, Dermatologist, General Surgeon"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="text-primary pl-6 pr-4 py-6 text-base border-0 focus:ring-2 focus:ring-[#0A2463] rounded-xl"
                    />
                  </div>

                  <Button
                    size="lg"
                    className="px-12 py-6 bg-[#0A2463] hover:bg-[#0A2463]/90 text-white rounded-xl font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-50 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-lg font-semibold text-[#0A2463] mb-4">
              Filter by Specialty
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedSpecialty === null ? "default" : "outline"}
                onClick={() => {
                  setSelectedSpecialty(null);
                  setPage(1);
                }}
                className="rounded-full"
              >
                All Specialties
              </Button>
              {specialties.map((specialty) => (
                <Button
                  key={specialty.id}
                  variant={
                    selectedSpecialty === specialty.id ? "default" : "outline"
                  }
                  onClick={() => handleSpecialtyClick(specialty.id)}
                  className="rounded-full"
                >
                  {specialty.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctors Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-4xl font-bold text-[#0A2463] text-center mb-12">
            {selectedSpecialty
              ? `${specialties.find((s) => s.id === selectedSpecialty)?.name} Specialists`
              : "Popular Doctors"}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No doctors found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSpecialty(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden border-0 shadow-md"
                  >
                    <CardHeader className="p-0">
                      <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                        {doctor.profileImage ? (
                          <Image
                            src={doctor.profileImage}
                            alt={doctor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                            <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-bold">
                              {doctor.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-[#0A2463] mb-1">
                            {doctor.name}
                          </CardTitle>
                          <p className="text-sm text-[#0A2463]/70 font-medium mb-2">
                            {doctor.specialty} |{" "}
                            {doctor.experience > 0
                              ? `${doctor.experience} years`
                              : "New"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-gray-900">
                            {doctor.rating > 0
                              ? doctor.rating.toFixed(1)
                              : "5.0"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                         <div className="flex items-center gap-1 bg-blue-50/50 px-2.5 py-1 rounded-full border border-blue-100">
                            <MapPin className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-medium text-blue-900">{doctor.country}</span>
                         </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-2xl font-bold text-[#0A2463]">
                          {doctor.currency}
                          {doctor.consultationFee.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>

                    <CardFooter className="p-6 pt-0">
                      <Link href={`/book/${doctor.slug}`} className="w-full">
                        <Button
                          className="w-full bg-white text-[#0A2463] border-2 border-[#0A2463] hover:bg-[#0A2463] hover:text-white rounded-full py-6 text-base font-semibold transition-all"
                          size="lg"
                        >
                          Book Now
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
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
