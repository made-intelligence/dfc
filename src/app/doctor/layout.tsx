"use client";

import { UserRole } from "@prisma/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.DFC_MEMBER, UserRole.SUPERADMIN]}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
