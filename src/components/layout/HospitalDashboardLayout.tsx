"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  LogOut,
} from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";

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
  const [hospitalName, setHospitalName] = useState<string>("");
  const [hospitalTier, setHospitalTier] = useState<string>("");
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user?.id) {
      fetchHospitalInfo();
    }
  }, [user?.id]);

  const fetchHospitalInfo = async () => {
    try {
      const response = await fetch("/api/hospital/settings");
      if (response.ok) {
        const data = await response.json();
        setHospitalName(data.hospital?.name || "Hospital Portal");
        setHospitalTier(data.hospital?.tier || "STANDARD");
      }
    } catch (error) {
      console.error("Failed to fetch hospital info:", error);
    }
  };

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
        <div className="flex items-center justify-between bg-white h-16 px-6 border-b border-[#0A4A50]">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="DFC Medical"
              width={200}
              height={80}
              className="h-20 w-auto"
            />
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
        <div className="px-4 py-4 border-b border-[#1a3258]">
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

        <nav className="mt-4 px-3 flex-1 overflow-y-auto">
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
                  className={`w-full justify-start text-white hover:bg-[#0A4A50] ${
                    isActive ? "bg-[#0A4A50] text-white" : ""
                  }`}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1a3258]">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#0D1F3C] text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400">Hospital Admin</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full cursor-pointer hover:text-red-800 text-red-700"
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
              <h1 className="text-xl font-serif font-semibold text-[#0D1F3C]">
                Hospital Portal
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
