"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface InvestigationCode {
  id: string;
  loincCode: string;
  name: string;
  category: string;
  sampleType?: string;
  fastingRequired: boolean;
}

interface InvestigationPickerProps {
  onSelect: (investigation: { name: string; type: string }) => void;
  currentValue?: string;
}

export default function InvestigationPicker({ onSelect, currentValue }: InvestigationPickerProps) {
  const [query, setQuery] = useState(currentValue || "");
  const [results, setResults] = useState<InvestigationCode[]>([]);
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
          `/api/emr/investigation-codes?q=${encodeURIComponent(q)}&limit=10`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.codes || []);
          setIsOpen(true);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function selectInvestigation(inv: InvestigationCode) {
    // Map category to investigation type
    const typeMap: Record<string, string> = {
      HAEMATOLOGY: "LAB",
      BIOCHEMISTRY: "LAB",
      MICROBIOLOGY: "LAB",
      SEROLOGY: "LAB",
      ENDOCRINOLOGY: "LAB",
      URINALYSIS: "LAB",
      IMAGING: "IMAGING",
    };

    onSelect({
      name: inv.name,
      type: typeMap[inv.category] || "LAB",
    });
    setQuery(inv.name);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search investigations (LOINC)..."
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
          {results.map((inv) => (
            <button
              key={inv.id}
              type="button"
              onClick={() => selectInvestigation(inv)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {inv.loincCode}
                </span>
                <span className="text-sm text-gray-900">{inv.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{inv.category}</span>
                {inv.sampleType && (
                  <span className="text-xs text-gray-400">
                    Sample: {inv.sampleType}
                  </span>
                )}
                {inv.fastingRequired && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                    Fasting required
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
