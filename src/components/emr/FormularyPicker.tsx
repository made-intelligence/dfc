"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface FormularyDrug {
  id: string;
  genericName: string;
  brandNames: string[] | null;
  doseStrengths: string[] | null;
  forms: string[] | null;
  routes: string[] | null;
  frequencies: string[] | null;
  isControlled: boolean;
  isHighAlert: boolean;
  pregnancyCategory?: string;
}

interface FormularyPickerProps {
  onSelect: (drug: {
    drugName: string;
    dose: string;
    form: string;
    route: string;
    frequency: string;
  }) => void;
  currentValue?: string;
}

export default function FormularyPicker({ onSelect, currentValue }: FormularyPickerProps) {
  const [query, setQuery] = useState(currentValue || "");
  const [results, setResults] = useState<FormularyDrug[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (currentValue !== undefined) setQuery(currentValue);
  }, [currentValue]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/emr/formulary?q=${encodeURIComponent(q)}&limit=10`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.drugs || []);
          setIsOpen(true);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function selectDrug(drug: FormularyDrug) {
    const defaultForm = drug.forms?.[0] || "Tablet";
    const defaultRoute = drug.routes?.[0] || "Oral";
    const defaultDose = drug.doseStrengths?.[0] || "";
    const defaultFreq = drug.frequencies?.[0] || "";

    onSelect({
      drugName: drug.genericName,
      dose: defaultDose,
      form: defaultForm,
      route: defaultRoute,
      frequency: defaultFreq,
    });
    setQuery(drug.genericName);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search formulary..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No matches</div>
          )}
          {results.map((drug) => (
            <button
              key={drug.id}
              type="button"
              onClick={() => selectDrug(drug)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {drug.genericName}
                </span>
                {drug.isControlled && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                    Controlled
                  </span>
                )}
                {drug.isHighAlert && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                    High Alert
                  </span>
                )}
              </div>
              {drug.brandNames && drug.brandNames.length > 0 && (
                <span className="text-xs text-gray-500 block mt-0.5">
                  Brands: {drug.brandNames.slice(0, 3).join(", ")}
                </span>
              )}
              {drug.doseStrengths && (
                <span className="text-xs text-gray-400 block">
                  {drug.doseStrengths.slice(0, 3).join(" | ")}
                  {drug.forms?.[0] ? ` — ${drug.forms[0]}` : ""}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
