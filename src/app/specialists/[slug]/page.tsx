import { Metadata, ResolvingMetadata } from "next";
import { appUrl } from "@/lib/app-url";
import SpecialistProfileClient from "@/components/specialists/SpecialistProfileClient";
import { DoctorJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

interface Specialist {
  name: string;
  title?: string;
  specialty?: string;
  subSpecialty?: string;
  institution?: string;
  city?: string;
  country?: string;
  bio?: string;
  profileImage?: string;
  endorsementCount?: number;
}

/**
 * Fetched on the server so the profile carries a real title, description and
 * Physician markup. This page used to be a client component, which left all
 * ~94 specialist profiles sharing the site-wide default title and shipping an
 * empty body to crawlers.
 */
async function getSpecialist(slug: string): Promise<Specialist | null> {
  try {
    const res = await fetch(
      `${appUrl()}/api/public/specialists?slug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const list: Specialist[] = data.specialists ?? data ?? [];
    return list[0] ?? null;
  } catch {
    return null;
  }
}

/** "Dr Ada Okeke, Consultant Cardiologist at LUTH, Lagos." */
function describe(s: Specialist): string {
  if (s.bio?.trim()) return s.bio.trim().slice(0, 158);

  const role = [s.subSpecialty, s.specialty].filter(Boolean).join(", ");
  const place = [s.institution, s.city].filter(Boolean).join(", ");
  const parts = [`${s.title ? s.title + " " : ""}${s.name}`];
  if (role) parts.push(`${role} specialist`);
  if (place) parts.push(`practising at ${place}`);

  return `${parts.join(", ")}. Verified member of the Doctors Foundation for Care specialist network.`.slice(0, 158);
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const specialist = await getSpecialist(slug);

  if (!specialist) {
    return { title: "Specialist not found", robots: { index: false, follow: true } };
  }

  const description = describe(specialist);
  const headline = [specialist.specialty, specialist.city].filter(Boolean).join(" in ");
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: headline ? `${specialist.name} — ${headline}` : specialist.name,
    description,
    alternates: { canonical: `/specialists/${slug}` },
    openGraph: {
      type: "profile",
      title: `${specialist.name}${specialist.specialty ? ` — ${specialist.specialty}` : ""}`,
      description,
      url: `${appUrl()}/specialists/${slug}`,
      images: specialist.profileImage
        ? [{ url: specialist.profileImage, width: 600, height: 600, alt: specialist.name }, ...previousImages]
        : previousImages,
    },
  };
}

export default async function SpecialistProfilePage({ params }: Props) {
  const { slug } = await params;
  const specialist = await getSpecialist(slug);
  const baseUrl = appUrl();

  return (
    <>
      {specialist && (
        <>
          <DoctorJsonLd
            name={specialist.name}
            specialty={specialist.specialty || "Medicine"}
            description={specialist.bio}
            image={specialist.profileImage}
            url={`${baseUrl}/specialists/${slug}`}
          />
          <BreadcrumbJsonLd
            items={[
              { name: "Home", url: baseUrl },
              { name: "Find a Specialist", url: `${baseUrl}/specialists` },
              { name: specialist.name, url: `${baseUrl}/specialists/${slug}` },
            ]}
          />
        </>
      )}
      <SpecialistProfileClient slug={slug} />
    </>
  );
}
