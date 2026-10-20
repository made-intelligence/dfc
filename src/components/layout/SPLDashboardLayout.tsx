"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useSidebarCollapsed } from "@/lib/sidebar-collapse";
import Image from "next/image";
import {
  Menu,
  X,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
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
  { name: "Overview", href: "/spl", icon: LayoutDashboard },
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
  // Desktop only: shrink the sidebar to an icon rail.
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // The main column is the scroll container (so scrolling the sidebar never
  // moves the page); start each page at the top like a window scroll would.
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    fetch("/api/spl/profile", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data) setProfile(data);
      })
      .catch((error) => console.error("Failed to fetch SPL profile:", error));
    return () => {
      active = false;
    };
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
    <div className="h-dvh overflow-hidden bg-gray-50 flex">
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
        fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-[transform,width] duration-300 ease-in-out
        flex flex-col
        lg:fixed lg:translate-x-0
        ${collapsed ? "lg:w-16" : ""}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
        style={{ backgroundColor: "#0D1F3C" }}
      >
        {/* Sidebar header — partner info */}
        <div className={`flex items-center justify-between h-20 px-5 border-b border-white/10 shrink-0 ${collapsed ? "lg:px-0 lg:justify-center" : ""}`}>
          <div className="flex items-center gap-3 min-w-0" title={collapsed ? partnerName : undefined}>
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
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
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
          <div className={`px-5 py-3 border-b border-white/10 shrink-0 ${collapsed ? "lg:hidden" : ""}`}>
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
        <nav className={`mt-4 px-3 pb-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain ${collapsed ? "lg:px-2" : ""}`}>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                // A case's own page highlights Cases, but /spl/cases/new
                // belongs to "Submit a Case".
                (item.href !== "/spl" &&
                  pathname.startsWith(item.href + "/") &&
                  pathname !== "/spl/cases/new");
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  title={collapsed ? item.name : undefined}
                  aria-label={item.name}
                  className={`w-full justify-start text-white hover:bg-white/10 ${
                    isActive ? "bg-white/15 text-white" : "text-gray-300"
                  } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                  style={isActive ? { backgroundColor: "rgba(10,110,117,0.4)" } : undefined}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className={`mr-3 h-5 w-5 shrink-0 ${collapsed ? "lg:mr-0" : ""}`} />
                  <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.name}</span>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className={`shrink-0 p-4 border-t border-white/10 ${collapsed ? "lg:px-2" : ""}`}>
          <div className={`flex items-center mb-4 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex-shrink-0" title={collapsed ? user.name : undefined}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#0A6E75" }}
              >
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className={`ml-3 min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
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
            className={`w-full cursor-pointer hover:text-red-800 text-red-700 border-red-700/30 ${collapsed ? "lg:px-0" : ""}`}
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            aria-label="Sign Out"
          >
            <LogOut className={`mr-2 h-4 w-4 ${collapsed ? "lg:mr-0" : ""}`} />
            <span className={collapsed ? "lg:hidden" : ""}>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div ref={mainRef} className={`flex-1 min-w-0 h-dvh overflow-y-auto transition-[margin] duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
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
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex mr-2 text-gray-600"
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
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
