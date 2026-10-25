"use client";

import { useCallback, useEffect, useState } from "react";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton } from "@/components/ui/loading";
import { Copy, KeyRound, Pill, Plus, Search } from "lucide-react";
import { formatInstantWat } from "@/lib/wat";

interface Pharmacy {
  id: string;
  name: string;
  chain: string | null;
  address: string;
  city: string;
  phone: string;
  email: string | null;
  type: string;
  onlineOrderUrl: string | null;
  apiEndpoint: string | null;
  isActive: boolean;
  apiKeyPrefix: string | null;
  apiKeyIssuedAt: string | null;
  _count: { dispensingLogs: number };
}

type FormState = {
  name: string;
  chain: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  type: string;
  onlineOrderUrl: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  chain: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  type: "PHYSICAL",
  onlineOrderUrl: "",
};

const TYPE_LABELS: Record<string, string> = {
  PHYSICAL: "Physical",
  ONLINE: "Online",
  BOTH: "Physical + online",
};

const selectClass = "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-base";

export default function PharmaciesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN;
  const { addToast } = useToast();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<Pharmacy | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [issuedKey, setIssuedKey] = useState<{ pharmacy: string; key: string } | null>(null);

  const fetchPharmacies = useCallback(async () => {
    setLoading(true);
    try {
      const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/admin/pharmacies${params}`);
      const data = await res.json();
      setPharmacies(data.pharmacies ?? []);
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchPharmacies, 250);
    return () => clearTimeout(timer);
  }, [fetchPharmacies]);

  const openForm = (pharmacy: Pharmacy | "new") => {
    setForm(
      pharmacy === "new"
        ? EMPTY_FORM
        : {
            name: pharmacy.name,
            chain: pharmacy.chain ?? "",
            address: pharmacy.address,
            city: pharmacy.city,
            phone: pharmacy.phone,
            email: pharmacy.email ?? "",
            type: pharmacy.type,
            onlineOrderUrl: pharmacy.onlineOrderUrl ?? "",
          },
    );
    setEditing(pharmacy);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(
        editing === "new" ? "/api/admin/pharmacies" : `/api/admin/pharmacies/${editing.id}`,
        {
          method: editing === "new" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast({ type: "error", title: "Couldn't save the pharmacy", description: data.error });
        return;
      }
      addToast({ type: "success", title: editing === "new" ? "Pharmacy added" : "Pharmacy updated" });
      setEditing(null);
      fetchPharmacies();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pharmacy: Pharmacy) => {
    if (
      pharmacy.isActive &&
      !window.confirm(`Deactivate ${pharmacy.name}? Its API key stops working until it is reactivated.`)
    ) {
      return;
    }
    setBusy(pharmacy.id);
    try {
      const res = await fetch(`/api/admin/pharmacies/${pharmacy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pharmacy.isActive }),
      });
      if (!res.ok) {
        addToast({ type: "error", title: "Couldn't update the pharmacy" });
        return;
      }
      fetchPharmacies();
    } finally {
      setBusy(null);
    }
  };

  const issueKey = async (pharmacy: Pharmacy) => {
    if (
      pharmacy.apiKeyPrefix &&
      !window.confirm(`Issue a new key for ${pharmacy.name}? The current key stops working immediately.`)
    ) {
      return;
    }
    setBusy(pharmacy.id);
    try {
      const res = await fetch(`/api/admin/pharmacies/${pharmacy.id}/key`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast({ type: "error", title: "Couldn't issue a key", description: data.error });
        return;
      }
      setIssuedKey({ pharmacy: pharmacy.name, key: data.key });
      fetchPharmacies();
    } finally {
      setBusy(null);
    }
  };

  const revokeKey = async (pharmacy: Pharmacy) => {
    if (!window.confirm(`Revoke ${pharmacy.name}'s API key? Their system stops working until a new key is issued.`)) {
      return;
    }
    setBusy(pharmacy.id);
    try {
      const res = await fetch(`/api/admin/pharmacies/${pharmacy.id}/key`, { method: "DELETE" });
      if (!res.ok) {
        addToast({ type: "error", title: "Couldn't revoke the key" });
        return;
      }
      addToast({ type: "success", title: "Key revoked" });
      fetchPharmacies();
    } finally {
      setBusy(null);
    }
  };

  const copyKey = async () => {
    if (!issuedKey) return;
    try {
      await navigator.clipboard.writeText(issuedKey.key);
      addToast({ type: "success", title: "Key copied" });
    } catch {
      addToast({ type: "error", title: "Couldn't copy. Select the key and copy it manually." });
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Partner Pharmacies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pharmacies that look up and dispense DFC prescriptions. Each one calls the prescription API with
            its own key, and every lookup and dispense is in the audit log.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => openForm("new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add pharmacy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <CardTitle>Pharmacies</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name, chain or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={4} />
          ) : pharmacies.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              {search ? "No pharmacies match." : "No partner pharmacies yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {pharmacies.map((p) => (
                <div
                  key={p.id}
                  className={`flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between ${
                    p.isActive ? "" : "bg-gray-50 opacity-75"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A6E75]/10">
                      <Pill className="h-5 w-5 text-[#0A6E75]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{p.name}</h3>
                        {p.chain && <Badge variant="outline">{p.chain}</Badge>}
                        <Badge variant="outline">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                        {!p.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">
                        {p.address}, {p.city} · {p.phone}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <KeyRound className="h-3 w-3" />
                          {p.apiKeyPrefix ? (
                            <>
                              <span className="font-mono">{p.apiKeyPrefix}…</span>
                              {p.apiKeyIssuedAt && <span>issued {formatInstantWat(p.apiKeyIssuedAt)}</span>}
                            </>
                          ) : (
                            "No API key"
                          )}
                        </span>
                        <span>{p._count.dispensingLogs} dispensed</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openForm(p)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => toggleActive(p)}>
                      {p.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    {isSuperAdmin && (
                      <>
                        <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => issueKey(p)}>
                          {p.apiKeyPrefix ? "Rotate key" : "Issue key"}
                        </Button>
                        {p.apiKeyPrefix && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            disabled={busy === p.id}
                            onClick={() => revokeKey(p)}
                          >
                            Revoke key
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isSuperAdmin && !loading && pharmacies.length > 0 && (
            <p className="mt-4 text-xs text-gray-500">Only super admins can issue or revoke API keys.</p>
          )}
        </CardContent>
      </Card>

      {/* Add / edit */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add pharmacy" : "Edit pharmacy"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="Healthplus Victoria Island"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Chain (optional)</Label>
                <Input
                  placeholder="Healthplus, Medplus, Independent"
                  value={form.chain}
                  onChange={(e) => setForm({ ...form, chain: e.target.value })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className={selectClass}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            {form.type !== "PHYSICAL" && (
              <div>
                <Label>Online order URL (optional)</Label>
                <Input
                  type="url"
                  value={form.onlineOrderUrl}
                  onChange={(e) => setForm({ ...form, onlineOrderUrl: e.target.value })}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* A newly issued key: shown once */}
      <Dialog open={!!issuedKey} onOpenChange={(open) => !open && setIssuedKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>API key for {issuedKey?.pharmacy}</DialogTitle>
            <DialogDescription>
              Copy it now and send it to the pharmacy securely. It won&apos;t be shown again; if it&apos;s lost,
              issue a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md bg-gray-100 px-3 py-2 text-sm">
                {issuedKey?.key}
              </code>
              <Button size="sm" variant="outline" onClick={copyKey} aria-label="Copy key">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-md border bg-gray-50 p-3 text-xs text-gray-600">
              <p className="mb-1 font-medium text-gray-700">For the pharmacy&apos;s developers</p>
              <p>Send the key in the <code>x-api-key</code> header.</p>
              <p>
                Look up: <code>GET {origin}/api/pharmacy/rx/&#123;rxNumber&#125;</code>
              </p>
              <p>
                Dispense: <code>POST {origin}/api/pharmacy/rx/&#123;rxNumber&#125;/dispense</code> with{" "}
                <code>{`{ "itemsDispensed": [{ "drugName": "..." }], "dispensedBy": "...", "notes": "..." }`}</code>
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIssuedKey(null)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
