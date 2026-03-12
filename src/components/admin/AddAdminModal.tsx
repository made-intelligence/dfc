import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface AddAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddAdminModal({ isOpen, onClose, onSuccess }: AddAdminModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "SECRETARIAT"
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/admin/permissions")
      const data = await response.json()
      setPermissions(data.permissions || [])
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
    }
  }

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role }))
    // Auto-select default permissions based on role
    if (role === "SUPERADMIN") {
      const allPermissionIds = permissions.map(p => p.id)
      setSelectedPermissions(allPermissionIds)
    } else {
      // For regular admins, exclude admin_management and system categories
      const defaultPermissions = permissions.filter(p => 
        !['admin_management', 'system'].includes(p.category)
      ).map(p => p.id)
      setSelectedPermissions(defaultPermissions)
    }
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, permissionIds: selectedPermissions })
      })

      const result = await response.json()

      if (response.ok) {
        addToast({
          type: "success",
          title: "Admin Created",
          description: `${formData.name} has been added as ${formData.role.toLowerCase()}`
        })
        setFormData({ name: "", email: "", phone: "", role: "SECRETARIAT" })
        setSelectedPermissions([])
        onSuccess()
        onClose()
      } else {
        addToast({
          type: "error",
          title: "Error",
          description: result.error || "Failed to create admin"
        })
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "Network error occurred"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SECRETARIAT">Secretariat</SelectItem>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                  <Label htmlFor={permission.id} className="text-sm">
                    {permission.name} - {permission.description}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}