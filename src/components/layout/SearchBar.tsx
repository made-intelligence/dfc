"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import { useCountUp } from "@/lib/useCountUp";
import { usePlatformStats } from "@/lib/usePlatformStats";
import { SPECIALTIES } from "@/lib/specialties";

const locations = [
  "Lagos",
  "Abuja",
  "Ibadan",
  "Port Harcourt",
  "Enugu",
  "Kano",
];

export default function SearchBar() {
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const router = useRouter();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();

  // Live counts. These were hardcoded (400 / 15 / 22) and kept displaying
  // figures the directory could not back up.
  const stats = usePlatformStats();
  const membersCount = useCountUp({ end: stats?.members ?? 0, isVisible: statsVisible && !!stats, duration: 2500 });
  const hospitalsCount = useCountUp({ end: stats?.hospitals ?? 0, isVisible: statsVisible && !!stats, duration: 2000 });
  const specialtiesCount = useCountUp({ end: stats?.specialties ?? 0, isVisible: statsVisible && !!stats, duration: 1800 });

  // Only surface a figure we actually have. A tile reading "0 Partner
  // Hospitals" is worse than no tile at all.
  const statTiles = stats
    ? [
        { value: membersCount, label: "Diaspora Physicians", show: stats.members > 0 },
        { value: hospitalsCount, label: "Partner Hospitals", show: stats.hospitals > 0 },
        { value: specialtiesCount, label: "Specialties", show: stats.specialties > 0 },
      ].filter((t) => t.show)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (city) params.set("city", city);
    const query = params.toString();
    router.push(`/book${query ? `?${query}` : ""}`);
  };

  return (
    <div className="relative z-20 bg-white">
      {/* Search form - overlaps hero */}
      <div className="-mt-8 px-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="max-w-[860px] mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3.5 text-base text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] transition-colors"
              >
                <option value="">All specialties</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3.5 text-base text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] transition-colors"
              >
                <option value="">All locations</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-[#0D1F3C] text-white font-semibold px-8 py-3.5 rounded-lg text-base hover:bg-[#162d52] transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Find a specialist
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-500 text-center">
            Or{" "}
            <Link
              href="/second-opinion"
              className="text-[#0D1F3C] font-medium underline underline-offset-2 hover:text-[#162d52]"
            >
              request a second opinion remotely
            </Link>
          </p>
        </form>
      </div>

      {/* Stats strip — hidden entirely until the real figures load */}
      <div ref={statsRef} className="max-w-[860px] mx-auto px-4 sm:px-6 mt-8 mb-4">
        {statTiles.length > 0 && (
          <div
            className={`grid divide-x divide-gray-200 ${
              statTiles.length === 1
                ? "grid-cols-1"
                : statTiles.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {statTiles.map((tile) => (
              <div key={tile.label} className="text-center py-4">
                <p className="text-2xl sm:text-3xl font-bold text-[#0D1F3C]">
                  {tile.value}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{tile.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
