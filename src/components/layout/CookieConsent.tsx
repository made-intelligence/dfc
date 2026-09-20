"use client";

import { useState, useSyncExternalStore } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { Cookie, ShieldCheck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const CONSENT_KEY = "dfc_cookie_consent";

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
  // Assume "decided" during SSR/first paint so the blocking modal never
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

  const open = !decided;

  const acceptAll = () => saveConsent({ essential: true, analytics: true });
  const rejectOptional = () => saveConsent({ essential: true, analytics: false });
  const savePreferences = () => saveConsent({ essential: true, analytics: analyticsEnabled });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl focus:outline-none sm:p-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0D1F3C]/10">
              <Cookie className="h-5 w-5 text-[#0D1F3C]" />
            </div>
            <DialogPrimitive.Title className="text-lg font-bold text-[#0D1F3C]">
              {view === "summary" ? "We value your privacy" : "Cookie Preferences"}
            </DialogPrimitive.Title>
          </div>
          <DialogPrimitive.Description className="sr-only">
            Choose how the platform may use cookies on this site before continuing.
          </DialogPrimitive.Description>

          {view === "summary" ? (
            <>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                This platform uses cookies to keep the platform secure, remember your
                sign-in, and understand how the site is used so we can
                improve it. You can accept all cookies, reject optional ones,
                or manage your preferences. See our{" "}
                <Link
                  href="/privacy-policy"
                  className="font-medium text-[#0A6E75] underline underline-offset-2 hover:text-[#0D1F3C]"
                >
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setView("manage")}
                  className="w-full cursor-pointer sm:w-auto"
                >
                  Manage Cookies
                </Button>
                <Button
                  variant="outline"
                  onClick={rejectOptional}
                  className="w-full cursor-pointer sm:w-auto"
                >
                  Reject Optional Cookies
                </Button>
                <Button
                  onClick={acceptAll}
                  className="w-full cursor-pointer bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 sm:w-auto"
                >
                  Accept All Cookies
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                Choose which categories of cookies you&apos;re comfortable
                with. Essential cookies keep the platform working and can&apos;t
                be turned off.
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0D1F3C]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Essential Cookies
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Required for security, login, and core site
                        functionality. Always active.
                      </p>
                    </div>
                  </div>
                  <Switch checked disabled className="mt-1 shrink-0 cursor-not-allowed" />
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-[#0D1F3C]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Analytics Cookies
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Help us understand how the platform is used so we can
                        improve performance and usability.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={analyticsEnabled}
                    onCheckedChange={setAnalyticsEnabled}
                    className="mt-1 shrink-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setView("summary")}
                  className="w-full cursor-pointer sm:w-auto"
                >
                  Back
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    variant="outline"
                    onClick={rejectOptional}
                    className="w-full cursor-pointer sm:w-auto"
                  >
                    Reject Optional Cookies
                  </Button>
                  <Button
                    onClick={savePreferences}
                    className="w-full cursor-pointer bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 sm:w-auto"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
