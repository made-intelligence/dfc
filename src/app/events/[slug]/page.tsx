import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Video, ExternalLink, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import { eventPath, legacyEventIdFromParam } from "@/lib/event-url";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { BreadcrumbJsonLd, EventJsonLd } from "@/components/seo/JsonLd";
import { RegisterLink, TrackEventView } from "@/components/events/EventTracking";
import { EventImageViewer } from "@/components/events/EventImageViewer";

// Re-render at most every 5 minutes so edits show up without a redeploy.
export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

const EVENT_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  type: true,
  date: true,
  endDate: true,
  time: true,
  location: true,
  city: true,
  isVirtual: true,
  isInPerson: true,
  virtualLink: true,
  hideVirtualLink: true,
  imageUrl: true,
  registrationUrl: true,
} as const;

// Shared by generateMetadata and the page within one request.
const getEvent = cache(async (slug: string) => {
  return prisma.dFCEvent.findFirst({
    where: { slug, isPublished: true },
    select: EVENT_SELECT,
  });
});

/** Old "/events/<title>-<id>" links: find the event so we can redirect. */
const getLegacyEvent = cache(async (param: string) => {
  const id = legacyEventIdFromParam(param);
  if (!id) return null;
  return prisma.dFCEvent.findFirst({ where: { id, isPublished: true }, select: { slug: true } });
});

type PublicEvent = NonNullable<Awaited<ReturnType<typeof getEvent>>>;

// Dates are stored as UTC midnight of the chosen day.
const dayOpts: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

function formatRange(e: PublicEvent) {
  const start = e.date.toLocaleDateString("en-GB", dayOpts);
  if (!e.endDate || e.endDate.toISOString().slice(0, 10) === e.date.toISOString().slice(0, 10)) return start;
  return `${start} – ${e.endDate.toLocaleDateString("en-GB", dayOpts)}`;
}

function whereText(e: PublicEvent) {
  const venue = [e.location, e.city].filter(Boolean).join(", ");
  if (e.isInPerson && e.isVirtual) return venue ? `${venue}, and online` : "In person and online";
  if (e.isVirtual) return "Online";
  return venue || "Venue to be confirmed";
}

function hasEnded(e: PublicEvent) {
  const todayWAT = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
  return (e.endDate ?? e.date).toISOString().slice(0, 10) < todayWAT;
}

function summary(e: PublicEvent) {
  const text = (e.description || "").replace(/\s+/g, " ").trim();
  const base = text || `${e.title}: a Doctors Foundation For Care event.`;
  return base.length > 160 ? `${base.slice(0, 157).trimEnd()}…` : base;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found", robots: { index: false } };

  const description = summary(event);
  return {
    title: event.title,
    description,
    alternates: { canonical: eventPath(event) },
    openGraph: {
      type: "website",
      title: event.title,
      description,
      url: eventPath(event),
      images: event.imageUrl ? [{ url: event.imageUrl, alt: event.title }] : undefined,
    },
    twitter: {
      card: event.imageUrl ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images: event.imageUrl ? [event.imageUrl] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) {
    // Links shared before slugs were stored carried the id; send them on.
    const legacy = await getLegacyEvent(slug);
    if (legacy) permanentRedirect(eventPath(legacy));
    notFound();
  }

  const url = `${appUrl()}${eventPath(event)}`;
  const ended = hasEnded(event);
  // Open events (no registration) show the join link unless the admin hid it;
  // otherwise attendees get it by registering.
  const joinLink =
    event.isVirtual && !event.registrationUrl && !event.hideVirtualLink ? event.virtualLink : null;

  return (
    <>
      <Topbar />
      <EventJsonLd
        name={event.title}
        description={event.description}
        url={url}
        image={event.imageUrl}
        startDate={event.date.toISOString().slice(0, 10)}
        endDate={event.endDate ? event.endDate.toISOString().slice(0, 10) : null}
        isInPerson={event.isInPerson}
        isVirtual={event.isVirtual}
        venue={event.location}
        city={event.city}
        registrationUrl={event.registrationUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: appUrl() },
          { name: "Events", url: `${appUrl()}/events` },
          { name: event.title, url },
        ]}
      />
      <TrackEventView eventId={event.id} />

      <main className="bg-gray-50 pb-20 pt-24 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A6E75] hover:text-[#0D1F3C]"
          >
            <ArrowLeft className="h-4 w-4" />
            All events
          </Link>

          <article
            className={`mt-6 grid gap-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 ${
              event.imageUrl ? "lg:grid-cols-2 lg:gap-10" : ""
            }`}
          >
            {/* Image left on desktop (sticky while the details scroll); on top on mobile.
                Shown at its own proportions so nothing on the flyer is cut off. */}
            {event.imageUrl && (
              <div className="lg:sticky lg:top-28 lg:self-start">
                <EventImageViewer src={event.imageUrl} alt={event.title} />
              </div>
            )}

            <div className="min-w-0">
              <span className="inline-block rounded-full bg-[#0A6E75]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0A6E75]">
                {event.type}
              </span>
              <h1 className="mt-3 text-2xl font-bold leading-tight text-[#0D1F3C] sm:text-3xl">
                {event.title}
              </h1>

              {ended && (
                <p className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-600">
                  <Info className="h-4 w-4 shrink-0" />
                  This event has ended.
                </p>
              )}

              {/* Key facts + Register come before the description so they're seen first on mobile. */}
              <div className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="flex gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4A50]" />
                    <div>
                      <dt className="font-medium text-gray-900">Date</dt>
                      <dd className="text-gray-600">
                        <time dateTime={event.date.toISOString().slice(0, 10)}>{formatRange(event)}</time>
                      </dd>
                    </div>
                  </div>
                  {event.time && (
                    <div className="flex gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4A50]" />
                      <div>
                        <dt className="font-medium text-gray-900">Time</dt>
                        <dd className="text-gray-600">{event.time}</dd>
                        <dd className="text-xs text-gray-400">West Africa Time (UTC+1)</dd>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 sm:col-span-2">
                    {event.isInPerson ? (
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4A50]" />
                    ) : (
                      <Video className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4A50]" />
                    )}
                    <div>
                      <dt className="font-medium text-gray-900">Where</dt>
                      <dd className="text-gray-600">{whereText(event)}</dd>
                      {joinLink && (
                        <dd className="mt-1 break-all">
                          <a
                            href={joinLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#0A6E75] hover:text-[#0D1F3C] hover:underline"
                          >
                            {joinLink}
                          </a>
                        </dd>
                      )}
                    </div>
                  </div>
                </dl>

                {!ended && (event.registrationUrl || joinLink) && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {event.registrationUrl && (
                      <RegisterLink
                        eventId={event.id}
                        href={event.registrationUrl}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0D1F3C] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0A4A50]"
                      >
                        Register
                        <ExternalLink className="h-4 w-4" />
                      </RegisterLink>
                    )}
                    {joinLink && (
                      <a
                        href={joinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#0D1F3C] bg-white py-2.5 text-sm font-medium text-[#0D1F3C] transition-colors hover:bg-gray-100"
                      >
                        Join online
                        <Video className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {event.description && (
                <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-gray-700">
                  {event.description}
                </div>
              )}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
