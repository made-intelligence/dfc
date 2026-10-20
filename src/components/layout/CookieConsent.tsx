"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, ShieldCheck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const CONSENT_KEY = "dfc_cookie_consent";

// Sign-in/sign-up and signed-in areas are not public pages, so no banner there.
const NON_PUBLIC_PREFIXES = [
  "/auth", "/admin", "/member", "/doctor", "/hospital", "/spl",
  "/profile", "/appointments", "/renew",
];

function isPublicPath(pathname: string | null) {
  if (!pathname) return true;
  return !NON_PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

interface CookiePrefs {
  essential: true;
  analytics: boolean;
}

function readConsent(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics === "boolean") {
      return { essential: true, analytics: parsed.analytics };
    }
    return null;
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  // Any non-null value means the visitor has already made a choice.
  return readConsent() !== null;
}

function getServerSnapshot() {
  // Assume "decided" during SSR/first paint so the banner never
  // flashes before hydration can check localStorage for a real answer.
  return true;
}

function saveConsent(prefs: CookiePrefs) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...prefs, decidedAt: new Date().toISOString() }));
  } catch {
    // ignore storage errors (private browsing, etc.)
  }
  window.dispatchEvent(new Event("storage"));
}

export default function CookieConsent() {
  const decided = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [view, setView] = useState<"summary" | "manage">("summary");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const pathname = usePathname();

  if (decided || !isPublicPath(pathname)) return null;

  const acceptAll = () => saveConsent({ essential: true, analytics: true });
  const rejectOptional = () => saveConsent({ essential: true, analytics: false });
  const savePreferences = () => saveConsent({ essential: true, analytics: analyticsEnabled });

  // Non-blocking bar pinned to the bottom: the page stays scrollable and usable.
  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-3 shadow-lg sm:inset-x-4 sm:bottom-4 sm:p-4"
    >
      {view === "summary" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2">
            <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-[#0D1F3C]" />
            <p className="text-xs leading-relaxed text-gray-600">
              We use cookies to keep the platform secure and understand how it&apos;s used. See our{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-[#0A6E75] underline underline-offset-2 hover:text-[#0D1F3C]"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
            <Button size="sm" variant="ghost" onClick={() => setView("manage")} className="cursor-pointer">
              Manage
            </Button>
            <Button size="sm" variant="outline" onClick={rejectOptional} className="cursor-pointer">
              Reject optional
            </Button>
            <Button size="sm" onClick={acceptAll} className="cursor-pointer bg-[#0D1F3C] hover:bg-[#0D1F3C]/90">
              Accept all
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-[#0D1F3C]">Cookie preferences</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#0D1F3C]" />
                <span className="text-xs text-gray-700">Essential (always active)</span>
              </div>
              <Switch checked disabled className="shrink-0 cursor-not-allowed" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0 text-[#0D1F3C]" />
                <span className="text-xs text-gray-700">Analytics</span>
              </div>
              <Switch
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
                className="shrink-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setView("summary")} className="cursor-pointer">
              Back
            </Button>
            <Button size="sm" onClick={savePreferences} className="cursor-pointer bg-[#0D1F3C] hover:bg-[#0D1F3C]/90">
              Save
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
