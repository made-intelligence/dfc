"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "@/lib/navigation";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Menu,
  X,
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  User,
  Clock,
  Activity,
  Shield,
  ShieldCheck,
  Inbox,
  Building2,
  FolderOpen,
  MessageSquare,
  Award,
  Stethoscope,
  CalendarDays,
  Landmark,
  Gavel,
  Lightbulb,
  UserCog,
  KeyRound,
  Pill,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useSidebarCollapsed } from "@/lib/sidebar-collapse";
import { useClosedSidebarSections } from "@/lib/sidebar-sections";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Sidebar group heading; items sharing one are rendered together. */
  section?: string;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop only: shrink the sidebar to an icon rail.
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const { closed: closedSections, toggle: toggleSection } = useClosedSidebarSections();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
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
    const userId = user?.id;
    if (!userId) return;
    let active = true;
    fetch(`/api/admin/user-permissions?userId=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        if (active) setUserPermissions(data.permissions || []);
      })
      .catch((error) => console.error("Failed to fetch user permissions:", error));
    return () => {
      active = false;
    };
  }, [user?.id]);

  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission) || user?.role === 'SUPERADMIN';
  };

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

  const getNavigationItems = (): NavItem[] => {
    const items: NavItem[] = [];

    if (user.role === UserRole.SECRETARIAT || user.role === UserRole.SUPERADMIN) {
      // Grouped into sections: a flat list of nineteen links made items like
      // Events effectively unfindable. Each icon is distinct so the rail stays
      // scannable when collapsed to icons on narrow screens.
      items.push({ section: "Overview", name: "Dashboard", href: "/admin", icon: Home });

      items.push({ section: "Membership", name: "Members", href: "/admin/users", icon: Users });
      items.push({ section: "Membership", name: "Doctors", href: "/admin/doctors", icon: Stethoscope });
      items.push({ section: "Membership", name: "Credentials", href: "/admin/credentials", icon: ShieldCheck });

      items.push({ section: "Governance", name: "EXCO", href: "/admin/exco", icon: Landmark });
      items.push({ section: "Governance", name: "Committees", href: "/admin/committees", icon: Gavel });
      items.push({ section: "Governance", name: "Leadership", href: "/admin/leadership", icon: Award });
      items.push({ section: "Governance", name: "Initiatives", href: "/admin/initiatives", icon: Lightbulb });

      items.push({ section: "Clinical", name: "Second Opinion", href: "/admin/second-opinion", icon: FileText });
      items.push({ section: "Clinical", name: "Clinical Governance", href: "/admin/clinical", icon: Shield });
      items.push({ section: "Clinical", name: "Appointments", href: "/admin/appointments", icon: Calendar });
      items.push({ section: "Clinical", name: "Pharmacies", href: "/admin/pharmacies", icon: Pill });

      items.push({ section: "Outreach", name: "Events", href: "/admin/events", icon: CalendarDays });
      items.push({ section: "Outreach", name: "SPL Partners", href: "/admin/spl", icon: Building2 });
      items.push({ section: "Outreach", name: "Secretariat", href: "/admin/secretariat", icon: Inbox });

      if (hasPermission('view_analytics')) {
        items.push({ section: "System", name: "Analytics", href: "/admin/analytics", icon: Activity });
      }
      if (hasPermission('manage_admins')) {
        items.push({ section: "System", name: "Manage Admins", href: "/admin/admins", icon: UserCog });
      }
      if (hasPermission('manage_permissions')) {
        items.push({ section: "System", name: "Permissions", href: "/admin/permissions", icon: KeyRound });
      }
      if (hasPermission('system_settings')) {
        items.push({ section: "System", name: "Settings", href: "/admin/settings", icon: Settings });
      }
      if (user.role === UserRole.SUPERADMIN) {
        items.push({ section: "System", name: "Audit Log", href: "/admin/audit-logs", icon: ScrollText });
      }
      items.push({ section: "System", name: "Beta Feedback", href: "/admin/beta-feedback", icon: MessageSquare });

      items.push({ section: "Account", name: "My Profile", href: "/admin/profile", icon: User });
    } else if (user.role === UserRole.DFC_MEMBER) {
      items.push(
        { section: "Overview", name: "Dashboard", href: "/doctor", icon: Home },
        { section: "Overview", name: "Analytics", href: "/doctor/analytics", icon: Activity },

        { section: "Clinical", name: "My Cases", href: "/doctor/cases", icon: FileText },
        { section: "Clinical", name: "Patient Records", href: "/doctor/emr", icon: FolderOpen },
        { section: "Clinical", name: "Patients", href: "/doctor/patients", icon: Users },
        { section: "Clinical", name: "Appointments", href: "/doctor/appointments", icon: Calendar },
        { section: "Clinical", name: "Schedule", href: "/doctor/schedule", icon: Clock },

        { section: "Account", name: "Profile", href: "/doctor/profile", icon: User },
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  // Consecutive items sharing a section become one collapsible group.
  const navigationSections: { section?: string; items: NavItem[] }[] = [];
  for (const item of navigationItems) {
    const last = navigationSections[navigationSections.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else navigationSections.push({ section: item.section, items: [item] });
  }

  const isActiveItem = (item: NavItem) =>
    pathname === item.href ||
    (item.href !== "/admin" && item.href !== "/doctor" && pathname.startsWith(item.href + "/"));

  const profileHref =
    user.role === UserRole.DFC_MEMBER ? "/doctor/profile" : "/admin/profile";

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
            className="lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className={`mt-6 px-3 pb-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain ${collapsed ? "lg:px-2" : ""}`}>
          <div className="space-y-1">
            {navigationSections.map((group, groupIndex) => {
              const isClosed = !!group.section && closedSections.includes(group.section);
              const holdsActive = group.items.some(isActiveItem);
              const listId = `sidebar-section-${groupIndex}`;
              return (
                <div key={group.section ?? groupIndex}>
                  {group.section && (
                    <button
                      type="button"
                      onClick={() => toggleSection(group.section!)}
                      aria-expanded={!isClosed}
                      aria-controls={listId}
                      className={`group flex w-full items-center justify-between rounded px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 hover:text-white/60 ${
                        groupIndex === 0 ? "pt-1" : "pt-4"
                      } ${collapsed ? "lg:hidden" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        {group.section}
                        {/* The page you're on is tucked inside a closed section. */}
                        {isClosed && holdsActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden />
                        )}
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${isClosed ? "-rotate-90" : ""}`}
                        aria-hidden
                      />
                    </button>
                  )}
                  {/* Collapsed: a thin rule stands in for the section heading. */}
                  {group.section && collapsed && groupIndex > 0 && (
                    <div className="hidden lg:block mx-2 my-3 border-t border-white/15" />
                  )}
                  {/* The icon rail has no headings to reopen a section from, so it always lists everything. */}
                  <div
                    id={listId}
                    className={`space-y-1 ${isClosed ? (collapsed ? "hidden lg:block" : "hidden") : ""}`}
                  >
                    {group.items.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        title={collapsed ? item.name : undefined}
                        aria-label={item.name}
                        className={`w-full justify-start hover:bg-white/10 hover:text-white ${
                          isActiveItem(item) ? "bg-white/10 text-white" : "text-white/70"
                        } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                        onClick={() => {
                          router.push(item.href);
                          setSidebarOpen(false);
                        }}
                      >
                        <item.icon className={`mr-3 h-5 w-5 shrink-0 ${collapsed ? "lg:mr-0" : ""}`} />
                        <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <div className={`shrink-0 p-4 border-t border-white/10 ${collapsed ? "lg:px-2" : ""}`}>
          <button
            type="button"
            onClick={() => {
              router.push(profileHref);
              setSidebarOpen(false);
            }}
            aria-label="Profile settings"
            className={`flex w-full items-center mb-3 rounded-md p-1 text-left cursor-pointer hover:bg-white/10 ${collapsed ? "lg:justify-center" : ""}`}
          >
            <div className="flex-shrink-0" title={collapsed ? `${user.name} (${user.email})` : undefined}>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#0D1F3C] text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className={`ml-3 min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
              <p className="text-xs text-white/40 capitalize">
                {user.role.toLowerCase()}
              </p>
            </div>
          </button>
          <Button
            variant="outline"
            size="sm"
            className={`w-full cursor-pointer hover:text-red-800 text-red-700 ${collapsed ? "lg:px-0" : ""}`}
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
              <h1 className="text-xl font-semibold text-gray-900">
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <div className="text-right text-sm leading-tight">
                <div className="text-gray-900 font-medium">{user.name}</div>
                <div className="text-gray-500 text-xs">{user.email}</div>
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
