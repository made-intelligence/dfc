"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Menu,
  X,
  Home,
  Calendar,
  Users,
  ShieldCheck,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { AccountMenu } from "./AccountMenu";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useSidebarCollapsed } from "@/lib/sidebar-collapse";

interface HospitalDashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: "Dashboard", href: "/hospital", icon: Home },
  { name: "Deployments", href: "/hospital/deployments", icon: Calendar },
  { name: "Specialists", href: "/hospital/specialists", icon: Users },
  { name: "Verification", href: "/hospital/verification", icon: ShieldCheck },
  { name: "Documents", href: "/hospital/documents", icon: FileText },
  { name: "Settings", href: "/hospital/settings", icon: Settings },
];

export function HospitalDashboardLayout({
  children,
}: HospitalDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop only: shrink the sidebar to an icon rail.
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const [hospitalName, setHospitalName] = useState<string>("");
  const [hospitalTier, setHospitalTier] = useState<string>("");
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
    if (!user?.id) return;
    let active = true;
    fetch("/api/hospital/settings")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setHospitalName(data.hospital?.name || "Hospital Portal");
        setHospitalTier(data.hospital?.tier || "STANDARD");
      })
      .catch((error) => console.error("Failed to fetch hospital info:", error));
    return () => {
      active = false;
    };
  }, [user?.id]);

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

  const tierBadgeColor: Record<string, string> = {
    STANDARD: "bg-gray-100 text-gray-700",
    PREMIUM: "bg-amber-100 text-amber-700",
    ENTERPRISE: "bg-teal-100 text-teal-700",
  };

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
        <div className={`flex items-center justify-between bg-white h-16 px-6 border-b border-gray-200 shrink-0 ${collapsed ? "lg:px-0 lg:justify-center" : ""}`}>
          <div className="flex items-center">
            <Image
              src="/dfc-logo.png"
              alt="DFC"
              width={120}
              height={44}
              className={`h-10 w-auto ${collapsed ? "lg:hidden" : ""}`}
            />
            {collapsed && (
              <Image
                src="/icon-192x192.png"
                alt="DFC"
                width={36}
                height={36}
                className="hidden lg:block h-9 w-9"
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-[#0A4A50]"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Hospital name & tier */}
        <div className={`px-4 py-4 border-b border-[#1a3258] shrink-0 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-sm font-serif font-semibold text-white truncate">
            {hospitalName || "Hospital Portal"}
          </p>
          {hospitalTier && (
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${tierBadgeColor[hospitalTier] || tierBadgeColor.STANDARD}`}
            >
              {hospitalTier}
            </span>
          )}
        </div>

        <nav className={`mt-4 px-3 pb-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain ${collapsed ? "lg:px-2" : ""}`}>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/hospital" &&
                  pathname.startsWith(item.href + "/"));
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  title={collapsed ? item.name : undefined}
                  aria-label={item.name}
                  className={`w-full justify-start text-white hover:bg-[#0A4A50] ${
                    isActive ? "bg-[#0A4A50] text-white" : ""
                  } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
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
              <h1 className="text-xl font-serif font-semibold text-[#0D1F3C]">
                Hospital Portal
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <AccountMenu
                name={user.name}
                email={user.email}
                subtitle="Hospital Admin"
                profileHref="/hospital/settings"
                profileLabel="Settings"
                onSignOut={handleLogout}
              />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
