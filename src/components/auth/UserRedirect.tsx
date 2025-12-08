"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@prisma/client";

export default function UserRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect doctors and admins to their dashboards
      if (user.role === UserRole.DOCTOR) {
        router.push("/doctor/patients");
      } else if (
        user.role === UserRole.ADMIN ||
        user.role === UserRole.SUPERADMIN
      ) {
        router.push("/admin");
      }
      // Patients stay on the landing page
    }
  }, [user, loading, router]);

  return null;
}
