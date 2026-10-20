"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { UserRole } from "@prisma/client";
import {
  refreshSession,
  markSessionRefreshed,
  clearSessionMarker,
  msSinceLastRefresh,
  PROACTIVE_REFRESH_MS,
} from "@/lib/session-refresh";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string | null;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  profile?: any;
  dfcMember?: {
    id: string;
    category: string;
    status: string;
    goodStanding: boolean;
    duesExpiresAt: string | null;
    lastDuesPaidAt: string | null;
    isLegacy: boolean;
    path: string | null;
    memberNumber: string | null;
    isBotMember: boolean;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // While signed in, renew the 2-hour access token before it lapses so page
  // navigations (checked server-side) don't bounce to the login page. Timers
  // are throttled in background tabs, so also check when a tab is shown again.
  const signedIn = !!user;
  useEffect(() => {
    if (!signedIn) return;
    const renewIfDue = async () => {
      if (msSinceLastRefresh() < PROACTIVE_REFRESH_MS) return;
      if (!(await refreshSession())) setUser(null);
    };
    const interval = setInterval(renewIfDue, 60 * 1000);
    const onVisible = () => document.visibilityState === "visible" && renewIfDue();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [signedIn]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        markSessionRefreshed();
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearSessionMarker();
      setUser(null);
      // Redirect to home page
      window.location.href = "/";
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for role-based access
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/auth/login";
    }

    if (!loading && user && requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard
      const dashboardUrl =
        user.role === "SUPERADMIN" || user.role === "SECRETARIAT"
          ? "/admin"
          : user.role === "DFC_MEMBER"
            ? "/member"
            : user.role === "HOSPITAL_ADMIN"
              ? "/hospital"
              : "/";
      window.location.href = dashboardUrl;
    }
  }, [user, loading, requiredRole]);

  return { user, loading };
}
