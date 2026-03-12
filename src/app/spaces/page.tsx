"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  logoUrl: string | null;
}

interface ClinicalSpace {
  id: string;
  name: string;
  type: string;
  floor: string | null;
  capacity: number | null;
  equipment: string[];
  amenities: string[];
  images: string[];
  hourlyRate: number | null;
  halfDayRate: number | null;
  fullDayRate: number | null;
  currency: string;
  hospital: Hospital;
  bookedSlots: { startTime: string; endTime: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CITIES = ["All cities", "Lagos", "Abuja", "Port Harcourt", "Ibadan"];

const SPACE_TYPES: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "CONSULTING_ROOM", label: "Consulting Room" },
  { value: "PROCEDURE_ROOM", label: "Procedure Room" },
  { value: "MINOR_THEATRE", label: "Minor Theatre" },
  { value: "MAJOR_THEATRE", label: "Major Theatre" },
  { value: "ENDOSCOPY_SUITE", label: "Endoscopy Suite" },
  { value: "DIAGNOSTIC_SUITE", label: "Diagnostic Suite" },
];

const TYPE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SPACE_TYPES.filter((t) => t.value).map((t) => [t.value, t.label])
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ClinicalWorkspacePage() {
  const router = useRouter();

  /* --- filter state --- */
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  /* --- data state --- */
  const [spaces, setSpaces] = useState<ClinicalSpace[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* --- page title --- */
  useEffect(() => {
    document.title = "Clinical Workspace — DFC";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Browse and book consulting rooms, procedure suites, and theatres at DFC partner hospitals across Nigeria."
      );
    }
  }, []);

  /* --- fetch spaces --- */
  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (city && city !== "All cities") params.set("city", city);
    if (type) params.set("type", type);
    if (date) params.set("date", date);
    params.set("page", String(page));
    params.set("limit", "12");

    try {
      const res = await fetch(`/api/spaces?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load spaces");

      const data = await res.json();
      setSpaces(data.spaces ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      setError("Unable to load clinical spaces. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [city, type, date, page]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  /* --- handlers --- */
  const handleSearch = () => {
    setPage(1);
    fetchSpaces();
  };

  const handleBook = (spaceId: string) => {
    router.push(`/spaces/${spaceId}/book`);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ---- Hero ---- */}
      <section className="bg-[#0D1F3C] text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Clinical Workspace
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Book consulting rooms, procedure suites, and theatres at DFC partner
            hospitals.
          </p>
        </div>
      </section>

      {/* ---- Filter bar ---- */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-3 px-4 py-4 sm:px-6 lg:px-8">
          {/* City */}
          <div className="flex flex-col gap-1 min-w-[160px] flex-1 sm:flex-none">
            <label
              htmlFor="filter-city"
              className="text-sm font-medium text-gray-700"
            >
              City
            </label>
            <select
              id="filter-city"
              value={city || "All cities"}
              onChange={(e) => {
                setCity(e.target.value === "All cities" ? "" : e.target.value);
                setPage(1);
              }}
              className="h-11 min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-[#0D1F3C] focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Space type */}
          <div className="flex flex-col gap-1 min-w-[180px] flex-1 sm:flex-none">
            <label
              htmlFor="filter-type"
              className="text-sm font-medium text-gray-700"
            >
              Space Type
            </label>
            <select
              id="filter-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="h-11 min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-[#0D1F3C] focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20"
            >
              {SPACE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1 min-w-[160px] flex-1 sm:flex-none">
            <label
              htmlFor="filter-date"
              className="text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              id="filter-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="h-11 min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-[#0D1F3C] focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/20"
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="h-11 min-h-[44px] rounded-lg bg-[#0D1F3C] px-6 text-base font-semibold text-white transition-colors hover:bg-[#162d54] focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/40 focus:ring-offset-2 cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#0D1F3C]" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-base text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && spaces.length === 0 && (
          <div className="py-20 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              No spaces found
            </h2>
            <p className="mt-2 text-base text-gray-500">
              Try adjusting your filters or check back later for new listings.
            </p>
          </div>
        )}

        {/* Space cards grid */}
        {!loading && !error && spaces.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Card header */}
                  <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                    <p className="text-base font-semibold text-gray-900">
                      {space.hospital.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {space.hospital.city}
                      {space.hospital.state
                        ? `, ${space.hospital.state}`
                        : ""}
                    </p>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {space.name}
                      </h3>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-[#0D1F3C]/10 px-2.5 py-0.5 text-xs font-medium text-[#0D1F3C]">
                        {TYPE_LABEL_MAP[space.type] ?? space.type}
                      </span>
                    </div>

                    {/* Equipment tags */}
                    {space.equipment && space.equipment.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {space.equipment.slice(0, 5).map((eq) => (
                          <span
                            key={eq}
                            className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {eq}
                          </span>
                        ))}
                        {space.equipment.length > 5 && (
                          <span className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                            +{space.equipment.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="mt-auto pt-4">
                      <p className="text-base font-semibold text-gray-900">
                        {space.halfDayRate
                          ? `From ${formatCurrency(Number(space.halfDayRate), space.currency)} / half day`
                          : space.hourlyRate
                            ? `From ${formatCurrency(Number(space.hourlyRate), space.currency)} / hour`
                            : space.fullDayRate
                              ? `From ${formatCurrency(Number(space.fullDayRate), space.currency)} / day`
                              : "Contact for pricing"}
                      </p>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-gray-100 px-5 py-3">
                    <button
                      onClick={() => handleBook(space.id)}
                      className="w-full min-h-[44px] rounded-lg bg-[#0D1F3C] px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#162d54] focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]/40 focus:ring-offset-2 cursor-pointer"
                    >
                      Book this space
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-10 flex items-center justify-center gap-2"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-300 bg-white px-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, and pages near current
                    return (
                      p === 1 ||
                      p === pagination.pages ||
                      Math.abs(p - page) <= 1
                    );
                  })
                  .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                    if (idx > 0) {
                      const prev = arr[idx - 1];
                      if (p - prev > 1) acc.push("ellipsis");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`min-h-[44px] min-w-[44px] rounded-lg border text-base font-medium transition-colors cursor-pointer ${
                          page === item
                            ? "border-[#0D1F3C] bg-[#0D1F3C] text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page >= pagination.pages}
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-300 bg-white px-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </nav>
            )}

            {/* Result count */}
            {pagination && (
              <p className="mt-4 text-center text-sm text-gray-500">
                Showing {(page - 1) * pagination.limit + 1}–
                {Math.min(page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} spaces
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
