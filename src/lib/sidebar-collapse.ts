import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether the dashboard sidebar is collapsed to an icon rail (desktop only;
 * mobile always uses the slide-out drawer). Shared by every dashboard layout
 * and remembered per browser, so the choice follows the person around.
 */

const KEY = "dfc_sidebar_collapsed";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changing it.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSidebarCollapsed() {
  // Server render: expanded, so the first paint matches before storage is read.
  const collapsed = useSyncExternalStore(subscribe, read, () => false);

  const setCollapsed = useCallback((next: boolean) => {
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // storage unavailable: the choice lasts for this page only
    }
    listeners.forEach((l) => l());
  }, []);

  const toggle = useCallback(() => setCollapsed(!read()), [setCollapsed]);

  return { collapsed, toggle };
}
