"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddAdminModal } from "@/components/admin/AddAdminModal";
import { EditAdminModal } from "@/components/admin/EditAdminModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  MoreVertical,
  Pencil,
  UserX,
  UserCheck,
  Send,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading";
import { FilterChips } from "@/components/admin/ListControls";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";

type RoleFilter = "" | "SUPERADMIN" | "SECRETARIAT";
type StatusFilter = "" | "active" | "inactive" | "pending";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "SUPERADMIN", label: "Super admins" },
  { value: "SECRETARIAT", label: "Secretariat" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Deactivated" },
  { value: "pending", label: "Not activated" },
];

interface AdminData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  pendingActivation: boolean;
  createdAt: string;
}

type AdminAction = "deactivate" | "reactivate" | "resend_invite";

interface AdminsResponse {
  admins: AdminData[];
  stats: {
    totalAdmins: number;
    activeAdmins: number;
    superAdmins: number;
    newThisMonth: number;
  };
}

export default function AdminsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    superAdmins: 0,
    newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [editing, setEditing] = useState<AdminData | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<AdminData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const runAction = async (admin: AdminData, action: AdminAction) => {
    setBusyId(admin.id);
    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");
      addToast({ type: "success", title: "Done", description: data.message });
      fetchAdmins();
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
      });
    } finally {
      setBusyId(null);
    }
  };

  const visibleAdmins = admins.filter(
    (a) =>
      (!roleFilter || a.role === roleFilter) &&
      (!statusFilter ||
        (statusFilter === "active" && a.isActive && !a.pendingActivation) ||
        (statusFilter === "inactive" && !a.isActive) ||
        (statusFilter === "pending" && a.isActive && a.pendingActivation))
  );

  useEffect(() => {
    fetchAdmins();
  }, [searchTerm]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/admins?${params}`);
      const data: AdminsResponse = await response.json();

      setAdmins(data.admins);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Admins</h1>
          <p className="mt-1 text-sm text-gray-500">Platform administrators and secretariat staff</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Admins</p>
                <p className="text-2xl font-bold">{stats.totalAdmins}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Admins</p>
                <p className="text-2xl font-bold">{stats.activeAdmins}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold">{stats.superAdmins}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <CardTitle>All Administrators</CardTitle>
              <FilterChips options={ROLE_OPTIONS} value={roleFilter} onChange={setRoleFilter} />
              <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="space-y-4">
              {visibleAdmins.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-500">No admins match these filters.</p>
              )}
              {visibleAdmins.map((admin) => {
                const isSelf = admin.id === user?.id;
                // Mirrors the API: only a super admin can act on a super admin.
                const canManage = isSuperAdmin || admin.role !== "SUPERADMIN";
                return (
                <div
                  key={admin.id}
                  className={`flex items-center justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 ${
                    admin.isActive ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 bg-[#0D1F3C]/10 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[#0D1F3C]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{admin.name}</h3>
                        <Badge
                          variant={
                            admin.role === "SUPERADMIN"
                              ? "default"
                              : "secondary"
                          }
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {admin.role}
                        </Badge>
                        {!admin.isActive ? (
                          <Badge variant="destructive">deactivated</Badge>
                        ) : admin.pendingActivation ? (
                          <Badge variant="outline">not activated</Badge>
                        ) : (
                          <Badge variant="default">active</Badge>
                        )}
                        {isSelf && <Badge variant="outline">you</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                        {admin.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {admin.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined{" "}
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  {canManage && !isSelf && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Actions for ${admin.name}`}
                          disabled={busyId === admin.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(admin)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit role & permissions
                        </DropdownMenuItem>
                        {admin.pendingActivation && admin.isActive && (
                          <DropdownMenuItem onSelect={() => runAction(admin, "resend_invite")}>
                            <Send className="h-4 w-4 mr-2" />
                            Resend activation email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {admin.isActive ? (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onSelect={() => setConfirmDeactivate(admin)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => runAction(admin, "reactivate")}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddAdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchAdmins}
      />

      <EditAdminModal
        admin={editing}
        canGrantSuperAdmin={isSuperAdmin}
        onClose={() => setEditing(null)}
        onSuccess={fetchAdmins}
      />

      <AlertDialog open={!!confirmDeactivate} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {confirmDeactivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be signed out and won&apos;t be able to sign in until an admin reactivates them. Their
              records and history are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (confirmDeactivate) runAction(confirmDeactivate, "deactivate");
                setConfirmDeactivate(null);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
