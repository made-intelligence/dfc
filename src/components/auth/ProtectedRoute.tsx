"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      const loginUrl = redirectTo
        ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
        : "/auth/login";
      router.push(loginUrl);
      return;
    }

    // Check role-based access
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard
      const dashboardUrl = getDashboardUrl(user.role);
      router.push(dashboardUrl);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard
      const dashboardUrl = getDashboardUrl(user.role);
      router.push(dashboardUrl);
      return;
    }
  }, [user, loading, requiredRole, allowedRoles, redirectTo, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading type="pulse" size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Check role access
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case UserRole.SUPERADMIN:
    case UserRole.SECRETARIAT:
      return "/admin";
    case UserRole.DFC_MEMBER:
      return "/member";
    case UserRole.HOSPITAL_ADMIN:
      return "/hospital";
    case UserRole.SPL_ADMIN:
      return "/spl";
    case UserRole.PATIENT:
      return "/appointments";
    default:
      return "/";
  }
}
