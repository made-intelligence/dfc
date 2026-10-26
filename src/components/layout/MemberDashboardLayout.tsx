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
  User,
  CreditCard,
  FileText,
  Users,
  Calendar,
  Clock,
  Activity,
  Stethoscope,
  FolderOpen,
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AccountMenu } from "./AccountMenu";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { getCategoryLabel } from "@/lib/utils/member";
import { useSidebarCollapsed } from "@/lib/sidebar-collapse";

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

  const navButton = (item: { href: string; label: string; icon: LucideIcon }, isActive: boolean, badge?: boolean) => (
    <Button
      key={item.href}
      variant="ghost"
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={`relative w-full justify-start text-white hover:bg-white/10 ${
        isActive ? "bg-white/10 text-white" : "text-white/70"
      } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
      onClick={() => {
        router.push(item.href);
        setSidebarOpen(false);
      }}
    >
      <item.icon className={`mr-3 h-4 w-4 shrink-0 ${collapsed ? "lg:mr-0" : ""}`} />
      <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
      {badge && (
        <span
          className={`ml-auto w-2 h-2 rounded-full bg-amber-400 ${
            collapsed ? "lg:absolute lg:top-1.5 lg:right-1.5 lg:ml-0" : ""
          }`}
        />
      )}
    </Button>
  );

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
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1F3C] shadow-lg transform transition-[transform,width] duration-300 ease-in-out
        flex flex-col
        lg:fixed lg:translate-x-0
        ${collapsed ? "lg:w-16" : ""}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className={`flex items-center justify-between bg-white h-16 px-6 border-b border-gray-200 shrink-0 ${collapsed ? "lg:px-0 lg:justify-center" : ""}`}>
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
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className={`mt-4 px-3 pb-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain ${collapsed ? "lg:px-2" : ""}`}>
          {/* Member nav */}
          <p className={`px-3 mb-2 text-[10px] uppercase tracking-widest text-white/30 font-semibold ${collapsed ? "lg:hidden" : ""}`}>
            Membership
          </p>
          <div className="space-y-1">
            {navItems.map((item) =>
              navButton(
                item,
                pathname === item.href || (item.href !== "/member" && pathname.startsWith(item.href)),
                item.href === "/member/dues" && showDuesWarning
              )
            )}
          </div>

          {/* Clinical nav */}
          {collapsed && <div className="hidden lg:block mx-2 my-4 border-t border-white/15" />}
          <div className={`mt-6 mb-2 px-3 flex items-center justify-between ${collapsed ? "lg:hidden" : ""}`}>
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
            {clinicalItems.map((item) =>
              navButton(item, pathname === item.href || pathname.startsWith(item.href + "/"))
            )}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div ref={mainRef} className={`flex-1 min-w-0 h-dvh overflow-y-auto transition-[margin] duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
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
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <AccountMenu
                name={user.name}
                email={user.email}
                subtitle={categoryLabel}
                profileHref="/member/profile"
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
