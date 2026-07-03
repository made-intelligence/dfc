"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Linkedin,
  Globe,
  Stethoscope,
  GraduationCap,
  Users,
  Heart,
  Shield,
  Lightbulb,
  ArrowRight,
  Building2,
  HandshakeIcon,
  Target,
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
}

const FALLBACK_GROUPS: Record<string, LeadershipProfile[]> = {
  FOUNDER: [
    {
      id: "f1", name: "Dr. Babaseyi Oyesola", title: "Founder", group: "FOUNDER",
      role: "Founder", bio: null, imageUrl: null, linkedinUrl: null, institution: "A3C", location: null,
    },
  ],
  EXCO: [
    { id: "e1", name: "Dr. Debo Odulana", title: "President", group: "EXCO", role: "President", bio: null, imageUrl: null, linkedinUrl: null, institution: null, location: null },
    { id: "e2", name: "Dr. Folake Kofo-Idowu", title: "Vice President", group: "EXCO", role: "Vice President", bio: null, imageUrl: null, linkedinUrl: null, institution: null, location: null },
    { id: "e3", name: "Prof. Abdul Kareem Lateef", title: "Treasurer", group: "EXCO", role: "Treasurer", bio: null, imageUrl: null, linkedinUrl: null, institution: null, location: null },
  ],
  BOT: [],
};

const GROUP_LABELS: Record<string, { title: string; description: string }> = {
  FOUNDER: { title: "Founder", description: "" },
  EXCO: {
    title: "Executive Committee",
    description: "The EXCO manages the day-to-day affairs of DFC, implements General Assembly resolutions, and coordinates member activities.",
  },
  BOT: {
    title: "Board of Trustees",
    description: "The Board of Trustees holds DFC property, oversees constitutional compliance, and safeguards the organisation\u2019s long-term interests.",
  },
};

