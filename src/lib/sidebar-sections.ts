import { useCallback, useSyncExternalStore } from "react";

/**
 * Which sidebar section headings the person has folded shut. Remembered per
 * browser, like the icon-rail toggle in sidebar-collapse.ts, so a long admin
 * menu stays the way they left it.
 */

const KEY = "dfc_sidebar_closed_sections";
const listeners = new Set<() => void>();

// useSyncExternalStore needs a stable snapshot, so cache by the raw string.
let cachedRaw: string | null = null;
let cachedValue: string[] = [];
// Fallback when storage is unavailable: the choice lasts for this page only.
let memoryRaw: string | null = null;

function read(): string[] {
  let raw = memoryRaw;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // storage unavailable: use memoryRaw
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    cachedValue = [];
  }
  return cachedValue;
}

const EMPTY: string[] = [];

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useClosedSidebarSections() {
  // Server render: all open, so the first paint matches before storage is read.
  const closed = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((section: string) => {
    const current = read();
    const next = current.includes(section)
      ? current.filter((s) => s !== section)
      : [...current, section];
    memoryRaw = JSON.stringify(next);
    try {
      localStorage.setItem(KEY, memoryRaw);
    } catch {
      // storage unavailable: memoryRaw carries it
    }
    listeners.forEach((l) => l());
  }, []);

  return { closed, toggle };
}
