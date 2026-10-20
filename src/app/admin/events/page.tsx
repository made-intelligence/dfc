"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { FullImage } from "@/components/ui/full-image";
import { eventPath } from "@/lib/event-url";
import { bannerShowing } from "@/lib/event-banner";
import { emptyEventStats, type EventStats } from "@/lib/event-tracking-kinds";
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  X,
  Star,
  Calendar,
  MapPin,
  Video,
  Lock,
  ExternalLink,
  MousePointerClick,
  Search,
  Megaphone,
  MoreHorizontal,
  ImagePlus,
  Clock,
  ChevronDown,
  Check,
} from "lucide-react";

interface DFCEvent {
  id: string;
  slug: string;
  stats: EventStats;
  title: string;
  description: string | null;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  isVirtual: boolean;
  isInPerson: boolean;
  virtualLink: string | null;
  hideVirtualLink: boolean;
  imageUrl: string | null;
  registrationUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  showBanner: boolean;
}

const ATTENDANCE_MODES = [
  { label: "In person", inPerson: true, virtual: false },
  { label: "Virtual", inPerson: false, virtual: true },
  { label: "Hybrid", inPerson: true, virtual: true },
];

// 30-minute slots, 6:00 AM to 10:00 PM, stored as e.g. "10:00 AM WAT".
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const mins = 6 * 60 + i * 30;
  const h24 = Math.floor(mins / 60);
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(mins % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"} WAT`;
});

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
  multiDay: boolean;
  time: string;
  location: string;
  city: string;
  isVirtual: boolean;
  isInPerson: boolean;
  virtualLink: string;
  hideVirtualLink: boolean;
  imageUrl: string;
  registrationUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  showBanner: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  type: "GENERAL",
  date: "",
  endDate: "",
  multiDay: false,
  time: "",
  location: "",
  city: "",
  isVirtual: false,
  isInPerson: true,
  virtualLink: "",
  hideVirtualLink: false,
  imageUrl: "",
  registrationUrl: "",
  isPublished: false,
  isFeatured: false,
  showBanner: false,
};

