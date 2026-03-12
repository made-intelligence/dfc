"use client";

import { UserRole } from "@prisma/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MemberDashboardLayout } from "@/components/layout/MemberDashboardLayout";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.DFC_MEMBER, UserRole.SUPERADMIN]}>
      <MemberDashboardLayout>{children}</MemberDashboardLayout>
    </ProtectedRoute>
  );
}
