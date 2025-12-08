import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dfc-app.com";

  // Static routes
  const routes = [
    "",
    "/book",
    "/auth/login",
    "/faq",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
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
