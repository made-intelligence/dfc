"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Video,
  ArrowRight,
  Clock,
  Users,
  Stethoscope,
  Mic2,
  HeartPulse,
  Landmark,
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
  imageUrl: string | null;
  registrationUrl: string | null;
  isFeatured: boolean;
}

const typeConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  CONFERENCE: {
    icon: <Mic2 className="w-4 h-4" />,
    label: "Conference",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  OUTREACH: {
    icon: <HeartPulse className="w-4 h-4" />,
    label: "Outreach",
    color: "text-rose-700",
    bg: "bg-rose-50",
  },
  WEBINAR: {
    icon: <Video className="w-4 h-4" />,
    label: "Webinar",
    color: "text-purple-700",
    bg: "bg-purple-50",
  },
  AGM: {
    icon: <Landmark className="w-4 h-4" />,
    label: "AGM",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  CAMP: {
    icon: <Stethoscope className="w-4 h-4" />,
    label: "Surgical Camp",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  GENERAL: {
    icon: <Users className="w-4 h-4" />,
    label: "Event",
    color: "text-slate-700",
    bg: "bg-slate-50",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString("en-GB", { month: "short" }).toUpperCase(),
    year: d.getFullYear(),
    full: d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

// Fallback events shown before admin adds real ones
const FALLBACK_EVENTS: DFCEvent[] = [
  {
    id: "f1",
    title: "ERI Technical Working Group Meeting",
    description:
      "Monthly coordination meeting for all six ERI pillars. Progress updates, blockers, and next steps.",
    type: "WEBINAR",
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    endDate: null,
    time: "7:00 PM WAT",
    location: null,
    city: null,
    isVirtual: true,
    imageUrl: null,
    registrationUrl: null,
    isFeatured: true,
  },
  {
    id: "f2",
    title: "DFC Health Outreach, Lagos",
    description:
      "Free specialist consultations and health screenings at a partner hospital in Lagos.",
    type: "OUTREACH",
    date: new Date(Date.now() + 21 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 23 * 86400000).toISOString(),
    time: "9:00 AM WAT",
    location: "Partner Hospital",
    city: "Lagos",
    isVirtual: false,
    imageUrl: null,
    registrationUrl: null,
    isFeatured: false,
  },
  {
    id: "f3",
    title: "DFC Annual General Meeting 2026",
    description:
      "Annual assembly of DFC members. Elections, reports, and strategic planning for the year ahead.",
    type: "AGM",
    date: new Date(Date.now() + 60 * 86400000).toISOString(),
    endDate: null,
    time: "6:00 PM WAT",
    location: null,
    city: null,
    isVirtual: true,
    imageUrl: null,
    registrationUrl: null,
    isFeatured: true,
  },
];

export default function EventsSection() {
  const [events, setEvents] = useState<DFCEvent[]>(FALLBACK_EVENTS);

  useEffect(() => {
    fetch("/api/public/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.events?.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Upcoming events
            </h2>
            <p className="mt-3 text-base text-gray-600 max-w-lg leading-relaxed">
              Outreaches, conferences, working group meetings, and more.
            </p>
          </div>
          <Link
            href="/events"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-[#0D1F3C] font-medium hover:underline"
          >
            View all events
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.slice(0, 3).map((event) => {
            const config = typeConfig[event.type] || typeConfig.GENERAL;
            const date = formatDate(event.date);
            const endDate = event.endDate ? formatDate(event.endDate) : null;

            return (
              <div
                key={event.id}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Date strip */}
                <div className="flex items-stretch">
                  <div className="w-20 sm:w-24 bg-[#0D1F3C] flex flex-col items-center justify-center py-5 shrink-0">
                    <span className="text-xs font-semibold text-white/50 tracking-wider">
                      {date.month}
                    </span>
                    <span className="text-3xl font-bold text-white leading-none mt-0.5">
                      {date.day}
                    </span>
                    {endDate && endDate.day !== date.day && (
                      <span className="text-xs text-white/50 mt-1">
                        &ndash; {endDate.day}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-5">
                    {/* Type badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} mb-3`}
                    >
                      {config.icon}
                      {config.label}
                    </div>

                    <h3 className="text-base font-semibold text-[#0D1F3C] leading-snug mb-2">
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
                        {event.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                      {event.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {event.time}
                        </span>
                      )}
                      {event.isVirtual ? (
                        <span className="inline-flex items-center gap-1 text-purple-600">
                          <Video className="w-3.5 h-3.5" />
                          Virtual
                        </span>
                      ) : event.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.city}
                        </span>
                      ) : event.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state if no events */}
        {events.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No upcoming events scheduled.</p>
          </div>
        )}
      </div>
    </section>
  );
}
