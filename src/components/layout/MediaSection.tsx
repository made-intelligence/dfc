"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FileText,
  MessageSquare,
  Camera,
  Play,
  ExternalLink,
  Quote,
  Star,
} from "lucide-react";

const tabs = [
  { key: "testimonials", label: "Testimonials", icon: <MessageSquare className="w-4 h-4" /> },
  { key: "videos", label: "Videos", icon: <Play className="w-4 h-4" /> },
  { key: "gallery", label: "Gallery", icon: <Camera className="w-4 h-4" /> },
  { key: "publications", label: "Publications", icon: <FileText className="w-4 h-4" /> },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const testimonials = [
  {
    quote:
      "DFC gave me a structured way to give back. I now see patients at LUTH during my annual visits and the coordination works well.",
    name: "Dr. Adebayo O.",
    role: "Cardiologist",
    location: "London, UK",
    rating: 5,
  },
  {
    quote:
      "Getting a second opinion from a diaspora specialist changed my treatment plan entirely. My family finally had clarity.",
    name: "Mrs. Funke A.",
    role: "Patient",
    location: "Lagos, Nigeria",
    rating: 5,
  },
  {
    quote:
      "The endorsement system means every specialist on the platform is genuinely vetted by peers. That trust is everything.",
    name: "Dr. Ngozi E.",
    role: "Nephrologist",
    location: "Houston, USA",
    rating: 5,
  },
  {
    quote:
      "I was nervous about surgery in Nigeria until DFC connected me with a UK-trained surgeon who was visiting. Best decision I made.",
    name: "Mr. Chidi K.",
    role: "Patient",
    location: "Enugu, Nigeria",
    rating: 5,
  },
];

const videos = [
  {
    title: "Why I joined DFC",
    speaker: "Dr. Biodun Ogungbo",
    role: "Neurosurgeon, Abuja",
    thumbnail: "/hero2.jpg",
    duration: "4:32",
  },
  {
    title: "Second opinions save lives",
    speaker: "Dr. Folake Owodunni",
    role: "Emergency Medicine, Lagos",
    thumbnail: "/hero.jpg",
    duration: "3:18",
  },
  {
    title: "Building the specialist network",
    speaker: "Dr. Ahjoku Amadi-Obi",
    role: "Surgeon, Ireland",
    thumbnail: "/hero3.png",
    duration: "5:47",
  },
];

const galleryImages = [
  { src: "/hero.jpg", caption: "DFC health outreach, Lagos 2025" },
  { src: "/hero2.jpg", caption: "Specialist consultation day, LUTH" },
  { src: "/hero3.png", caption: "ERI Technical Working Group meeting" },
  { src: "/hero.jpg", caption: "Surgical camp, Ibadan" },
  { src: "/hero2.jpg", caption: "Community screening programme" },
  { src: "/hero3.png", caption: "DFC Annual General Meeting" },
];

export default function MediaSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("testimonials");

  return (
    <section className="py-16 sm:py-20 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
            Voices from the DFC Community
          </h2>
          <p className="mt-4 text-base text-[#4A5568] max-w-2xl mx-auto leading-relaxed">
            Hear from the physicians and patients whose lives have been changed.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[#0D1F3C] text-white"
                  : "bg-white text-[#4A5568] border border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
        {activeTab === "testimonials" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl border border-gray-200 p-6 sm:p-8"
              >
                <Quote className="w-8 h-8 text-[#0D1F3C]/10 absolute top-6 right-6" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-[#0F1B2D] text-base leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0D1F3C] flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {t.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F1B2D] text-sm">
                      {t.name}
                    </p>
                    <p className="text-xs text-[#4A5568]">
                      {t.role} &middot; {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── VIDEOS ───────────────────────────────────────────────── */}
        {activeTab === "videos" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((v, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={v.thumbnail}
                    alt={v.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-[#0D1F3C] ml-0.5 fill-[#0D1F3C]" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                    {v.duration}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[#0D1F3C] text-base mb-1">
                    {v.title}
                  </h3>
                  <p className="text-sm text-[#4A5568]">
                    {v.speaker} &middot; {v.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GALLERY ──────────────────────────────────────────────── */}
        {activeTab === "gallery" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"
              >
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium">
                    {img.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PUBLICATIONS ─────────────────────────────────────────── */}
        {activeTab === "publications" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              {
                title: "Emergency Response in Nigeria: A Framework for Action",
                type: "Policy Paper",
                date: "February 2026",
              },
              {
                title: "DFC Annual Report 2025",
                type: "Report",
                date: "January 2026",
              },
              {
                title: "Second Opinions in Sub-Saharan Africa: The DFC Model",
                type: "Journal Article",
                date: "November 2025",
              },
            ].map((pub, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-[#0D1F3C]/5 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#0D1F3C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#0D1F3C] text-base truncate">
                    {pub.title}
                  </h3>
                  <p className="text-sm text-[#4A5568]">
                    {pub.type} &middot; {pub.date}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