// A DateTime -> value for <input type="date">
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<DFCEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // Existing events open read-only; "Edit" in the modal unlocks the fields.
  const [editing, setEditing] = useState(false);
  const [original, setOriginal] = useState<FormState>(EMPTY_FORM);
  const [viewStats, setViewStats] = useState<EventStats>(emptyEventStats());
  const viewing = !!form.id && !editing;
  // Past events are read-only (the API enforces this too).
  const ended = !!original.id && (original.multiDay && original.endDate ? original.endDate : original.date) < todayWAT();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showPast, setShowPast] = useState(false);
  // Picked cover image, held locally until save so nothing is uploaded for an
  // event that never gets created.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { addToast } = useToast();
  const notify = useCallback(
    (type: "success" | "error", message: string) =>
      addToast({ type, title: type === "success" ? "Success" : "Error", description: message }),
    [addToast],
  );

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch {
      notify("error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  function openAdd() {
    setForm(EMPTY_FORM);
    setOriginal(EMPTY_FORM);
    setEditing(true);
    setImageFile(null);
    setShowModal(true);
  }

  function openView(e: DFCEvent) {
    const loaded: FormState = {
      id: e.id,
      title: e.title,
      description: e.description || "",
      type: e.type,
      date: toDateInput(e.date),
      endDate: toDateInput(e.endDate),
      multiDay: !!e.endDate,
      time: e.time || "",
      location: e.location || "",
      city: e.city || "",
      isVirtual: e.isVirtual,
      isInPerson: e.isInPerson,
      virtualLink: e.virtualLink || "",
      hideVirtualLink: e.hideVirtualLink,
      imageUrl: e.imageUrl || "",
      registrationUrl: e.registrationUrl || "",
      isPublished: e.isPublished,
      isFeatured: e.isFeatured,
      showBanner: e.showBanner,
    };
    setForm(loaded);
    setOriginal(loaded);
    setViewStats(e.stats ?? emptyEventStats());
    setEditing(false);
    setImageFile(null);
    setShowModal(true);
  }

  // Discard unsaved edits and go back to the read-only view.
  function cancelEdit() {
    setForm(original);
    setImageFile(null);
    setEditing(false);
  }

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function pickImage(file: File) {
    if (viewing) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      notify("error", "Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify("error", "Image must be less than 5MB.");
      return;
    }
    setImageFile(file);
  }

  function removeImage() {
    setImageFile(null);
    setForm((f) => ({ ...f, imageUrl: "" }));
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) pickImage(file);
  }

  const endDateInvalid = form.multiDay && form.endDate !== "" && form.date !== "" && form.endDate <= form.date;
  const filled = (v: string) => v.trim() !== "";
  // Everything but the registration URL is required.
  const requiredFilled =
    filled(form.title) &&
    filled(form.type) &&
    filled(form.description) &&
    form.date !== "" &&
    (!form.multiDay || (form.endDate !== "" && !endDateInvalid)) &&
    filled(form.time) &&
    (!form.isInPerson || (filled(form.location) && filled(form.city))) &&
    (!form.isVirtual || filled(form.virtualLink)) &&
    (!!imageFile || filled(form.imageUrl));

  async function handleSave() {
    if (!requiredFilled) {
      notify("error", "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      date: form.date,
      // Single-day events never carry an end date.
      endDate: form.multiDay ? form.endDate || null : null,
      time: form.time.trim() || null,
      // Drop details that don't apply to the chosen attendance mode.
      location: form.isInPerson ? form.location.trim() : null,
      city: form.isInPerson ? form.city.trim() : null,
      isVirtual: form.isVirtual,
      isInPerson: form.isInPerson,
      virtualLink: form.isVirtual ? form.virtualLink.trim() : null,
      hideVirtualLink: form.hideVirtualLink,
      imageUrl: form.imageUrl.trim() || null,
      registrationUrl: form.registrationUrl.trim() || null,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      showBanner: form.showBanner,
    };
    try {
      // One request: the server uploads the image (if any) and saves the event,
      // and deletes the upload again if the save fails.
      const fd = new FormData();
      fd.append("data", JSON.stringify(form.id ? { id: form.id, ...payload } : payload));
      if (imageFile) fd.append("image", imageFile);
      const res = await fetch("/api/admin/events", {
        method: form.id ? "PUT" : "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        notify("success", form.id ? "Event updated." : "Event created.");
        setShowModal(false);
        setImageFile(null);
        fetchEvents();
      } else {
        notify("error", data.error || "Failed to save event.");
      }
    } catch {
      notify("error", "Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function patchFlag(e: DFCEvent, field: "isPublished" | "isFeatured" | "showBanner", value: boolean) {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: e.id, [field]: value }),
      });
      if (res.ok) {
        fetchEvents();
      } else {
        notify("error", "Failed to update event.");
      }
    } catch {
      notify("error", "Network error.");
    }
  }

  async function handleDelete(e: DFCEvent) {
    if (!confirm(`Delete "${e.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${encodeURIComponent(e.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notify("success", "Event deleted.");
        fetchEvents();
      } else {
        const data = await res.json();
        notify("error", data.error || "Failed to delete.");
      }
    } catch {
      notify("error", "Network error.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  const today = todayWAT();
  const q = query.trim().toLowerCase();
  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const visible = events
    .filter(activeFilter.match)
    .filter((e) => !q || [e.title, e.type, e.city, e.location].some((v) => v?.toLowerCase().includes(q)));
  const inPhase = (p: Phase) => visible.filter((e) => phaseOf(e, today) === p);
  const sections: { key: Phase; label: string; list: DFCEvent[] }[] = [
    { key: "live" as const, label: "Happening now", list: inPhase("live") },
    { key: "upcoming" as const, label: "Upcoming", list: inPhase("upcoming") },
    // Most recent first.
    { key: "past" as const, label: "Past", list: inPhase("past").reverse() },
  ].filter((sec) => sec.list.length > 0);
  // Same rule as the public banner endpoint (events arrive sorted by date).
  const bannerLive = events.filter((e) => e.showBanner && e.isPublished && bannerShowing(e));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Events</h1>
          <p className="mt-1 text-sm text-gray-500">
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


      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-14 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No events yet. Create your first one.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    filter === f.key ? "bg-[#0D1F3C] text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 text-xs ${filter === f.key ? "text-white/70" : "text-gray-400"}`}>
                    {events.filter(f.match).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {bannerLive.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-[#0A6E75]/20 bg-[#0A6E75]/5 px-4 py-3 text-sm text-[#0A4A50]">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {bannerLive.length === 1 ? (
                  <>
                    <span className="font-medium">{bannerLive[0].title}</span> is showing as the site-wide pop-up.
                  </>
                ) : (
                  <>
                    {bannerLive.length} events rotate in the site-wide pop-up (soonest first
                    {bannerLive.length > MAX_BANNER_EVENTS ? `, first ${MAX_BANNER_EVENTS} shown` : ""}).
                  </>
                )}
              </p>
            </div>
          )}

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
              No events match this view.
            </p>
          ) : (
            <div className="space-y-8">
              {sections.map((section) => (
                <section key={section.key}>
                  <button
                    type="button"
                    onClick={section.key === "past" ? () => setShowPast((v) => !v) : undefined}
                    className={`mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 ${
                      section.key === "past" ? "hover:text-gray-700" : "cursor-default"
                    }`}
                  >
                    {section.key === "live" && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                    {section.label}
                    <span className="font-normal normal-case text-gray-400">({section.list.length})</span>
                    {section.key === "past" && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
                    )}
                  </button>
                  {(section.key !== "past" || showPast || q) && (
                    <div className="space-y-3">
                      {section.list.map((e) => (
                        <EventRow
                          key={e.id}
                          event={e}
                          phase={section.key}
                          bannerLive={bannerLive.some((b) => b.id === e.id)}
                          onView={() => openView(e)}
                          onDelete={() => handleDelete(e)}
                          onToggle={(field, value) => patchFlag(e, field, value)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewing ? "Event details" : form.id ? "Edit event" : "New event"}
                </h2>
                <p className="text-xs text-gray-500">
                  {viewing
                    ? ended
                      ? "This event has ended, so its details can't be changed."
                      : "Viewing only. Click Edit to make changes."
                    : "Fields marked * are required."}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrolling lives on this div: browsers don't reliably scroll or shrink a fieldset. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
            {/* A disabled fieldset locks every input, switch and picker inside it. */}
            <fieldset
              disabled={viewing}
              className="m-0 grid min-w-0 gap-0 border-0 p-0 lg:grid-cols-[1fr_340px]"
            >
              {/* Left: event details */}
              <div className="space-y-6 p-6">
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Details</h3>
                  <Field label="Title *">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="DFC Annual General Meeting 2026"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Type *">
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
                  <Field label="Description *">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={5}
                      placeholder="What the event is about..."
                      className={inputClass}
                    />
                  </Field>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">When</h3>
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
                      {[
                        { v: false, label: "Single day" },
                        { v: true, label: "Multi-day" },
                      ].map((o) => (
                        <button
                          key={o.label}
                          type="button"
                          onClick={() => setForm({ ...form, multiDay: o.v })}
                          className={`rounded-md px-3 py-1 font-medium transition-colors ${
                            form.multiDay === o.v ? "bg-[#0D1F3C] text-white" : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={`grid gap-4 ${form.multiDay ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                    <Field label={form.multiDay ? "Start date *" : "Date *"}>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    {form.multiDay && (
                      <Field label="End date *">
                        <input
                          type="date"
                          value={form.endDate}
                          min={form.date || undefined}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          className={`${inputClass} ${endDateInvalid ? "border-red-400" : ""}`}
                        />
                        {endDateInvalid && (
                          <p className="mt-1 text-xs text-red-600">Must be after the start date</p>
                        )}
                      </Field>
                    )}
                    <Field label="Start time *" hint="West Africa Time (WAT)">
                      <TimeSelect value={form.time} onChange={(time) => setForm({ ...form, time })} />
                    </Field>
                  </div>
                  <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    All event times are in West Africa Time (WAT, UTC+1). Participants join from
                    several countries, so times are shown to them in WAT too.
                  </p>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Where</h3>
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
                      {ATTENDANCE_MODES.map((o) => {
                        const selected = form.isInPerson === o.inPerson && form.isVirtual === o.virtual;
                        return (
                          <button
                            key={o.label}
                            type="button"
                            onClick={() => setForm({ ...form, isInPerson: o.inPerson, isVirtual: o.virtual })}
                            className={`rounded-md px-3 py-1 font-medium transition-colors ${
                              selected ? "bg-[#0D1F3C] text-white" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {form.isInPerson && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Location / venue *">
                        <input
                          type="text"
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                          placeholder="Eko Hotel"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="City *">
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
                  {form.isVirtual && (
                    <Field label="Virtual link *">
                      <input
                        type="text"
                        value={form.virtualLink}
                        onChange={(e) => setForm({ ...form, virtualLink: e.target.value })}
                        placeholder="https://zoom.us/j/..."
                        className={inputClass}
                      />
                    </Field>
                  )}
                  {/* With no registration URL the link is public by default; this opts out. */}
                  {form.isVirtual && !form.registrationUrl.trim() && (
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.hideVirtualLink}
                        onChange={(e) => setForm({ ...form, hideVirtualLink: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#0A6E75]"
                      />
                      <span>
                        Hide virtual link from the public
                        <span className="block text-xs text-gray-400">
                          With no registration URL, the link is shown on the event page unless this is ticked.
                        </span>
                      </span>
                    </label>
                  )}
                  <Field label="Registration URL" hint="Where attendees sign up (optional)">
                    <input
                      type="text"
                      value={form.registrationUrl}
                      onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </Field>
                </section>
              </div>

              {/* Right: cover image + visibility */}
              <aside className="space-y-6 border-t border-gray-100 bg-gray-50/70 p-6 lg:border-l lg:border-t-0">
                {viewing && <EngagementCard stats={viewStats} hasRegistration={!!original.registrationUrl} />}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cover image *</h3>
                  {imagePreview || form.imageUrl ? (
                    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {/* Shown whole, as visitors will see it. */}
                      <FullImage src={imagePreview || form.imageUrl} alt="Cover preview" className="aspect-[4/3] w-full" />
                      {!viewing && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <label className="cursor-pointer rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-white">
                          Replace
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImagePick} />
                        </label>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-white"
                        >
                          Remove
                        </button>
                      </div>
                      )}
                      {imageFile && (
                        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white">
                          Uploads when you save
                        </span>
                      )}
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) pickImage(file);
                      }}
                      className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white text-center transition-colors hover:border-[#0A6E75] hover:bg-[#0A6E75]/5"
                    >
                      <ImagePlus className="h-7 w-7 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Click or drop an image</span>
                      <span className="text-xs text-gray-400">JPG, PNG or WebP, up to 5MB</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImagePick} />
                    </label>
                  )}
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Visibility</h3>
                  <Toggle
                    checked={form.isPublished}
                    onChange={(v) => setForm({ ...form, isPublished: v })}
                    label="Published"
                    hint="Visible on the public events page"
                  />
                  <Toggle
                    checked={form.isFeatured}
                    onChange={(v) => setForm({ ...form, isFeatured: v })}
                    label="Featured"
                    hint="Highlighted in event listings"
                  />
                  <Toggle
                    checked={form.showBanner}
                    onChange={(v) => setForm({ ...form, showBanner: v })}
                    label="Display banner"
                    hint="Pop-up shown to every visitor"
                  />
                  {form.showBanner && !form.isPublished && (
                    <p className="text-xs text-amber-600">
                      The banner only appears to visitors once the event is published.
                    </p>
                  )}
                </section>
              </aside>
            </fieldset>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              {viewing ? (
                <>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {ended ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                      <Lock className="h-4 w-4" />
                      Past event
                    </span>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </>
              ) : (
              <>
              <button
                onClick={form.id ? cancelEdit : () => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !requiredFilled}
                title={requiredFilled ? undefined : "Fill in all required fields first"}
                className="px-5 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (imageFile ? "Uploading & saving..." : "Saving...") : form.id ? "Save changes" : "Create event"}
              </button>
              </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-[#0A6E75] disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-700";

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

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-gray-300 disabled:cursor-default disabled:hover:border-gray-200"
    >
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        <span className="block text-xs text-gray-500">{hint}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[#0A6E75]" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

/**
 * Compact time picker: a short scrollable list that stays inside the modal.
 * Keyboard: Up/Down move, Home/End jump, Enter/Space pick, Escape/Tab close.
 */
function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep a legacy free-text time selectable so editing doesn't wipe it.
  const options = value && !TIME_OPTIONS.includes(value) ? [value, ...TIME_OPTIONS] : TIME_OPTIONS;
  const items = options;
  const label = (t: string) => (t ? t.replace(" WAT", "") : "Select a time");

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row visible, scrolling only the list (not the modal).
  useEffect(() => {
    const list = listRef.current;
    const row = list?.children[active] as HTMLElement | undefined;
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
  }, [active, open]);

  const openList = () => {
    setActive(Math.max(0, items.indexOf(value)));
    setOpen(true);
  };

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = items.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(items[active]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="event-time-list"
        aria-activedescendant={open ? `event-time-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${inputClass} flex items-center justify-between bg-white text-left`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>{label(value)}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id="event-time-list"
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((t, i) => (
            <li
              key={t}
              id={`event-time-${i}`}
              role="option"
              aria-selected={t === value}
              onClick={() => choose(t)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm ${
                i === active ? "bg-gray-100" : ""
              } ${t === value ? "font-medium text-[#0A6E75]" : t ? "text-gray-700" : "text-gray-400"}`}
            >
              {label(t)}
              {t === value && <Check className="h-3.5 w-3.5" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Phase = "live" | "upcoming" | "past";
type Filter = "all" | "published" | "drafts" | "featured";

const FILTERS: { key: Filter; label: string; match: (e: DFCEvent) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "published", label: "Published", match: (e) => e.isPublished },
  { key: "drafts", label: "Drafts", match: (e) => !e.isPublished },
  { key: "featured", label: "Featured", match: (e) => e.isFeatured },
];

/** Mirrors the take in /api/public/events/banner. */
const MAX_BANNER_EVENTS = 5;

// Event dates are stored as UTC midnight of the chosen day; compare as days in WAT.
const dayKey = (iso: string) => iso.slice(0, 10);
const todayWAT = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

function phaseOf(e: DFCEvent, today: string): Phase {
  const start = dayKey(e.date);
  const end = dayKey(e.endDate || e.date);
  if (end < today) return "past";
  if (start > today) return "upcoming";
  return "live";
}

function formatRange(e: DFCEvent) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  const start = new Date(e.date).toLocaleDateString("en-GB", opts);
  if (!e.endDate || dayKey(e.endDate) === dayKey(e.date)) return start;
  return `${start} – ${new Date(e.endDate).toLocaleDateString("en-GB", opts)}`;
}

function EventRow({
  event: e,
  phase,
  bannerLive,
  onView,
  onDelete,
  onToggle,
}: {
  event: DFCEvent;
  phase: Phase;
  bannerLive: boolean;
  onView: () => void;
  onDelete: () => void;
  onToggle: (field: "isPublished" | "isFeatured" | "showBanner", value: boolean) => void;
}) {
  const d = new Date(e.date);
  const where = [
    e.isInPerson && [e.location, e.city].filter(Boolean).join(", "),
    e.isVirtual && (e.isInPerson ? "Online" : "Virtual"),
  ]
    .filter(Boolean)
    .join(" + ");

  return (
    <div
      className={`group flex flex-col gap-4 rounded-xl border bg-white p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center ${
        phase === "live" ? "border-emerald-200" : "border-gray-200"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* Date block */}
        <div
          className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg ${
            phase === "past" ? "bg-gray-100 text-gray-500" : "bg-[#0D1F3C] text-white"
          }`}
        >
          <span className="text-xl font-bold leading-none">
            {d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" })}
          </span>
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wide opacity-80">
            {d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
          </span>
        </div>

        {/* Cover */}
        <div className="hidden h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-200 md:block">
          {e.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImagePlus className="h-5 w-5 text-gray-300" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="mr-1 truncate text-sm font-semibold text-gray-900">{e.title}</p>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_STYLES[e.type] || TYPE_STYLES.GENERAL}`}>
              {e.type}
            </span>
            {phase === "live" && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                Happening now
              </span>
            )}
            {e.isFeatured && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
              </span>
            )}
            {bannerLive ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#0A6E75] px-1.5 py-0.5 text-[11px] font-medium text-white">
                <Megaphone className="h-3 w-3" /> Banner live
              </span>
            ) : (
              e.showBanner && (
                <span
                  className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500"
                  title={
                    e.isPublished
                      ? "Banner stopped: an hour after the start time, or after the last day for multi-day events"
                      : "Banner starts once published"
                  }
                >
                  <Megaphone className="h-3 w-3" /> Banner {e.isPublished ? "ended" : "pending"}
                </span>
              )
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatRange(e)}
            </span>
            {e.time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {e.time}
              </span>
            )}
            {where && (
              <span className="inline-flex min-w-0 items-center gap-1">
                {e.isInPerson ? <MapPin className="h-3 w-3 shrink-0" /> : <Video className="h-3 w-3 shrink-0" />}
                <span className="truncate">{where}</span>
              </span>
            )}
          </div>
          <EngagementLine stats={e.stats} hasRegistration={!!e.registrationUrl} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3 sm:justify-end sm:border-0 sm:pt-0">
        <button
          type="button"
          role="switch"
          aria-checked={e.isPublished}
          onClick={() => onToggle("isPublished", !e.isPublished)}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          title={e.isPublished ? "Visible on the public events page. Click to unpublish." : "Hidden from the public. Click to publish."}
        >
          <span className={`relative h-4 w-7 rounded-full transition-colors ${e.isPublished ? "bg-emerald-500" : "bg-gray-300"}`}>
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
                e.isPublished ? "left-[14px]" : "left-0.5"
              }`}
            />
          </span>
          <span className="w-16 text-left">{e.isPublished ? "Published" : "Draft"}</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <RowMenu
            items={[
              ...(e.isPublished
                ? [
                    {
                      label: "Open public page",
                      icon: ExternalLink,
                      onClick: () => window.open(eventPath(e), "_blank", "noopener"),
                    },
                  ]
                : []),
              {
                label: e.isFeatured ? "Remove from featured" : "Mark as featured",
                icon: Star,
                onClick: () => onToggle("isFeatured", !e.isFeatured),
              },
              {
                label: e.showBanner ? "Stop showing banner" : "Show as banner",
                icon: Megaphone,
                onClick: () => onToggle("showBanner", !e.showBanner),
              },
              { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function RowMenu({
  items,
}: {
  items: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!ref.current?.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Registration links are optional. Without one, the events page has nothing to
 * click, so only the banner (whose button becomes "View event") can convert.
 * Click-through then compares banner clicks with banner views only.
 */
const totals = (s: EventStats, hasRegistration: boolean) => {
  const views = s.BANNER_VIEW + s.PAGE_VIEW + s.DETAIL_VIEW;
  const clicks = s.BANNER_CLICK + s.REGISTER_CLICK;
  const clickableViews = hasRegistration ? views : s.BANNER_VIEW;
  const rate = clickableViews ? Math.round((clicks / clickableViews) * 1000) / 10 : null;
  return { views, clicks, rate };
};

/** Compact engagement summary for a list row; the breakdown is in the tooltip. */
function EngagementLine({ stats, hasRegistration }: { stats: EventStats; hasRegistration: boolean }) {
  const { views, clicks, rate } = totals(stats, hasRegistration);
  if (!views && !clicks) {
    return (
      <p className="mt-1 text-[11px] text-gray-400">
        No engagement yet{hasRegistration ? "" : " · no registration link"}
      </p>
    );
  }
  const pageClicks = hasRegistration ? `${stats.REGISTER_CLICK} register clicks` : "no registration link";
  return (
    <p
      className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-gray-500"
      title={`Banner: ${stats.BANNER_VIEW} views, ${stats.BANNER_CLICK} clicks · Events list: ${stats.PAGE_VIEW} views · Event page: ${stats.DETAIL_VIEW} views · ${pageClicks}`}
    >
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3 w-3" /> {views.toLocaleString()} views
      </span>
      <span className="inline-flex items-center gap-1">
        <MousePointerClick className="h-3 w-3" /> {clicks.toLocaleString()} clicks
      </span>
      {rate !== null && <span>{rate}% click-through{hasRegistration ? "" : " (banner)"}</span>}
      {!hasRegistration && <span className="text-gray-400">No registration link</span>}
    </p>
  );
}

/** Engagement breakdown shown in the View modal. */
function EngagementCard({ stats, hasRegistration }: { stats: EventStats; hasRegistration: boolean }) {
  const { views, clicks, rate } = totals(stats, hasRegistration);
  const rows = [
    { label: "Banner views", value: stats.BANNER_VIEW.toLocaleString() },
    { label: hasRegistration ? "Banner clicks (Register)" : "Banner clicks (View event)", value: stats.BANNER_CLICK.toLocaleString() },
    { label: "Events list views", value: stats.PAGE_VIEW.toLocaleString() },
    { label: "Event page views", value: stats.DETAIL_VIEW.toLocaleString() },
    {
      label: "Register clicks",
      value: hasRegistration ? stats.REGISTER_CLICK.toLocaleString() : "No link",
    },
  ];
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Engagement</h3>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Views", value: views.toLocaleString() },
          { label: "Clicks", value: clicks.toLocaleString() },
          { label: hasRegistration ? "Click-through" : "Banner CTR", value: rate !== null ? `${rate}%` : "–" },
        ].map((t) => (
          <div key={t.label} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-center">
            <p className="text-base font-semibold text-gray-900">{t.value}</p>
            <p className="text-[11px] text-gray-500">{t.label}</p>
          </div>
        ))}
      </div>
      <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white text-xs">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between px-3 py-1.5">
            <dt className="text-gray-500">{r.label}</dt>
            <dd className="font-medium text-gray-800">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] leading-relaxed text-gray-400">
        Anonymous counts. Views are counted once per visit.
        {hasRegistration
          ? " Clicks are Register taps on the banner, events list and event page."
          : " With no registration link, visitors can only click through from the banner (to the event page)."}
      </p>
    </section>
  );
}
