"use client";

import { UserRole } from "@prisma/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HospitalDashboardLayout } from "@/components/layout/HospitalDashboardLayout";
import { ToastProvider } from "@/components/ui/toast";

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HOSPITAL_ADMIN, UserRole.SUPERADMIN]}>
      <ToastProvider>
        <HospitalDashboardLayout>{children}</HospitalDashboardLayout>
      </ToastProvider>
    </ProtectedRoute>
  );
}
