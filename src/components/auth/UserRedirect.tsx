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
      switch (user.role) {
        case UserRole.SUPERADMIN:
        case UserRole.SECRETARIAT:
          router.push("/admin");
          break;
        case UserRole.DFC_MEMBER:
          router.push("/member");
          break;
        case UserRole.HOSPITAL_ADMIN:
          router.push("/hospital");
          break;
        case UserRole.SPL_ADMIN:
          router.push("/spl");
          break;
        case UserRole.PATIENT:
          // Patients stay on homepage — they use the booking flow
          break;
      }
    }
  }, [user, loading, router]);

  return null;
}
