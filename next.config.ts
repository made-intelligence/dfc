import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {}, // Empty turbopack config to silence webpack/turbopack conflict
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development to prevent constant reloads
})(nextConfig as any);
