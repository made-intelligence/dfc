import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface PermissionOption {
  id: string
  name: string
  description?: string | null
  category?: string
}

export interface EditableAdmin {
  id: string
  name: string
  phone: string | null
  role: string
}

interface EditAdminModalProps {
  admin: EditableAdmin | null
  /** Only a super admin may grant super admin. */
  canGrantSuperAdmin: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditAdminModal({ admin, canGrantSuperAdmin, onClose, onSuccess }: EditAdminModalProps) {
  const [formData, setFormData] = useState({ name: "", phone: "", role: "SECRETARIAT" })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissions, setPermissions] = useState<PermissionOption[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch("/api/admin/permissions")
      .then((r) => r.json())
      .then((data) => setPermissions(data.permissions || []))
      .catch((error) => console.error("Failed to fetch permissions:", error))
  }, [])

  // Load the admin's current permissions each time the modal opens on someone.
  useEffect(() => {
    if (!admin) return
    setFormData({ name: admin.name, phone: admin.phone ?? "", role: admin.role })
    setSelectedPermissions([])
    setLoadingDetails(true)
    let active = true
    fetch(`/api/admin/admins/${admin.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data.admin) {
          setSelectedPermissions(data.admin.permissions.map((p: { id: string }) => p.id))
        }
      })
      .catch((error) => console.error("Failed to fetch admin:", error))
      .finally(() => active && setLoadingDetails(false))
    return () => {
      active = false
    }
  }, [admin])

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, permissionIds: selectedPermissions }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update admin")
      addToast({ type: "success", title: "Admin updated", description: `${formData.name}'s access has been saved` })
      onSuccess()
      onClose()
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update admin",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!admin} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(role) => setFormData((prev) => ({ ...prev, role }))}
            >
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SECRETARIAT">Secretariat</SelectItem>
                {(canGrantSuperAdmin || formData.role === "SUPERADMIN") && (
                  <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Permissions</Label>
            {formData.role === "SUPERADMIN" && (
              <p className="text-xs text-gray-500 mb-1">Super admins have every permission regardless of these boxes.</p>
            )}
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
              {loadingDetails ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : (
                permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                      {permission.name} - {permission.description}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loadingDetails} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
