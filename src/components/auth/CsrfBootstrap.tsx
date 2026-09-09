"use client";

import { useEffect } from "react";
import { installCsrfFetch } from "@/lib/csrf-client";

/**
 * Installs the CSRF fetch wrapper for the whole app. Renders nothing.
 * Mounted once in the root layout, above every route that performs writes.
 */
export default function CsrfBootstrap() {
  useEffect(() => {
    installCsrfFetch();
  }, []);

  return null;
}
