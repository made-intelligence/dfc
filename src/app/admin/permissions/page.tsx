"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Shield, Plus, Edit, Trash2, Loader2, Lock } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { BUILT_IN_PERMISSIONS } from "@/lib/permission-names";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general"
  });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [editForm, setEditForm] = useState({ description: "", category: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/permissions");
      const data = await response.json();
      setPermissions(data.permissions);
      setGroupedPermissions(data.groupedPermissions);
    } catch {
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to fetch permissions"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        addToast({
          type: "success",
          title: "Permission Created",
          description: `${formData.name} permission has been created`
        });
        setFormData({ name: "", description: "", category: "general" });
        setShowAddModal(false);
        fetchPermissions();
      } else {
        addToast({
          type: "error",
          title: "Error",
          description: result.error || "Failed to create permission"
        });
      }
    } catch {
      addToast({
        type: "error",
        title: "Error",
        description: "Network error occurred"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (permission: Permission) => {
    setEditing(permission);
    setEditForm({ description: permission.description ?? "", category: permission.category });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      const response = await fetch(`/api/admin/permissions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Failed to update permission");
      addToast({ type: "success", title: "Permission Updated", description: editing.name });
      setEditing(null);
      fetchPermissions();
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update permission",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Delete the "${permission.name}" permission? Any admin who has it will lose it.`)) return;
    setDeleting(permission.id);
    try {
      const response = await fetch(`/api/admin/permissions/${permission.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Failed to delete permission");
      addToast({ type: "success", title: "Permission Deleted", description: permission.name });
      fetchPermissions();
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete permission",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      user_management: "bg-blue-100 text-blue-800",
      admin_management: "bg-purple-100 text-purple-800",
      analytics: "bg-green-100 text-green-800",
      system: "bg-red-100 text-red-800",
      general: "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return <Loading type="pulse" size="lg" className="min-h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">System permissions and access control</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Permission
        </Button>
      </div>

      <div className="grid gap-6">
        {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {category.replace(/_/g, " ").toUpperCase()}
                <Badge variant="secondary">{categoryPermissions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{permission.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(permission)}
                          aria-label={`Edit ${permission.name}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {BUILT_IN_PERMISSIONS.has(permission.name) ? (
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center text-gray-300"
                            title="Used by the application; cannot be deleted"
                          >
                            <Lock className="h-3 w-3" />
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(permission)}
                            disabled={deleting === permission.id}
                            aria-label={`Delete ${permission.name}`}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deleting === permission.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{permission.description}</p>
                    <Badge className={getCategoryColor(permission.category)}>
                      {permission.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditing(null)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit} className="flex-1">
                {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Permission Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., manage_reports"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this permission allows"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., user_management, analytics"
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Permission
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}