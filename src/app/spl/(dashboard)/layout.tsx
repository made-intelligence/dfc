"use client";

import { UserRole } from "@prisma/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SPLDashboardLayout } from "@/components/layout/SPLDashboardLayout";
import { ToastProvider } from "@/components/ui/toast";

export default function SPLLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SPL_ADMIN, UserRole.SUPERADMIN]}>
      <ToastProvider>
        <SPLDashboardLayout>{children}</SPLDashboardLayout>
      </ToastProvider>
    </ProtectedRoute>
  );
}
