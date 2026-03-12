"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  CreditCard,
  Clock,
  Activity,
  Shield,
  ShieldCheck,
  Inbox,
  Building2,
  FolderOpen,
} from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user?.id) {
      fetchUserPermissions();
    }
  }, [user?.id]);

  const fetchUserPermissions = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/admin/user-permissions?userId=${user.id}`);
      const data = await response.json();
      setUserPermissions(data.permissions || []);
    } catch (error) {
      console.error("Failed to fetch user permissions:", error);
    }
  };

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

  const getNavigationItems = () => {
    const items = [];
    
    if (user.role === UserRole.SECRETARIAT || user.role === UserRole.SUPERADMIN) {
      items.push({ name: "Dashboard", href: "/admin", icon: Home });
      
      items.push({ name: "Members", href: "/admin/users", icon: Users });
      items.push({ name: "Credentials", href: "/admin/credentials", icon: ShieldCheck });
      items.push({ name: "Secretariat", href: "/admin/secretariat", icon: Inbox });
      items.push({ name: "Second Opinion", href: "/admin/second-opinion", icon: FileText });
      items.push({ name: "SPL Partners", href: "/admin/spl", icon: Building2 });
      items.push({ name: "Clinical Governance", href: "/admin/clinical", icon: Shield });
      items.push({ name: "EXCO", href: "/admin/exco", icon: Shield });
      items.push({ name: "Initiatives", href: "/admin/initiatives", icon: FileText });
      items.push({ name: "Appointments", href: "/admin/appointments", icon: Calendar });

      if (hasPermission('manage_admins')) {
        items.push({ name: "Manage Admins", href: "/admin/admins", icon: Shield });
      }

      if (hasPermission('manage_permissions')) {
        items.push({ name: "Permissions", href: "/admin/permissions", icon: Shield });
      }
      
      if (hasPermission('view_analytics')) {
        items.push({ name: "Analytics", href: "/admin/analytics", icon: Activity });
      }
      
      if (hasPermission('system_settings')) {
        items.push({ name: "Settings", href: "/admin/settings", icon: Settings });
      }
    } else if (user.role === UserRole.DFC_MEMBER) {
      items.push(
        { name: "Dashboard", href: "/doctor", icon: Home },
        { name: "My Cases", href: "/member/cases", icon: FileText },
        { name: "Analytics", href: "/doctor/analytics", icon: Activity },
        { name: "Schedule", href: "/doctor/schedule", icon: Clock },
        { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
        { name: "Patient Records", href: "/doctor/emr", icon: FolderOpen },
        { name: "Patients", href: "/doctor/patients", icon: Users },
        { name: "Subscription", href: "/doctor/subscription", icon: CreditCard },
        { name: "Profile", href: "/doctor/profile", icon: User }
      );
    }
    
    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary shadow-lg transform transition-transform duration-300 ease-in-out
        lg:fixed lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex items-center justify-between bg-white h-16 px-6 border-b border-blue-500">
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
            className="lg:hidden text-white hover:bg-blue-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={`w-full justify-start text-white hover:bg-blue-500 ${
                    isActive ? "bg-blue-500 text-white" : ""
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-500">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-blue-200 capitalize">
                {user.role.toLowerCase()}
              </p>
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
              <h1 className="text-xl font-semibold text-gray-900">
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <div className="text-sm text-gray-600">Welcome, {user.name}</div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
