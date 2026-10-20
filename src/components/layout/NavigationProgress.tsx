"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAVIGATION_START_EVENT } from "@/lib/navigation";

// Give up after this long, so a navigation that never lands (redirected back
// to the same page, say) can't leave the bar stuck on screen.
const MAX_MS = 10_000;

/**
 * Thin bar at the top of the viewport that shows a page change is under way.
 * It starts on a click of an internal link, a back/forward step, or a
 * router.push / replace made through useRouter from @/lib/navigation, and
 * completes once the new route has rendered, i.e. the pathname or query
 * changes. App Router has no navigation events, so both ends are inferred.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const giveUp = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);

  const start = () => {
    if (active.current) return;
    active.current = true;
    if (hide.current) clearTimeout(hide.current);
    setVisible(true);
    setProgress(8);
    // Ease towards 90% so a slow page never looks finished.
    trickle.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.1 : p));
    }, 200);
    giveUp.current = setTimeout(done, MAX_MS);
  };

  function done() {
    if (!active.current) return;
    active.current = false;
    if (trickle.current) clearInterval(trickle.current);
    if (giveUp.current) clearTimeout(giveUp.current);
    setProgress(100);
    hide.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  }

  // The route currently on screen, to tell a real navigation from a no-op.
  const query = searchParams.toString();
  const rendered = useRef("");

  // Finish when the route has changed.
  useEffect(() => {
    rendered.current = pathname + (query ? `?${query}` : "");
    // Next frame, so the bar completes after the new page has painted.
    const frame = requestAnimationFrame(done);
    return () => cancelAnimationFrame(frame);
  }, [pathname, query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page or an in-page #anchor: nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start();
    };

    // Back/forward: the route effect above completes it. A hash-only change
    // renders nothing, so it must not start the bar.
    const onPop = () => {
      const now = window.location.pathname + window.location.search;
      if (now !== rendered.current) start();
    };

    // router.push / replace through useRouter from @/lib/navigation.
    const onProgrammatic = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    window.addEventListener(NAVIGATION_START_EVENT, onProgrammatic);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener(NAVIGATION_START_EVENT, onProgrammatic);
      if (trickle.current) clearInterval(trickle.current);
      if (hide.current) clearTimeout(hide.current);
      if (giveUp.current) clearTimeout(giveUp.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms ease" }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
        style={{ width: `${progress}%`, transition: "width 200ms ease-out" }}
      />
    </div>
  );
}
