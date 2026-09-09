"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Star,
  MapPin,
  Stethoscope,
  Building2,
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  Clock,
  Briefcase,
  Video,
} from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";
import { SPECIALTIES, normalizeSpecialtyName } from "@/lib/specialties";
import { usePlatformStats } from "@/lib/usePlatformStats";

interface Specialty {
  id: string;
  name: string;
  description: string | null;
  doctorCount: number;
}

interface Doctor {
  id: string;
  slug: string;
  name: string;
  profileImage: string | null;
  specialty: string;
  specialtyId: string | null;
  consultationFee: number | string;
  currency: string;
  country: string;
  bio: string | null;
  experience: number;
  rating: number;
  totalRatings: number;
  institution?: string;
  city?: string;
  hasVideo?: boolean;
  hasInPerson?: boolean;
  clinicLocation?: string | null;
}

// ─── Constants ─────────────────────────────────────────────────
const COUNTRIES = [
  "United Kingdom",
  "United States",
  "Canada",
  "Ireland",
  "Germany",
  "Nigeria",
  "Australia",
];

const EXPERIENCE_OPTIONS = [
  { label: "Any experience", value: "0" },
  { label: "5+ years", value: "5" },
  { label: "10+ years", value: "10" },
  { label: "20+ years", value: "20" },
];

const FEE_OPTIONS = [
  { label: "Any fee", value: "", min: "", max: "" },
  { label: "Free consultation", value: "free", min: "0", max: "0" },
  { label: "Under \u20A620,000", value: "under20k", min: "", max: "20000" },
  { label: "\u20A620,000 – \u20A650,000", value: "20k-50k", min: "20000", max: "50000" },
  { label: "\u20A650,000+", value: "50k+", min: "50000", max: "" },
];

