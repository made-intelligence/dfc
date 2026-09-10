"use client";

import { useState, useEffect, FormEvent } from "react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { Calendar, MapPin, Clock, Bell } from "lucide-react";

interface DFCEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  isVirtual: boolean;
  registrationUrl: string | null;
}

function formatEventDate(dateStr: string, endStr: string | null) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const start = new Date(dateStr).toLocaleDateString("en-GB", opts);
  if (!endStr) return start;
  const end = new Date(endStr);
  if (end.toDateString() === new Date(dateStr).toDateString()) return start;
  return `${start} \u2013 ${end.toLocaleDateString("en-GB", opts)}`;
}

function eventVenue(event: DFCEvent) {
  if (event.isVirtual) return "Virtual";
  return event.city || event.location || "Venue to be confirmed";
}

export default function EventsPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<DFCEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/public/events")
      .then((res) => res.json())
      .then((data) => setUpcomingEvents(data.events ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  }

  return (
    <>
      <Topbar />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0D1F3C 0%, #0A4A50 100%)",
          }}
        >
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-16 lg:pt-40 lg:pb-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
              <Calendar className="w-4 h-4" />
              Upcoming Events
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Events &amp; Conferences
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              DFC hosts professional development events, medical conferences,
              and networking opportunities for Nigerian diaspora physicians and
              healthcare professionals.
            </p>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0D1F3C]">
                Upcoming Events
              </h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                Mark your calendars for these upcoming DFC events and
                activities.
              </p>
            </div>

            {loaded && upcomingEvents.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No events are scheduled at the moment. Subscribe below and
                  we&apos;ll let you know as soon as the next one is announced.
                </p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="relative bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  {!event.registrationUrl && (
                    <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                      <Clock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-[#0D1F3C] pr-24 mb-4 leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-sm text-gray-500 leading-relaxed mb-5">
                    {event.description}
                  </p>

                  <div className="space-y-2.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0A4A50] shrink-0" />
                      <span>{formatEventDate(event.date, event.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0A4A50] shrink-0" />
                      <span>{event.time || "Time to be confirmed"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0A4A50] shrink-0" />
                      <span>{eventVenue(event)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    {event.registrationUrl ? (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2.5 rounded-lg bg-[#0D1F3C] text-white text-sm font-medium text-center hover:bg-[#0A4A50] transition-colors"
                      >
                        Register
                      </a>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
                      >
                        Registration Opens Soon
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / Newsletter */}
        <section
          className="py-16 sm:py-24"
          style={{
            background: "linear-gradient(135deg, #0D1F3C 0%, #0A4A50 100%)",
          }}
        >
          <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-6">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Want to be notified about upcoming events?
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Subscribe to receive updates when new events are announced,
              registration opens, or schedules change.
            </p>

            {subscribed ? (
              <div className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white">
                <svg
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-medium">
                  You&apos;re subscribed! We&apos;ll keep you posted on upcoming
                  DFC events.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-white text-[#0D1F3C] text-sm font-semibold hover:bg-white/90 transition-colors shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
