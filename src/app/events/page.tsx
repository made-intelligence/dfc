"use client";

import { useState, FormEvent } from "react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { Calendar, MapPin, Clock, Bell } from "lucide-react";

const upcomingEvents = [
  {
    id: 1,
    title: "DFC Annual General Meeting 2026",
    date: "Saturday, 20 June 2026",
    time: "6:00 PM WAT",
    location: "Virtual (Zoom)",
    isVirtual: true,
    description:
      "Annual assembly of DFC members featuring elections, progress reports across all pillars, and strategic planning for the year ahead.",
  },
  {
    id: 2,
    title: "Second Opinion Service Launch Webinar",
    date: "Thursday, 16 April 2026",
    time: "7:00 PM WAT",
    location: "Virtual (Zoom)",
    isVirtual: true,
    description:
      "Join us for the official launch of the DFC Second Opinion Service — connecting patients in Nigeria with diaspora specialists for expert medical consultations.",
  },
  {
    id: 3,
    title: "Specialist Network Symposium",
    date: "Friday, 14 August 2026",
    time: "10:00 AM WAT",
    location: "Lagos, Nigeria",
    isVirtual: false,
    description:
      "A two-day symposium bringing together diaspora physicians and local specialists for knowledge exchange, case discussions, and collaborative practice.",
  },
  {
    id: 4,
    title: "Medical Ethics Workshop",
    date: "Saturday, 10 October 2026",
    time: "3:00 PM WAT",
    location: "Virtual (Zoom)",
    isVirtual: true,
    description:
      "An interactive workshop exploring ethical considerations in cross-border telemedicine, patient data privacy, and diaspora healthcare delivery.",
  },
];

export default function EventsPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
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

            <div className="grid gap-6 sm:grid-cols-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="relative bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  {/* Coming Soon Badge */}
                  <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                    <Clock className="w-3 h-3" />
                    Coming Soon
                  </span>

                  <h3 className="text-lg font-semibold text-[#0D1F3C] pr-24 mb-4 leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-sm text-gray-500 leading-relaxed mb-5">
                    {event.description}
                  </p>

                  <div className="space-y-2.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0A4A50] shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0A4A50] shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0A4A50] shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
                    >
                      Registration Opens Soon
                    </button>
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
