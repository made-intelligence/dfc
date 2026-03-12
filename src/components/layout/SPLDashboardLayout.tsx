"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "./NotificationsDropdown";
import Image from "next/image";
import {
  Menu,
  X,
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

interface SPLDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface SPLProfile {
  partner: {
    id: string;
    name: string;
    shortName: string;
    type: string;
    logoUrl: string | null;
  };
  role: string;
  activeContract: {
    id: string;
    title: string;
    model: string;
    status: string;
    casesRemainingThisPeriod: number | null;
    casesDeliveredThisPeriod: number | null;
    subscribedVolume: number | null;
    endDate: string | null;
  } | null;
}

const navigationItems = [
  { name: "Dashboard", href: "/spl", icon: LayoutDashboard },
  { name: "Submit a Case", href: "/spl/cases/new", icon: PlusCircle },
  { name: "Cases", href: "/spl/cases", icon: Briefcase },
  { name: "Contracts", href: "/spl/contracts", icon: FileText },
  { name: "Invoices", href: "/spl/invoices", icon: Receipt },
  { name: "Reports", href: "/spl/reports", icon: BarChart3 },
  { name: "Settings", href: "/spl/settings", icon: Settings },
];

function getContractBadgeColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500 text-white";
    case "DRAFT":
      return "bg-gray-400 text-white";
    case "UNDER_REVIEW":
      return "bg-yellow-500 text-white";
    case "SUSPENDED":
      return "bg-red-500 text-white";
    case "TERMINATED":
      return "bg-red-700 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

export function SPLDashboardLayout({
  children,
  title,
}: SPLDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<SPLProfile | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchProfile();
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/spl/profile", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch SPL profile:", error);
    }
  };

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const partnerName = profile?.partner?.name || "SPL Partner";
  const partnerShortName = profile?.partner?.shortName || "SPL";
  const partnerLogo = profile?.partner?.logoUrl;
  const activeContract = profile?.activeContract;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-transform duration-300 ease-in-out
        lg:fixed lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
        style={{ backgroundColor: "#0D1F3C" }}
      >
        {/* Sidebar header — partner info */}
        <div className="flex items-center justify-between h-20 px-5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            {partnerLogo ? (
              <Image
                src={partnerLogo}
                alt={partnerName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ backgroundColor: "#0A6E75", color: "#fff" }}>
                {partnerShortName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate font-serif">
                {partnerName}
              </p>
              <p className="text-xs text-gray-400">HMO Partner Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Contract status badge */}
        {activeContract && (
          <div className="px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getContractBadgeColor(activeContract.status)}`}
              >
                {activeContract.status}
              </span>
              <span className="text-xs text-gray-400 truncate">
                {activeContract.title}
              </span>
            </div>
            {activeContract.casesRemainingThisPeriod !== null && (
              <p className="text-xs text-gray-300">
                Cases remaining:{" "}
                <span className="font-semibold text-white">
                  {activeContract.casesRemainingThisPeriod}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-4 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/spl" && pathname.startsWith(item.href + "/"));
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={`w-full justify-start text-white hover:bg-white/10 ${
                    isActive ? "bg-white/15 text-white" : "text-gray-300"
                  }`}
                  style={isActive ? { backgroundColor: "rgba(10,110,117,0.4)" } : undefined}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#0A6E75" }}
              >
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {profile?.role?.toLowerCase() || "admin"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full cursor-pointer hover:text-red-800 text-red-700 border-red-700/30"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold font-serif" style={{ color: "#0D1F3C" }}>
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <div className="text-sm text-gray-600">
                Welcome, {user.name}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
