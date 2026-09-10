"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Star,
  Calendar,
  MapPin,
  Video,
} from "lucide-react";

interface DFCEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  isVirtual: boolean;
  virtualLink: string | null;
  imageUrl: string | null;
  registrationUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
}

const EVENT_TYPES = ["GENERAL", "CONFERENCE", "OUTREACH", "WEBINAR", "AGM", "CAMP"];

const TYPE_STYLES: Record<string, string> = {
  GENERAL: "bg-gray-100 text-gray-700",
  CONFERENCE: "bg-[#0D1F3C] text-white",
  OUTREACH: "bg-emerald-100 text-emerald-800",
  WEBINAR: "bg-[#0A6E75]/10 text-[#0A6E75]",
  AGM: "bg-amber-100 text-amber-800",
  CAMP: "bg-blue-100 text-blue-800",
};

type FormState = {
  id: string | null;
  title: string;
  description: string;
  type: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  city: string;
  isVirtual: boolean;
  virtualLink: string;
  imageUrl: string;
  registrationUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  type: "GENERAL",
  date: "",
  endDate: "",
  time: "",
  location: "",
  city: "",
  isVirtual: false,
  virtualLink: "",
  imageUrl: "",
  registrationUrl: "",
  isPublished: false,
  isFeatured: false,
};

// A DateTime -> value for <input type="date">
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<DFCEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch {
      setToast({ type: "error", message: "Failed to load events." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(e: DFCEvent) {
    setForm({
      id: e.id,
      title: e.title,
      description: e.description || "",
      type: e.type,
      date: toDateInput(e.date),
      endDate: toDateInput(e.endDate),
      time: e.time || "",
      location: e.location || "",
      city: e.city || "",
      isVirtual: e.isVirtual,
      virtualLink: e.virtualLink || "",
      imageUrl: e.imageUrl || "",
      registrationUrl: e.registrationUrl || "",
      isPublished: e.isPublished,
      isFeatured: e.isFeatured,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) {
      setToast({ type: "error", message: "Title and date are required." });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      date: form.date,
      endDate: form.endDate || null,
      time: form.time.trim() || null,
      location: form.location.trim() || null,
      city: form.city.trim() || null,
      isVirtual: form.isVirtual,
      virtualLink: form.virtualLink.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      registrationUrl: form.registrationUrl.trim() || null,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
    };
    try {
      const res = await fetch("/api/admin/events", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: form.id ? "Event updated." : "Event created." });
        setShowModal(false);
        fetchEvents();
      } else {
        setToast({ type: "error", message: data.error || "Failed to save event." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function patchFlag(e: DFCEvent, field: "isPublished" | "isFeatured", value: boolean) {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: e.id, [field]: value }),
      });
      if (res.ok) {
        fetchEvents();
      } else {
        setToast({ type: "error", message: "Failed to update event." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  async function handleDelete(e: DFCEvent) {
    if (!confirm(`Delete "${e.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${encodeURIComponent(e.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToast({ type: "success", message: "Event deleted." });
        fetchEvents();
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
          <div key={i} className="h-20 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now);
  const past = events.filter((e) => new Date(e.date).getTime() < now);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage events shown on the public{" "}
            <a href="/events" target="_blank" rel="noopener noreferrer" className="text-[#0A6E75] hover:underline">
              Events page
            </a>
            . Only published events are visible to the public.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New event
        </button>
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

      {events.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-200 px-6 py-12 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No events yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { label: "Upcoming", list: upcoming },
            { label: "Past", list: past },
          ]
            .filter((s) => s.list.length > 0)
            .map((section) => (
              <div key={section.label}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  {section.label}{" "}
                  <span className="text-gray-400 font-normal normal-case">({section.list.length})</span>
                </h2>
                <div className="space-y-2">
                  {section.list.map((e) => (
                    <div
                      key={e.id}
                      className={`bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-4 ${
                        e.isPublished ? "" : "opacity-70"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-gray-200 shrink-0 bg-gray-50">
                        {e.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={e.imageUrl}
                            alt={e.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              TYPE_STYLES[e.type] || TYPE_STYLES.GENERAL
                            }`}
                          >
                            {e.type}
                          </span>
                          {e.isFeatured && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                            </span>
                          )}
                          {!e.isPublished && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Draft</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(e.date)}
                            {e.time ? `, ${e.time}` : ""}
                          </span>
                          {e.isVirtual ? (
                            <span className="inline-flex items-center gap-1">
                              <Video className="w-3 h-3" /> Virtual
                            </span>
                          ) : (
                            (e.location || e.city) && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {[e.location, e.city].filter(Boolean).join(", ")}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => patchFlag(e, "isFeatured", !e.isFeatured)}
                          className={`p-1.5 transition-colors ${
                            e.isFeatured ? "text-amber-500 hover:text-amber-600" : "text-gray-300 hover:text-amber-500"
                          }`}
                          title={e.isFeatured ? "Unfeature" : "Feature"}
                        >
                          <Star className={`w-4 h-4 ${e.isFeatured ? "fill-amber-500" : ""}`} />
                        </button>
                        <button
                          onClick={() => patchFlag(e, "isPublished", !e.isPublished)}
                          className="p-1.5 text-gray-400 hover:text-[#0A6E75] transition-colors"
                          title={e.isPublished ? "Unpublish" : "Publish"}
                        >
                          {e.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 text-gray-400 hover:text-[#0A6E75] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {form.id ? "Edit event" : "New event"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label="Title *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="DFC Annual General Meeting 2026"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputClass}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Time" hint="Free text, e.g. 10:00 AM WAT">
                  <input
                    type="text"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    placeholder="10:00 AM WAT"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date *">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="End date" hint="Optional, for multi-day events">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="What the event is about..."
                  className={inputClass}
                />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isVirtual}
                  onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
                />
                <span className="text-sm text-gray-700">This is a virtual event</span>
              </label>

              {form.isVirtual ? (
                <Field label="Virtual link">
                  <input
                    type="text"
                    value={form.virtualLink}
                    onChange={(e) => setForm({ ...form, virtualLink: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    className={inputClass}
                  />
                </Field>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Location / venue">
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Eko Hotel"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Lagos"
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              <Field label="Cover image URL">
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/events/agm.jpg or https://..."
                  className={inputClass}
                />
              </Field>

              <Field label="Registration URL" hint="Where attendees sign up (optional)">
                <input
                  type="text"
                  value={form.registrationUrl}
                  onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
                  />
                  <span className="text-sm text-gray-700">Published (visible to public)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
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
                {saving ? "Saving..." : form.id ? "Save changes" : "Create event"}
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
