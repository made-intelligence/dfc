"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ScheduleManager from "@/components/schedule/ScheduleManager";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@prisma/client";

export default function AdminDoctorSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const doctorId = params.id as string;
  const [doctorName, setDoctorName] = useState<string>();

  useEffect(() => {
    fetch(`/api/admin/doctors/${doctorId}/schedule`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDoctorName(data?.doctor?.name))
      .catch(() => {});
  }, [doctorId]);

  return (
    <ScheduleManager
      apiUrl={`/api/admin/doctors/${doctorId}/schedule`}
      doctorName={doctorName ? `Dr. ${doctorName}` : "this doctor"}
      header={
        <div className="flex flex-col gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="w-fit -ml-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">
            {doctorName ? `Dr. ${doctorName}'s schedule` : "Doctor schedule"}
          </h1>
          <p className="text-sm text-gray-500">
            Changes take effect for bookings immediately, and the doctor is notified of each one.
            {user?.role === UserRole.SUPERADMIN && (
              <>
                {" "}
                <a
                  href={`/admin/audit-logs?resource=doctor_schedule&resourceId=${doctorId}`}
                  className="text-[#0A6E75] hover:underline"
                >
                  View change history
                </a>
              </>
            )}
          </p>
        </div>
      }
    />
  );
}
