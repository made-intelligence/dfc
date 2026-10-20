"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { FullImage } from "@/components/ui/full-image";
import { CalendarDays, MapPin, Clock, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/event-tracking";
import { eventPath } from "@/lib/event-url";

const SEEN_KEY = "dfc_event_banner_seen";
const SLIDE_MS = 6000;

interface BannerEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  isVirtual: boolean;
  isInPerson: boolean;
  imageUrl: string | null;
  registrationUrl: string | null;
  updatedAt: string;
}

// Remembered per browser session only, so every new visit shows the banner
// again. Keyed on the whole set, so adding or editing an event re-shows it.
const seenToken = (events: BannerEvent[]) => events.map((e) => `${e.id}:${e.updatedAt}`).join("|");

// Dates are stored as UTC midnight of the chosen day.
function formatDate(e: BannerEvent) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
  const start = new Date(e.date).toLocaleDateString("en-GB", opts);
  if (!e.endDate || e.endDate.slice(0, 10) === e.date.slice(0, 10)) return start;
  return `${start} – ${new Date(e.endDate).toLocaleDateString("en-GB", opts)}`;
}

function placeOf(e: BannerEvent) {
  const venue = [e.location, e.city].filter(Boolean).join(", ");
  if (!e.isInPerson) return "Online";
  return e.isVirtual ? [venue, "Online"].filter(Boolean).join(" + ") : venue;
}

export default function EventBanner() {
  const pathname = usePathname();
  const [events, setEvents] = useState<BannerEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Keep the admin area and the sign-in / join flows free of the pop-up.
  const suppressed = pathname?.startsWith("/admin") || pathname?.startsWith("/auth");

  useEffect(() => {
    if (suppressed) return;
    let cancelled = false;
    fetch("/api/public/events/banner")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then(({ events }: { events?: BannerEvent[] }) => {
        if (cancelled || !events?.length) return;
        try {
          if (sessionStorage.getItem(SEEN_KEY) === seenToken(events)) return;
        } catch {
          // storage unavailable: show it
        }
        setEvents(events);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [suppressed]);

  // Auto-advance; paused on hover and for reduced-motion users. (Not on focus:
  // the dialog focuses its first button on open, which would never resume.)
  const count = events.length;
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  // Count each slide once per visit as it is shown.
  const currentId = events[index]?.id;
  useEffect(() => {
    if (currentId && !suppressed) trackEvent(currentId, "BANNER_VIEW", { oncePerSession: true });
  }, [currentId, suppressed]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, seenToken(events));
    } catch {
      // ignore storage errors
    }
    setEvents([]);
  };

  if (!count || suppressed) return null;

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const current = events[index] ?? events[0];
  const external = current.registrationUrl?.startsWith("http");

  return (
    <DialogPrimitive.Root open onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onKeyDown={(e) => {
            if (count < 2) return;
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
          aria-roledescription={count > 1 ? "carousel" : undefined}
          className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white shadow-2xl focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            {count > 1 ? `${count} upcoming events` : current.title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Announcement of upcoming events. Close to continue to the site.
          </DialogPrimitive.Description>

          {/* Slides share one grid cell so the dialog keeps the tallest height and never jumps. */}
          <div className="grid">
            {events.map((event, i) => {
              const place = placeOf(event);
              const active = i === index;
              return (
                <div
                  key={event.id}
                  role={count > 1 ? "group" : undefined}
                  aria-roledescription={count > 1 ? "slide" : undefined}
                  aria-label={count > 1 ? `${i + 1} of ${count}` : undefined}
                  aria-hidden={!active}
                  className={`col-start-1 row-start-1 transition-opacity duration-500 ${
                    active ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  {event.imageUrl && (
                    <FullImage src={event.imageUrl} alt="" className="h-60 w-full rounded-t-xl sm:h-72" />
                  )}
                  <div className="p-6 pb-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0A6E75]">Upcoming event</p>
                    <h2 className="mt-1 text-xl font-bold text-[#0D1F3C]">{event.title}</h2>

                    <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-[#0D1F3C]" />
                        {formatDate(event)}
                      </li>
                      {event.time && (
                        <li className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0 text-[#0D1F3C]" />
                          {event.time}
                        </li>
                      )}
                      {place && (
                        <li className="flex items-center gap-2">
                          {!event.isInPerson ? (
                            <Globe className="h-4 w-4 shrink-0 text-[#0D1F3C]" />
                          ) : (
                            <MapPin className="h-4 w-4 shrink-0 text-[#0D1F3C]" />
                          )}
                          {place}
                        </li>
                      )}
                    </ul>

                    {event.description && (
                      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-gray-600">{event.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 p-6">
            {count > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous event"
                  className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {events.map((e, i) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Show event ${i + 1}: ${e.title}`}
                      aria-current={i === index}
                      className={`h-2 rounded-full transition-all ${
                        i === index ? "w-6 bg-[#0D1F3C]" : "w-2 bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next event"
                  className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={dismiss} className="w-full cursor-pointer sm:w-auto">
                Close
              </Button>
              {current.registrationUrl ? (
                <Button asChild className="w-full cursor-pointer bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 sm:w-auto">
                  <a
                    href={current.registrationUrl}
                    onClick={() => {
                      trackEvent(current.id, "BANNER_CLICK");
                      dismiss();
                    }}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    Register
                  </a>
                </Button>
              ) : (
                <Button asChild className="w-full cursor-pointer bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 sm:w-auto">
                  <Link
                    href={eventPath(current)}
                    onClick={() => {
                      trackEvent(current.id, "BANNER_CLICK");
                      dismiss();
                    }}
                  >
                    View event
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
