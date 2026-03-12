import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dfcare.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/doctor",
          "/doctor/*",
          "/member",
          "/member/*",
          "/hospital",
          "/hospital/*",
          "/spl",
          "/spl/*",
          "/api",
          "/api/*",
          "/profile",
          "/appointments",
          "/room",
          "/room/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/book",
          "/book/*",
          "/specialists",
          "/specialists/*",
          "/second-opinion",
          "/about",
          "/faq",
          "/contact",
          "/events",
          "/partners",
          "/projects",
          "/auth/join",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
