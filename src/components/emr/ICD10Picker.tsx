"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface DiagnosisCode {
  id: string;
  code: string;
  name: string;
  chapter?: string;
  isDSM5?: boolean;
}

interface ICD10PickerProps {
  value: string;
  codeValue: string;
  onSelect: (name: string, code: string) => void;
  placeholder?: string;
  label?: string;
}

export default function ICD10Picker({
  value,
  codeValue,
  onSelect,
  placeholder = "Search diagnoses...",
  label = "Primary Diagnosis",
}: ICD10PickerProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<DiagnosisCode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click
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
          `/api/emr/diagnosis-codes?q=${encodeURIComponent(q)}&limit=10`,
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

  function selectCode(code: DiagnosisCode) {
    setQuery(code.name);
    onSelect(code.name, code.code);
    setIsOpen(false);
  }

  function clearSelection() {
    setQuery("");
    onSelect("", "");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          className="w-full rounded-lg border border-gray-200 pl-9 pr-8 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
        />
        {(query || codeValue) && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {codeValue && (
        <span className="inline-block mt-1 text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
          {codeValue}
        </span>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No matches found</div>
          )}
          {results.map((code) => (
            <button
              key={code.id}
              type="button"
              onClick={() => selectCode(code)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                  {code.code}
                </span>
                <span className="text-sm text-gray-900 truncate">{code.name}</span>
              </div>
              {code.chapter && (
                <span className="text-xs text-gray-400 mt-0.5 block">{code.chapter}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
