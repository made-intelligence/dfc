import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dfc-app.com";

  // Static routes
  const routes = [
    { path: "", priority: 1 },
    { path: "/book", priority: 0.9 },
    { path: "/second-opinion", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/faq", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
    { path: "/events", priority: 0.7 },
    { path: "/partners", priority: 0.6 },
    { path: "/privacy-policy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
    { path: "/auth/login", priority: 0.5 },
    { path: "/auth/register", priority: 0.5 },
    { path: "/auth/join", priority: 0.5 },
  ].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  // Dynamic routes (Doctors)
  const doctors = await prisma.doctorProfile.findMany({
    select: {
        slug: true,
        updatedAt: true,
    },

  });

  const doctorRoutes = doctors.map((doctor) => ({
    url: `${baseUrl}/book/${doctor.slug}`,
    lastModified: doctor.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...routes, ...doctorRoutes];
}
