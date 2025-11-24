'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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
  redirectTo 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      const loginUrl = redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : '/auth/login';
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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
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
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.DOCTOR:
      return '/doctor';
    case UserRole.PATIENT:
      return '/patient';
    default:
      return '/';
  }
}
