"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Linkedin } from "lucide-react";

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

// Fallback data shown while API loads or if no profiles exist yet
const FALLBACK_GROUPS: Record<string, LeadershipProfile[]> = {
  FOUNDER: [
    {
      id: "f1",
      name: "Dr. Babaseyi Oyesola",
      title: "Founder",
      group: "FOUNDER",
      role: "Founder",
      bio: null,
      imageUrl: null,
      linkedinUrl: null,
      institution: "A3C",
      location: null,
    },
  ],
  EXCO: [
    {
      id: "e1",
      name: "Dr. Debo Odulana",
      title: "President",
      group: "EXCO",
      role: "President",
      bio: null,
      imageUrl: null,
      linkedinUrl: null,
      institution: null,
      location: null,
    },
    {
      id: "e2",
      name: "Dr. Folake Kofo-Idowu",
      title: "Vice President",
      group: "EXCO",
      role: "Vice President",
      bio: null,
      imageUrl: null,
      linkedinUrl: null,
      institution: null,
      location: null,
    },
    {
      id: "e3",
      name: "Prof. Abdul Kareem Lateef",
      title: "Treasurer",
      group: "EXCO",
      role: "Treasurer",
      bio: null,
      imageUrl: null,
      linkedinUrl: null,
      institution: null,
      location: null,
    },
  ],
  BOT: [],
};

const GROUP_LABELS: Record<string, { title: string; description: string }> = {
  FOUNDER: {
    title: "Founder",
    description: "",
  },
  EXCO: {
    title: "Executive Committee",
    description:
      "The EXCO manages the day-to-day affairs of DFC, implements General Assembly resolutions, and coordinates member activities.",
  },
  BOT: {
    title: "Board of Trustees",
    description:
      "The Board of Trustees holds DFC property, oversees constitutional compliance, and safeguards the organisation's long-term interests.",
  },
};

