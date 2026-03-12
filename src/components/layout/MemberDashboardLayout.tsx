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
  User,
  CreditCard,
  FileText,
  Users,
  LogOut,
  Calendar,
  Clock,
  Activity,
  Stethoscope,
  FolderOpen,
  ArrowLeftRight,
} from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { getCategoryLabel } from "@/lib/utils/member";

interface MemberDashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/member", label: "Dashboard", icon: Home },
  { href: "/member/profile", label: "My Profile", icon: User },
  { href: "/member/dues", label: "Membership & Dues", icon: CreditCard },
  { href: "/member/secretariat", label: "Secretariat Requests", icon: FileText },
  { href: "/member/initiatives", label: "My Committees", icon: Users },
];

const clinicalItems = [
  { href: "/doctor", label: "Clinical Dashboard", icon: Stethoscope },
  { href: "/doctor/emr", label: "Patient Records", icon: FolderOpen },
  { href: "/doctor/schedule", label: "Schedule", icon: Clock },
  { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
  { href: "/doctor/analytics", label: "Analytics", icon: Activity },
];

export function MemberDashboardLayout({ children }: MemberDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  const categoryLabel = user.dfcMember
    ? getCategoryLabel(user.dfcMember.category)
    : "Member";

  const showDuesWarning = user.dfcMember?.goodStanding === false;

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
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1F3C] shadow-lg transform transition-transform duration-300 ease-in-out
        lg:fixed lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex items-center justify-between bg-white h-16 px-6 border-b border-gray-200">
          <Image
            src="/dfc-logo.png"
            alt="DFC"
            width={120}
            height={44}
            className="h-10 w-auto"
          />
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Member info */}
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-white/50 mt-0.5">{categoryLabel}</p>
        </div>

        <nav className="mt-4 px-3 flex-1 overflow-y-auto">
          {/* Member nav */}
          <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
            Membership
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/member" && pathname.startsWith(item.href));
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`w-full justify-start text-white hover:bg-white/10 ${
                    isActive ? "bg-white/10 text-white" : "text-white/70"
                  }`}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                  {item.href === "/member/dues" && showDuesWarning && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Clinical nav */}
          <div className="mt-6 mb-2 px-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">
              Clinical
            </p>
            <button
              onClick={() => {
                router.push("/doctor");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-1 text-[10px] text-[#0A6E75] hover:text-[#0A6E75]/80 font-medium"
            >
              <ArrowLeftRight className="h-3 w-3" />
              Full view
            </button>
          </div>
          <div className="space-y-1">
            {clinicalItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`w-full justify-start text-white hover:bg-white/10 ${
                    isActive ? "bg-white/10 text-white" : "text-white/70"
                  }`}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
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
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <div className="text-sm text-gray-600 hidden sm:block">
                {user.name}
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
