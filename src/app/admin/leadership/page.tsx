"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Linkedin,
  GripVertical,
} from "lucide-react";

interface LeadershipProfile {
  id: string;
  name: string;
  title: string;
  group: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
  linkedinUrl: string | null;
  institution: string | null;
  location: string | null;
  order: number;
  isActive: boolean;
}

const GROUPS = [
  { key: "FOUNDER", label: "Founder" },
  { key: "EXCO", label: "Executive Committee" },
  { key: "BOT", label: "Board of Trustees" },
];

const GROUP_LABEL: Record<string, string> = {
  FOUNDER: "Founder",
  EXCO: "Executive Committee",
  BOT: "Board of Trustees",
};

type FormState = {
  id: string | null;
  name: string;
  title: string;
  group: string;
  role: string;
  bio: string;
  imageUrl: string;
  linkedinUrl: string;
  institution: string;
  location: string;
  order: number;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  title: "",
  group: "BOT",
  role: "",
  bio: "",
  imageUrl: "",
  linkedinUrl: "",
  institution: "",
  location: "",
  order: 0,
  isActive: true,
};

function initialsOf(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .split(" ")
    .filter((w) => w && !/^(Dr\.?|Prof\.?|Mr\.?|Mrs\.?|Ms\.?)$/i.test(w))
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminLeadershipPage() {
  const [profiles, setProfiles] = useState<LeadershipProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leadership");
      const data = await res.json();
      if (data.profiles) setProfiles(data.profiles);
    } catch {
      setToast({ type: "error", message: "Failed to load leadership profiles." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function openAdd(group: string) {
    const count = profiles.filter((p) => p.group === group).length;
    setForm({ ...EMPTY_FORM, group, order: count });
    setShowModal(true);
  }

  function openEdit(p: LeadershipProfile) {
    setForm({
      id: p.id,
      name: p.name,
      title: p.title || "",
      group: p.group,
      role: p.role || "",
      bio: p.bio || "",
      imageUrl: p.imageUrl || "",
      linkedinUrl: p.linkedinUrl || "",
      institution: p.institution || "",
      location: p.location || "",
      order: p.order,
      isActive: p.isActive,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.title.trim() || !form.group) {
      setToast({ type: "error", message: "Name, title, and group are required." });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      group: form.group,
      role: form.role.trim() || null,
      bio: form.bio.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      linkedinUrl: form.linkedinUrl.trim() || null,
      institution: form.institution.trim() || null,
      location: form.location.trim() || null,
      order: Number(form.order) || 0,
      isActive: form.isActive,
    };
    try {
      const res = await fetch("/api/admin/leadership", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: form.id ? "Profile updated." : "Profile added." });
        setShowModal(false);
        fetchProfiles();
      } else {
        setToast({ type: "error", message: data.error || "Failed to save profile." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: LeadershipProfile) {
    try {
      const res = await fetch("/api/admin/leadership", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
      });
      if (res.ok) {
        setToast({
          type: "success",
          message: !p.isActive ? "Profile is now visible." : "Profile hidden from the public page.",
        });
        fetchProfiles();
      } else {
        setToast({ type: "error", message: "Failed to update visibility." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  async function handleDelete(p: LeadershipProfile) {
    if (!confirm(`Delete ${p.name}'s profile? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/leadership?id=${encodeURIComponent(p.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToast({ type: "success", message: "Profile deleted." });
        fetchProfiles();
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to delete." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leadership Profiles</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage the Founder, Executive Committee, and Board of Trustees shown on the public{" "}
          <a href="/about" target="_blank" rel="noopener noreferrer" className="text-[#0A6E75] hover:underline">
            About page
          </a>
          . Hidden profiles are kept but not displayed publicly.
        </p>
      </div>

      {toast && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="space-y-8">
        {GROUPS.map((group) => {
          const people = profiles
            .filter((p) => p.group === group.key)
            .sort((a, b) => a.order - b.order);
          return (
            <div key={group.key}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {group.label}{" "}
                  <span className="text-gray-400 font-normal normal-case">
                    ({people.length})
                  </span>
                </h2>
                <button
                  onClick={() => openAdd(group.key)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A6E75] hover:text-[#0A6E75]/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add to {group.label}
                </button>
              </div>

              {people.length === 0 ? (
                <div className="bg-white rounded-lg border border-dashed border-gray-200 px-6 py-8 text-center">
                  <p className="text-sm text-gray-400">No profiles in this group yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {people.map((p) => (
                    <div
                      key={p.id}
                      className={`bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-4 ${
                        p.isActive ? "" : "opacity-60"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                      <div className="w-12 h-12 rounded-lg overflow-hidden ring-1 ring-gray-200 shrink-0">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0D1F3C] to-[#0A6E75] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{initialsOf(p.name)}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          {!p.isActive && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                              Hidden
                            </span>
                          )}
                          {p.linkedinUrl && <Linkedin className="w-3.5 h-3.5 text-[#0A6E75] shrink-0" />}
                        </div>
                        {p.role && <p className="text-xs text-[#0A6E75] truncate">{p.role}</p>}
                        <p className="text-xs text-gray-400 truncate">
                          {[p.title, p.institution, p.location].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleActive(p)}
                          className="p-1.5 text-gray-400 hover:text-[#0A6E75] transition-colors"
                          title={p.isActive ? "Hide from public page" : "Show on public page"}
                        >
                          {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-[#0A6E75] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {form.id ? "Edit Profile" : `Add to ${GROUP_LABEL[form.group]}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name *">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Dr. Jane Doe"
                    className={inputClass}
                  />
                </Field>
                <Field label="Group *">
                  <select
                    value={form.group}
                    onChange={(e) => setForm({ ...form, group: e.target.value })}
                    className={inputClass}
                  >
                    {GROUPS.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Credentials / title *" hint="e.g. FRCS (Eng), FRCS (Tr & Orth), or a specialty">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="MD, FACP, FACOG"
                  className={inputClass}
                />
              </Field>

              <Field label="Role / position" hint="Shown in teal, e.g. 'Chairman, Board of Trustees'">
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Consultant Anaesthesiologist"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Institution">
                  <input
                    type="text"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    placeholder="Co-Founder & CEO, ..."
                    className={inputClass}
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Lagos, Nigeria"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Photo URL" hint="Public path (e.g. /team/oyesola.jpg) or a full https URL">
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/team/name.jpg"
                  className={inputClass}
                />
              </Field>

              <Field label="LinkedIn URL">
                <input
                  type="text"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className={inputClass}
                />
              </Field>

              <Field label="Biography" hint="Blank lines separate paragraphs in the profile modal">
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={6}
                  placeholder="Full professional biography..."
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4 items-end">
                <Field label="Display order" hint="Lower numbers appear first">
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <label className="flex items-center gap-2 pb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
                  />
                  <span className="text-sm text-gray-700">Visible on public page</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : form.id ? "Save changes" : "Add profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-[#0A6E75]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