function PersonCard({ person }: { person: LeadershipProfile }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden mb-4">
        {person.imageUrl ? (
          <Image
            src={person.imageUrl}
            alt={person.name}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#0D1F3C] flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {person.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
        )}
      </div>
      <h3 className="text-base font-semibold text-[#0D1F3C]">{person.name}</h3>
      {person.role && (
        <p className="text-sm font-medium text-[#0A4A50] mt-0.5">{person.role}</p>
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
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Linkedin className="w-3.5 h-3.5" />
          LinkedIn
        </a>
      )}
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
      {/* Hero */}
      <section className="relative bg-[#0D1F3C] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-16 lg:pt-36 lg:pb-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            About DFC
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Turning brain drain into brain gain. A global healthcare movement
            reconnecting Nigerian diaspora doctors with patients at home.
          </p>
        </div>
      </section>

      {/* Who we are */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-2xl font-bold text-[#0D1F3C] mb-6">
            Who we are
          </h2>
          <div className="space-y-4 text-base text-gray-700 leading-relaxed">
            <p>
              Doctors Foundation For Care (Doctors for Change) is a collective of
              physicians who have trained outside of Nigeria and are passionate
              about improving Nigeria&apos;s healthcare system. We are a global
              healthcare movement created to bridge the gap between Nigerians
              and the wealth of medical expertise across the world.
            </p>
            <p>
              As thousands of our brightest doctors leave the country to pursue
              residency and specialist training abroad, a gap has grown in
              Nigeria&apos;s healthcare system. DFC was built to bridge that
              gap, reconnecting foreign-trained Nigerian doctors with patients
              back home who still need their expertise, compassion, and care.
            </p>
            <p>
              At DFC, we believe in the power of collaboration to revolutionise
              healthcare in Nigeria. We focus on facilitating access to
              innovative medical technologies, advanced techniques, and essential
              training. Through this collaborative effort, DFC is committed to
              delivering superior healthcare, driving systemic improvements, and
              enhancing health outcomes across the nation.
            </p>
            <p>
              Nigerians can book consultations, specialist appointments, and
              second opinions with trusted Nigerian doctors practising across
              the world. For diaspora doctors, DFC is a movement of return and
              reconnection, a way to give back meaningfully and to strengthen a
              healthcare system that shaped our beginnings.
            </p>
            <p>
              DFC is constituted as a professional body with a General Assembly,
              Executive Committee, and Board of Trustees. It is governed by a
              written constitution and funded by membership dues.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-[#0D1F3C] mb-4">
                Our mission
              </h2>
              <p className="text-base text-gray-700 leading-relaxed">
                To lead the advancement of medical practice in Nigeria,
                facilitating access to innovative medical technologies, advanced
                techniques, and training to deliver superior healthcare and
                enhance health outcomes for all.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-[#0D1F3C] mb-4">
                Our vision
              </h2>
              <p className="text-base text-gray-700 leading-relaxed">
                A future where Nigeria&apos;s healthcare system is a beacon of
                excellence, innovation, and equitable care, empowered by
                DFC&apos;s collaborative network.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#0D1F3C] mb-6">
            What we do and why it matters
          </h2>
          <p className="text-base text-gray-700 leading-relaxed mb-8">
            Nigeria&apos;s healthcare system is under immense strain, with
            limited specialists, long wait times, and preventable deaths. Yet the
            solution already exists within our own global medical community.
            Thousands of Nigerian-trained doctors abroad are eager to contribute
            their skills and give back to the system that raised them. DFC
            transforms goodwill into impact.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Bridge the brain drain",
                text: "We turn brain drain into brain gain by reconnecting foreign-trained Nigerian doctors with their home country.",
              },
              {
                title: "Empower diaspora specialists",
                text: "We make it easy for Nigerian doctors abroad to consult, mentor, and impact care delivery from anywhere.",
              },
              {
                title: "Innovative technologies",
                text: "We facilitate access to innovative medical technologies and advanced techniques that improve patient outcomes.",
              },
              {
                title: "Rebuild trust in care",
                text: "We are building towards a future where Nigeria's healthcare system is a beacon of excellence and equitable care.",
              },
              {
                title: "Policy and advocacy",
                text: "Technical working groups developing policy frameworks, including the Emergency Response Initiative.",
              },
              {
                title: "Training and mentorship",
                text: "Hands-on fellowships and essential training for Nigerian doctors, led by experienced diaspora specialists.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <h3 className="font-semibold text-[#0D1F3C] mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Diaspora Doctors */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-2xl font-bold text-[#0D1F3C] mb-6">
            For diaspora doctors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: "Reconnect with home",
                text: "Give back to Nigeria while staying fully engaged in your international career.",
              },
              {
                title: "Consult without borders",
                text: "Offer teleconsultations, mentorship, and second opinions from anywhere, on your schedule.",
              },
              {
                title: "Earn meaningfully",
                text: "Generate income for your time and expertise while contributing to a mission that matters.",
              },
              {
                title: "Expand your reach",
                text: "Build your personal brand and professional network across continents.",
              },
              {
                title: "Collaborate with peers",
                text: "Join a trusted community of Nigerian specialists creating solutions for homegrown challenges.",
              },
              {
                title: "Turn brain drain into legacy",
                text: "Be part of the generation redefining Nigerian healthcare for the better.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-50 rounded-xl p-5"
              >
                <h3 className="font-semibold text-[#0D1F3C] mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Leadership
            </h2>
            <p className="mt-3 text-base text-gray-600">
              The people who govern and run DFC.
            </p>
          </div>

          {/* Render each group */}
          {["FOUNDER", "EXCO", "BOT"].map((groupKey) => {
            const people = leadership[groupKey];
            if (!people || people.length === 0) return null;
            const meta = GROUP_LABELS[groupKey];

            return (
              <div key={groupKey} className="mb-14 last:mb-0">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-[#0D1F3C]">
                    {meta.title}
                  </h3>
                  {meta.description && (
                    <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">
                      {meta.description}
                    </p>
                  )}
                </div>
                <div
                  className={`grid gap-8 justify-items-center ${
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

          {/* Placeholder if no EXCO/BOT data yet */}
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
