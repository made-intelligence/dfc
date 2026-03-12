"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Calendar,
  AlertTriangle,
  Activity,
  ChevronRight,
  Droplets,
} from "lucide-react";

interface EMRPatient {
  patientProfileId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  gender: string | null;
  encounterCount: number;
  lastEncounterDate: string | null;
  allergyCount: number;
  problemCount: number;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded" />
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-3 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function EMRPatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<EMRPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch("/api/emr/patients", {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch patients");
        }
        const data = await res.json();
        setPatients(data.patients || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.email && p.email.toLowerCase().includes(term)),
    );
  }, [patients, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1F3C]">Patient Records</h1>
        <p className="text-gray-500 mt-1">
          View and manage electronic medical records for your patients
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent"
        />
      </div>

      {loading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-base">
          {error}
        </div>
      )}

      {!loading && !error && filteredPatients.length === 0 && (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No patients match your search" : "No patients yet"}
          </h3>
          <p className="text-gray-500 text-base">
            {searchTerm
              ? "Try adjusting your search criteria."
              : "Your patients will appear here after confirmed appointments."}
          </p>
        </div>
      )}

      {!loading && !error && filteredPatients.length > 0 && (
        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <button
              key={patient.patientProfileId}
              onClick={() =>
                router.push(`/doctor/emr/${patient.patientProfileId}`)
              }
              className="w-full text-left rounded-xl border border-gray-200 p-5 hover:border-[#0A6E75]/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                {patient.profileImage ? (
                  <img
                    src={patient.profileImage}
                    alt={patient.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#0A6E75]/10 text-[#0A6E75] flex items-center justify-center font-semibold text-sm">
                    {getInitials(patient.name)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#0D1F3C] text-base">
                      {patient.name}
                    </span>
                    {patient.dateOfBirth && (
                      <span className="text-sm text-gray-500">
                        {calculateAge(patient.dateOfBirth)} yrs
                      </span>
                    )}
                    {patient.gender && (
                      <span className="text-sm text-gray-500">
                        {patient.gender}
                      </span>
                    )}
                    {patient.bloodGroup && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-xs font-semibold">
                        <Droplets className="h-3 w-3" />
                        {patient.bloodGroup}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                    {patient.lastEncounterDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Last seen{" "}
                        {new Date(
                          patient.lastEncounterDate,
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" />
                      {patient.encounterCount} encounter
                      {patient.encounterCount !== 1 ? "s" : ""}
                    </span>
                    {patient.allergyCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {patient.allergyCount} allerg
                        {patient.allergyCount !== 1 ? "ies" : "y"}
                      </span>
                    )}
                    {patient.problemCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        {patient.problemCount} active problem
                        {patient.problemCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#0A6E75] font-medium group-hover:underline hidden sm:inline">
                    Open record
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#0A6E75] transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
