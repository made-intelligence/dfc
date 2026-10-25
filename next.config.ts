import type { NextConfig } from "next";
import withPWA from "next-pwa";
import { appUrl } from "./src/lib/app-url";

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
    value: contentSecurityPolicy(),
  },
];

function contentSecurityPolicy(opts: { video?: boolean } = {}) {
  // Daily.co (teleconsult video): daily-js loads its call engine from c.daily.co
  // and signals over *.daily.co / *.pluot.blue. Media itself flows over WebRTC,
  // which CSP does not govern.
  const daily = opts.video ? " https://*.daily.co" : "";
  const dailyConnect = opts.video
    ? " https://*.daily.co wss://*.daily.co https://*.pluot.blue wss://*.pluot.blue"
    : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'${daily}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.cloudinary.com",
    "font-src 'self' data:",
    `connect-src 'self' https://*.paystack.co https://api.anthropic.com${dailyConnect}`,
    ...(opts.video ? ["worker-src 'self' blob:", "media-src 'self' blob:"] : []),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

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
  async redirects() {
    // Public patient signup was retired; send old links to the membership
    // application. Patients still get accounts through guest booking.
    return [{ source: "/auth/register", destination: "/auth/join", permanent: true }];
  },
  async headers() {
    // Same-origin app requests don't rely on this header; it only governs
    // cross-origin browser access. Pin it to the canonical production origin
    // (never "*" alongside Allow-Credentials, which browsers reject anyway).
    const allowedOrigins = appUrl();

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // The consultation room is the only page that may use the camera,
        // microphone and location, and the only one that talks to Daily.
        // Listed after the catch-all so these values replace its defaults.
        source: "/room/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self), display-capture=(self)",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy({ video: true }) },
        ],
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
