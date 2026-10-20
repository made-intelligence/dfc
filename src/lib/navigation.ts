import { useMemo } from "react";
import { useRouter as useNextRouter } from "next/navigation";

// Everything else (usePathname, useSearchParams, redirect, …) is unchanged.
export * from "next/navigation";

export const NAVIGATION_START_EVENT = "dfc:navigation-start";

/** Show the top loading bar for a navigation to `href`, if it changes page. */
export function startNavigationProgress(href: string) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
  } catch {
    return;
  }
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}

/**
 * next/navigation's useRouter, but push() and replace() also start the top
 * loading bar. Link clicks are picked up on their own; this covers buttons,
 * menus and form submits that navigate in code. Import it from here instead
 * of next/navigation.
 */
export function useRouter(): ReturnType<typeof useNextRouter> {
  const router = useNextRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href, options) => {
        startNavigationProgress(href);
        router.push(href, options);
      },
      replace: (href, options) => {
        startNavigationProgress(href);
        router.replace(href, options);
      },
    }),
    [router]
  );
}
