import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dfcare.org";

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

    specialistRoutes = doctors.map((doctor) => ({
      url: `${baseUrl}/specialists/${doctor.slug}`,
      lastModified: doctor.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Database unavailable at build time — static routes only
  }

  return [...staticRoutes, ...doctorRoutes, ...specialistRoutes];
}