function PersonCard({ person }: { person: LeadershipProfile }) {
  return (
    <div className="group relative">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 text-center">
        {/* Avatar */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden mx-auto mb-4 ring-3 ring-white shadow-md">
          {person.imageUrl ? (
            <Image src={person.imageUrl} alt={person.name} width={112} height={112} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0D1F3C] to-[#0A6E75] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
          )}
        </div>
        <h3 className="text-base font-bold text-[#0D1F3C]">{person.name}</h3>
        {person.role && (
          <p className="text-sm font-medium text-[#0A6E75] mt-1">{person.role}</p>
        )}
        {person.institution && (
          <p className="text-sm text-gray-500 mt-0.5">{person.institution}</p>
        )}
        {person.location && (
          <p className="text-xs text-gray-400 mt-0.5">{person.location}</p>
        )}
        {person.linkedinUrl && (
          <a
            href={person.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#0A6E75] font-medium hover:underline"
          >
            <Linkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

export default function About() {
  const [leadership, setLeadership] =
    useState<Record<string, LeadershipProfile[]>>(FALLBACK_GROUPS);

  useEffect(() => {
    fetch("/api/public/leadership")
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles && Object.keys(data.profiles).length > 0) {
          setLeadership(data.profiles);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Turning Brain Drain
            <br />
            <span className="text-emerald-300">
              Into Brain Gain
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            A global movement of Nigerian diaspora physicians reconnecting
            with patients at home through world-class care.
          </p>

          {/* Stat chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            {[
              { icon: Stethoscope, label: "Diaspora Specialists" },
              { icon: Globe, label: "7+ Countries" },
              { icon: Users, label: "Growing Network" },
            ].map((stat) => (
              <div key={stat.label} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5">
                <stat.icon className="w-4 h-4 text-emerald-400/80" />
                <span className="text-sm font-medium text-white/80">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who We Are — Glass cards ──────────────────────── */}
      <section className="relative py-20 sm:py-24 bg-[#F8F9FB]">
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Who we are</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] leading-tight">
              The Doctors Foundation For Care
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-8">
              <p className="text-base text-gray-700 leading-relaxed">
                Doctors Foundation For Care (Doctors for Change) is a collective of
                physicians who have trained outside Nigeria and are passionate
                about improving Nigeria&apos;s healthcare system. We are a global
                healthcare movement created to bridge the gap between Nigerians
                and the wealth of medical expertise across the world.
              </p>
              <p className="text-base text-gray-700 leading-relaxed mt-4">
                As thousands of our brightest doctors leave the country to pursue
                residency and specialist training abroad, a gap has grown in
                Nigeria&apos;s healthcare system. DFC was built to bridge that
                gap &mdash; reconnecting foreign-trained Nigerian doctors with patients
                back home who still need their expertise, compassion, and care.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-8">
              <p className="text-base text-gray-700 leading-relaxed">
                At DFC, we believe in the power of collaboration to revolutionise
                healthcare in Nigeria. We focus on facilitating access to
                innovative medical technologies, advanced techniques, and essential
                training. Through this collaborative effort, DFC is committed to
                delivering superior healthcare, driving systemic improvements, and
                enhancing health outcomes across the nation.
              </p>
              <p className="text-base text-gray-700 leading-relaxed mt-4">
                DFC is constituted as a professional body with a General Assembly,
                Executive Committee, and Board of Trustees. It is governed by a
                written constitution and funded by membership dues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mission & Vision — Glass morphism cards ────────── */}
      <section className="relative py-20 sm:py-24 bg-gradient-to-b from-[#F8F9FB] to-white overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Mission */}
            <div className="relative bg-gradient-to-br from-[#0D1F3C] to-[#0A3454] rounded-3xl p-8 overflow-hidden">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-5">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
                <p className="text-base text-white/70 leading-relaxed">
                  To lead the advancement of medical practice in Nigeria,
                  facilitating access to innovative medical technologies, advanced
                  techniques, and training to deliver superior healthcare and
                  enhance health outcomes for all.
                </p>
              </div>
            </div>
            {/* Vision */}
            <div className="relative bg-gradient-to-br from-[#0A6E75] to-[#0A3454] rounded-3xl p-8 overflow-hidden">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-5">
                  <Lightbulb className="w-6 h-6 text-emerald-300" />
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Our Vision</h2>
                <p className="text-base text-white/70 leading-relaxed">
                  A future where Nigeria&apos;s healthcare system is a beacon of
                  excellence, innovation, and equitable care, empowered by
                  DFC&apos;s collaborative network of diaspora and local physicians.
                </p>
              </div>
            </div>
          </div>

          {/* What we do */}
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">What we do</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] leading-tight">
              Why DFC Matters
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Nigeria&apos;s healthcare system is under immense strain, with
              limited specialists, long wait times, and preventable deaths. Yet the
              solution already exists within our own global medical community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: "Bridge the brain drain", text: "We turn brain drain into brain gain by reconnecting foreign-trained Nigerian doctors with their home country.", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 text-blue-600" },
              { icon: Stethoscope, title: "Empower diaspora specialists", text: "We make it easy for Nigerian doctors abroad to consult, mentor, and impact care delivery from anywhere.", color: "from-teal-500 to-emerald-600", bg: "bg-teal-50 text-teal-600" },
              { icon: Lightbulb, title: "Innovative technologies", text: "We facilitate access to innovative medical technologies and advanced techniques that improve patient outcomes.", color: "from-amber-500 to-orange-600", bg: "bg-amber-50 text-amber-600" },
              { icon: Heart, title: "Rebuild trust in care", text: "We are building towards a future where Nigeria\u2019s healthcare system is a beacon of excellence and equitable care.", color: "from-rose-500 to-pink-600", bg: "bg-rose-50 text-rose-600" },
              { icon: Shield, title: "Policy and advocacy", text: "Technical working groups developing policy frameworks, including the Emergency Response Initiative.", color: "from-violet-500 to-purple-600", bg: "bg-violet-50 text-violet-600" },
              { icon: GraduationCap, title: "Training and mentorship", text: "Hands-on fellowships and essential training for Nigerian doctors, led by experienced diaspora specialists.", color: "from-cyan-500 to-sky-600", bg: "bg-cyan-50 text-cyan-600" },
            ].map((item) => (
              <div
                key={item.title}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0D1F3C] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Diaspora Doctors ───────────────────────────── */}
      <section className="relative py-20 sm:py-24 bg-[#F8F9FB] overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">For diaspora doctors</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] leading-tight">
              Your Expertise. Your Roots. Your Impact.
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-xl mx-auto">
              For diaspora doctors, DFC is a movement of return and
              reconnection &mdash; a way to give back meaningfully.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Heart, title: "Reconnect with home", text: "Give back to Nigeria while staying fully engaged in your international career.", gradient: "from-rose-500 to-pink-500" },
              { icon: Globe, title: "Consult without borders", text: "Offer teleconsultations, mentorship, and second opinions from anywhere, on your schedule.", gradient: "from-blue-500 to-indigo-500" },
              { icon: Building2, title: "Earn meaningfully", text: "Generate income for your time and expertise while contributing to a mission that matters.", gradient: "from-emerald-500 to-teal-500" },
              { icon: Users, title: "Expand your reach", text: "Build your personal brand and professional network across continents.", gradient: "from-violet-500 to-purple-500" },
              { icon: HandshakeIcon, title: "Collaborate with peers", text: "Join a trusted community of Nigerian specialists creating solutions for homegrown challenges.", gradient: "from-amber-500 to-orange-500" },
              { icon: GraduationCap, title: "Turn brain drain into legacy", text: "Be part of the generation redefining Nigerian healthcare for the better.", gradient: "from-cyan-500 to-sky-500" },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className={`h-1 bg-gradient-to-r ${item.gradient}`} />
                <div className="p-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-[#0D1F3C] mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Leadership ─────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Our people</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C]">
              Leadership
            </h2>
            <p className="mt-3 text-base text-gray-600 max-w-lg mx-auto">
              The people who govern and run DFC.
            </p>
          </div>

          {["FOUNDER", "EXCO", "BOT"].map((groupKey) => {
            const people = leadership[groupKey];
            if (!people || people.length === 0) return null;
            const meta = GROUP_LABELS[groupKey];

            return (
              <div key={groupKey} className="mb-16 last:mb-0">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-[#0D1F3C]">{meta.title}</h3>
                  {meta.description && (
                    <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">{meta.description}</p>
                  )}
                </div>
                <div
                  className={`grid gap-6 justify-items-center ${
                    people.length === 1
                      ? "grid-cols-1 max-w-xs mx-auto"
                      : people.length === 2
                      ? "grid-cols-2 max-w-md mx-auto"
                      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  }`}
                >
                  {people.map((person) => (
                    <PersonCard key={person.id} person={person} />
                  ))}
                </div>
              </div>
            );
          })}

          {(!leadership.EXCO || leadership.EXCO.length === 0) &&
            (!leadership.BOT || leadership.BOT.length === 0) && (
              <p className="text-center text-gray-400 text-sm mt-8">
                Executive Committee and Board of Trustees profiles will be added
                by the DFC secretariat.
              </p>
            )}
        </div>
      </section>
    </>
  );
}
