import { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = appUrl();

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
