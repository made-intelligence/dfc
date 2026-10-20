"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/lib/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Star,
  Calendar,
  Stethoscope,
  Eye,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading";
import AddDoctorModal from "@/components/admin/AddDoctorModal";
import { FilterChips, ListPager } from "@/components/admin/ListControls";

interface DoctorData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  consultationFee: number;
  isActive: boolean;
  rating: number;
  totalPatients: number;
  joinDate: string;
}

interface DoctorsResponse {
  doctors: DoctorData[];
  stats: {
    totalDoctors: number;
    activeDoctors: number;
    avgRating: number;
    newThisMonth: number;
  };
  pagination: { page: number; limit: number; total: number; pages: number };
}

type StatusFilter = "" | "active" | "inactive";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PAGE_SIZE = 25;

export default function DoctorsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    avgRating: 0,
    newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", String(page));
      params.append("limit", String(PAGE_SIZE));

      const response = await fetch(`/api/admin/doctors?${params}`);
      const data: DoctorsResponse = await response.json();

      setDoctors(data.doctors);
      setStats(data.stats);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total ?? data.doctors.length);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Doctors</h1>
          <p className="mt-1 text-sm text-gray-500">Registered doctors and their practice details</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Doctors", value: stats.totalDoctors, icon: Stethoscope, color: "text-[#0D1F3C]" },
          { label: "Active Doctors", value: stats.activeDoctors, icon: Stethoscope, color: "text-green-600" },
          { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: Star, color: "text-amber-500" },
          { label: "New This Month", value: stats.newThisMonth, icon: UserPlus, color: "text-[#0A6E75]" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <CardTitle>All Doctors</CardTitle>
              <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} />
          ) : doctors.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No doctors match these filters.</p>
          ) : (
            <div className="space-y-4">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0A6E75]/10">
                      <Stethoscope className="h-6 w-6 text-[#0A6E75]" />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{doctor.name}</h3>
                        <Badge variant="secondary">{doctor.specialty}</Badge>
                        <Badge variant={doctor.isActive ? "default" : "secondary"}>
                          {doctor.isActive ? "active" : "inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {doctor.email}
                        </span>
                        {doctor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {doctor.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          {doctor.rating.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {doctor.totalPatients} patients
                        </span>
                        <span>₦{doctor.consultationFee.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`View ${doctor.name}`}
                    onClick={() => router.push(`/admin/doctors/${doctor.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <ListPager
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              totalPages={totalPages}
              noun="doctor"
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <AddDoctorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchDoctors();
        }}
      />
    </div>
  );
}
