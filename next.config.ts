import type { NextConfig } from "next";
import withPWA from "next-pwa";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.paystack.co https://api.anthropic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
  },
  serverExternalPackages: ['react-dom/server'],
  async headers() {
    // Same-origin app requests don't rely on this header; it only governs
    // cross-origin browser access. Pin it to the canonical production origin
    // (never "*" alongside Allow-Credentials, which browsers reject anyway).
    const allowedOrigins = process.env.NODE_ENV === "production"
      ? (process.env.NEXT_PUBLIC_APP_URL || "https://www.dfcare.org")
      : "http://localhost:3000";

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: allowedOrigins },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, x-csrf-token, x-api-key" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development to prevent constant reloads
})(nextConfig as any);
