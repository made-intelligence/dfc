import { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = appUrl();

  // Static routes with SEO priority
  const staticRoutes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/book", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/specialists", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/second-opinion", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/events", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/projects", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/partners", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/auth/join", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/auth/login", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/auth/register", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic: Doctor profiles (public booking pages)
  let doctorRoutes: MetadataRoute.Sitemap = [];
  let specialistRoutes: MetadataRoute.Sitemap = [];

  try {
    // /book and /specialists are served by different queries, so a slug that
    // appears on one does not necessarily resolve on the other. Listing every
    // doctor under both paths published URLs that render empty, which wastes
    // crawl budget and reads as thin content.
    const doctors = await prisma.doctorProfile.findMany({
      where: { isAvailable: true, user: { isActive: true } },
      select: { slug: true, updatedAt: true },
    });

    doctorRoutes = doctors.map((doctor) => ({
      url: `${baseUrl}/book/${doctor.slug}`,
      lastModified: doctor.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Mirrors /api/public/specialists: active members only.
    const specialists = await prisma.doctorProfile.findMany({
      where: {
        slug: { not: undefined },
        user: { isActive: true, dfcMember: { status: "ACTIVE" } },
      },
      select: { slug: true, updatedAt: true },
    });

    specialistRoutes = specialists.map((specialist) => ({
      url: `${baseUrl}/specialists/${specialist.slug}`,
      lastModified: specialist.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Database unavailable at build time — static routes only
  }

  return [...staticRoutes, ...doctorRoutes, ...specialistRoutes];
}