const RATING_OPTIONS = [
  { label: "Any rating", value: "0" },
  { label: "4.0+ stars", value: "4" },
  { label: "4.5+ stars", value: "4.5" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Most experienced", value: "experience" },
  { label: "Highest rated", value: "rating" },
  { label: "Fee: Low to high", value: "fee_low" },
  { label: "Fee: High to low", value: "fee_high" },
];

// ─── Main Component ────────────────────────────────────────────
function BookPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [draftSpecialty, setDraftSpecialty] = useState("");
  const [draftCountry, setDraftCountry] = useState("");
  const [draftSearch, setDraftSearch] = useState("");

  const [search, setSearch] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedSpecialtyName, setSelectedSpecialtyName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [minExperience, setMinExperience] = useState("0");
  const [feeRange, setFeeRange] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const platformStats = usePlatformStats();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);

  useEffect(() => {
    const urlSpecialty = searchParams.get("specialty");
    const urlCountry = searchParams.get("country");
    const urlCity = searchParams.get("city") || searchParams.get("location");
    const urlQ = searchParams.get("q") || searchParams.get("search");
    if (urlSpecialty) { const d = decodeURIComponent(urlSpecialty); setDraftSpecialty(d); setSelectedSpecialtyName(d); }
    if (urlCountry) { const d = decodeURIComponent(urlCountry); setDraftCountry(d); setSelectedCountry(d); }
    // A city is a real filter, not free text: routing it through `search`
    // matched it against names and bios instead of the city column.
    if (urlCity) setSelectedCity(decodeURIComponent(urlCity));
    if (urlQ) { const d = decodeURIComponent(urlQ); setDraftSearch(d); setSearch(d); }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/public/specialties")
      .then((r) => r.json())
      .then((data) => {
        const specs = (data.specialties || []).filter((s: Specialty) => s.doctorCount > 0);
        setSpecialties(specs);
        const urlSpecialty = searchParams.get("specialty");
        if (urlSpecialty) {
          const target = normalizeSpecialtyName(decodeURIComponent(urlSpecialty));
          const match = specs.find((s: Specialty) => normalizeSpecialtyName(s.name) === target);
          if (match) setSelectedSpecialtyId(match.id);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      // Always pass the specialty through. Falling back to the name matters
      // when the chosen specialty has no doctors at all and therefore has no
      // id — dropping it here silently returned the entire directory.
      if (selectedSpecialtyId) params.append("specialtyId", selectedSpecialtyId);
      else if (selectedSpecialtyName) params.append("specialty", selectedSpecialtyName);
      if (selectedCountry) params.append("country", selectedCountry);
      if (selectedCity) params.append("city", selectedCity);
      if (minExperience !== "0") params.append("minExperience", minExperience);
      if (minRating !== "0") params.append("minRating", minRating);
      if (sortBy !== "newest") params.append("sort", sortBy);
      const feeOption = FEE_OPTIONS.find((f) => f.value === feeRange);
      if (feeOption?.min) params.append("minFee", feeOption.min);
      if (feeOption?.max) params.append("maxFee", feeOption.max);
      params.append("page", page.toString());
      params.append("limit", "12");
      const response = await fetch(`/api/public/doctors?${params}`);
      if (!response.ok) throw new Error("Failed to load specialists");
      const data = await response.json();
      setDoctors(data.doctors || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalDoctors(data.pagination?.total || 0);
    } catch {
      // A failed request is not the same as an empty directory — don't tell
      // the visitor there are no specialists when we simply couldn't ask.
      setDoctors([]);
      setTotalPages(1);
      setTotalDoctors(0);
      setLoadError(true);
    } finally { setLoading(false); }
  }, [search, selectedSpecialtyId, selectedSpecialtyName, selectedCountry, selectedCity, minExperience, feeRange, minRating, sortBy, page]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedSpecialtyName) params.set("specialty", selectedSpecialtyName);
    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedCity) params.set("city", selectedCity);
    if (minExperience !== "0") params.set("exp", minExperience);
    if (feeRange) params.set("fee", feeRange);
    if (minRating !== "0") params.set("rating", minRating);
    if (sortBy !== "newest") params.set("sort", sortBy);
    const newUrl = params.toString() ? `?${params}` : "/book";
    router.replace(newUrl, { scroll: false });
  }, [search, selectedSpecialtyName, selectedCountry, selectedCity, minExperience, feeRange, minRating, sortBy, router]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (draftSpecialty) {
      const target = normalizeSpecialtyName(draftSpecialty);
      const match = specialties.find((s) => normalizeSpecialtyName(s.name) === target);
      setSelectedSpecialtyId(match?.id || null);
      setSelectedSpecialtyName(draftSpecialty);
    } else { setSelectedSpecialtyId(null); setSelectedSpecialtyName(""); }
    setSelectedCountry(draftCountry);
    setSearch(draftSearch);
    setPage(1);
  };

  const handleSpecialtyPill = (specId: string | null, specName: string) => {
    if (selectedSpecialtyId === specId) { setSelectedSpecialtyId(null); setSelectedSpecialtyName(""); setDraftSpecialty(""); }
    else { setSelectedSpecialtyId(specId); setSelectedSpecialtyName(specName); setDraftSpecialty(specName); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setDraftSearch(""); setSelectedSpecialtyId(null); setSelectedSpecialtyName("");
    setDraftSpecialty(""); setSelectedCountry(""); setDraftCountry(""); setSelectedCity("");
    setMinExperience("0"); setFeeRange(""); setMinRating("0"); setSortBy("newest"); setPage(1);
  };

  const hasFilters = search || selectedSpecialtyName || selectedCountry || selectedCity;
  const hasDetailedFilters = minExperience !== "0" || feeRange || minRating !== "0";
  const activeFilterCount =
    (search ? 1 : 0) + (selectedSpecialtyName ? 1 : 0) + (selectedCountry ? 1 : 0) + (selectedCity ? 1 : 0) +
    (minExperience !== "0" ? 1 : 0) + (feeRange ? 1 : 0) + (minRating !== "0" ? 1 : 0);

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-[#F8F9FB]">
        {/* ─── Hero Section — Pure gradient, no image ────────── */}
        <div className="relative text-white pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
          {/* Layered gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold mb-4 leading-[1.1] tracking-tight">
                Consult with World-Trained
                <br className="hidden sm:block" />
                <span className="text-emerald-300">
                  {" "}Nigerian Physicians
                </span>
              </h1>
              <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
                Browse our network of diaspora specialists practising across the UK,
                US, Canada, and beyond. Book a secure video consultation today.
              </p>
            </div>

            {/* Search form */}
            <form
              onSubmit={handleSearch}
              className="bg-white/[0.97] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-4 sm:p-5 border border-white/50"
            >
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <select
                    value={draftSpecialty}
                    onChange={(e) => setDraftSpecialty(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-gray-900 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-[#0A6E75]/30 focus:border-[#0A6E75] transition-all"
                  >
                    <option value="">All specialties</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={draftCountry}
                    onChange={(e) => setDraftCountry(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base text-gray-900 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-[#0A6E75]/30 focus:border-[#0A6E75] transition-all"
                  >
                    <option value="">All locations</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-[#0A6E75] text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-[#085c62] transition-all duration-200 hover:shadow-lg hover:shadow-[#0A6E75]/25 cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 border border-gray-200 rounded-xl px-4 bg-gray-50/80">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                  placeholder="Or search by doctor name, keyword..."
                  className="w-full py-3 text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                />
                {draftSearch && (
                  <button type="button" onClick={() => setDraftSearch("")} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 mt-6 text-sm text-white/40">
              {/* Live counts. "7 countries" used to be hardcoded here. */}
              {specialties.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>
                    {specialties.length} specialt{specialties.length === 1 ? "y" : "ies"}
                  </span>
                </div>
              )}
              {!!platformStats?.countries && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {platformStats.countries} countr{platformStats.countries === 1 ? "y" : "ies"}
                  </span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Same-week appointments</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Filter Bar ────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => handleSpecialtyPill(null, "")}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    !selectedSpecialtyId
                      ? "bg-[#0D1F3C] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {specialties.map((s) => {
                  const isActive = selectedSpecialtyId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSpecialtyPill(s.id, s.name)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border ${
                        isActive
                          ? "bg-[#0D1F3C] text-white border-[#0D1F3C] shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {s.name}
                      <span className="ml-1.5 text-xs opacity-60">{s.doctorCount}</span>
                    </button>
                  );
                })}
              </div>

              <div className="shrink-0 flex items-center gap-2 border-l border-gray-200 pl-3">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    filtersOpen || hasDetailedFilters
                      ? "border-[#0A6E75] bg-[#0A6E75]/5 text-[#0A6E75]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-[#0A6E75] text-white text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-[#0A6E75]/20 outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filtersOpen && (
              <div className="border-t border-gray-100 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Experience</label>
                    <select value={minExperience} onChange={(e) => { setMinExperience(e.target.value); setPage(1); }}
                      className="w-full px-3.5 py-2.5 text-base border border-gray-200 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none">
                      {EXPERIENCE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Consultation fee</label>
                    <select value={feeRange} onChange={(e) => { setFeeRange(e.target.value); setPage(1); }}
                      className="w-full px-3.5 py-2.5 text-base border border-gray-200 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none">
                      {FEE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Minimum rating</label>
                    <select value={minRating} onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                      className="w-full px-3.5 py-2.5 text-base border border-gray-200 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none">
                      {RATING_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </div>
                </div>
                {hasDetailedFilters && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => { setMinExperience("0"); setFeeRange(""); setMinRating("0"); setPage(1); }}
                      className="text-sm text-[#0A6E75] font-medium hover:underline">
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Results ───────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0D1F3C]">
                {selectedSpecialtyName ? `${selectedSpecialtyName} Specialists` : "Available Specialists"}
              </h2>
              {!loading && !loadError && (
                <p className="text-base text-gray-500 mt-1">
                  {totalDoctors} specialist{totalDoctors !== 1 ? "s" : ""} found
                  {selectedCity ? ` in ${selectedCity}` : selectedCountry ? ` in ${selectedCountry}` : ""}
                </p>
              )}
            </div>
            {(hasFilters || hasDetailedFilters) && (
              <button onClick={clearFilters} className="text-sm text-[#0A6E75] font-medium hover:underline">Clear all</button>
            )}
          </div>

          {/* Active filter tags */}
          {(hasFilters || hasDetailedFilters) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1F3C]/5 text-[#0D1F3C] rounded-full text-sm font-medium">
                  <Search className="w-3 h-3" />&ldquo;{search}&rdquo;
                  <button onClick={() => { setSearch(""); setDraftSearch(""); setPage(1); }}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {selectedSpecialtyName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-[#0D1F3C]/5 text-[#0D1F3C] border-[#0D1F3C]/10">
                  <Stethoscope className="w-3 h-3" />{selectedSpecialtyName}
                  <button onClick={() => { setSelectedSpecialtyId(null); setSelectedSpecialtyName(""); setDraftSpecialty(""); setPage(1); }}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {selectedCountry && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1F3C]/5 text-[#0D1F3C] rounded-full text-sm font-medium">
                  <Globe className="w-3 h-3" />{selectedCountry}
                  <button onClick={() => { setSelectedCountry(""); setDraftCountry(""); setPage(1); }}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {selectedCity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1F3C]/5 text-[#0D1F3C] rounded-full text-sm font-medium">
                  <MapPin className="w-3 h-3" />{selectedCity}
                  <button onClick={() => { setSelectedCity(""); setPage(1); }}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {minExperience !== "0" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {minExperience}+ years
                  <button onClick={() => { setMinExperience("0"); setPage(1); }}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {feeRange && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {FEE_OPTIONS.find((f) => f.value === feeRange)?.label}
                  <button onClick={() => { setFeeRange(""); setPage(1); }}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {minRating !== "0" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{minRating}+
                  <button onClick={() => { setMinRating("0"); setPage(1); }}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="h-3 rounded-t-2xl bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Stethoscope className="w-9 h-9 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-[#0D1F3C] mb-2">We couldn&rsquo;t load the directory</h3>
              <p className="text-base text-gray-500 max-w-md mx-auto mb-6">
                Something went wrong while fetching specialists. This is not a
                reflection of who is available. Please try again.
              </p>
              <button onClick={() => fetchDoctors()} className="px-6 py-3 bg-[#0D1F3C] text-white font-semibold rounded-xl hover:bg-[#162d52] transition-colors">
                Try again
              </button>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Stethoscope className="w-9 h-9 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-[#0D1F3C] mb-2">
                {selectedSpecialtyName
                  ? `No ${selectedSpecialtyName} specialists available`
                  : "No specialists found"}
              </h3>
              <p className="text-base text-gray-500 max-w-md mx-auto mb-6">
                {selectedSpecialtyName
                  ? `No ${selectedSpecialtyName} specialist is taking bookings right now. Try another specialty, or request a second opinion and we will route your case.`
                  : hasFilters || hasDetailedFilters
                    ? "Try adjusting your search or filters to find more specialists."
                    : "No specialists are currently available. Please check back soon."}
              </p>
              {(hasFilters || hasDetailedFilters) && (
                <button onClick={clearFilters} className="px-6 py-3 bg-[#0D1F3C] text-white font-semibold rounded-xl hover:bg-[#162d52] transition-colors">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ─── Doctor Cards with Specialty Colors ────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                    <Link
                      key={doctor.id}
                      href={`/book/${doctor.slug}`}
                      className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                    >
                      {/* Subtle accent strip */}
                      <div className="h-1 bg-gradient-to-r from-[#0A3454] to-[#0A6E75]" />

                      {/* Card body */}
                      <div className="p-5 pt-4">
                        {/* Specialty + rating row */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border bg-gray-50 text-gray-600 border-gray-200">
                            <Stethoscope className="w-3 h-3" />
                            {doctor.specialty}
                          </span>
                          {doctor.rating > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {doctor.rating.toFixed(1)}
                              <span className="text-gray-400">({doctor.totalRatings})</span>
                            </span>
                          )}
                        </div>

                        {/* Avatar + Name */}
                        <div className="flex items-center gap-3.5 mb-3">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-200 shrink-0">
                            {doctor.profileImage ? (
                              <Image src={doctor.profileImage} alt={doctor.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#0A3454] to-[#0A6E75] flex items-center justify-center">
                                <User className="w-6 h-6 text-white/90" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-[#0D1F3C] truncate group-hover:text-[#0A6E75] transition-colors">
                              {doctor.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                              {doctor.experience > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {doctor.experience}yr{doctor.experience !== 1 ? "s" : ""}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {doctor.country}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Location details */}
                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                          {doctor.institution && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{doctor.institution}</span>
                            </span>
                          )}
                          {doctor.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {doctor.city}
                            </span>
                          )}
                        </div>

                        {doctor.bio && (
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                            {doctor.bio}
                          </p>
                        )}

                        {/* Consultation mode badges */}
                        <div className="flex items-center gap-2 mb-4">
                          {(doctor.hasVideo || (!doctor.hasVideo && !doctor.hasInPerson)) && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                              <Video className="w-3 h-3" />
                              Video
                            </span>
                          )}
                          {doctor.hasInPerson && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <MapPin className="w-3 h-3" />
                              In-Person
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          {Number(doctor.consultationFee) > 0 ? (
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Fee</p>
                              <p className="text-base font-bold text-[#0D1F3C]">
                                {doctor.currency === "NGN" ? "\u20A6" : doctor.currency + " "}
                                {Number(doctor.consultationFee).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Fee on request</span>
                          )}
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A6E75] group-hover:gap-2 transition-all duration-200">
                            View profile
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button key={pageNum} onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                            page === pageNum ? "bg-[#0D1F3C] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                          }`}>
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-gray-400 px-1">...</span>}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Next<ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BookPageClient() {
  return (
    <Suspense fallback={<Loading />}>
      <BookPageContent />
    </Suspense>
  );
}
