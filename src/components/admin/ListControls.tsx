"use client";

import { Button } from "@/components/ui/button";

/** Row of pill buttons for a single-choice list filter (the Members page style). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button
          key={o.value || "all"}
          type="button"
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o.value
              ? "bg-[#0D1F3C] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** "Showing x–y of n" plus Previous/Next, for server-paginated admin lists. */
export function ListPager({
  page,
  pageSize,
  totalCount,
  totalPages,
  noun,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  noun: string;
  onPageChange: (page: number) => void;
}) {
  if (totalCount === 0) return null;
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row">
      <p className="text-sm text-gray-500">
        Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, totalCount)} of{" "}
        {totalCount} {noun}
        {totalCount !== 1 ? "s" : ""}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="px-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
