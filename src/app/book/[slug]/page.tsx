import { Metadata, ResolvingMetadata } from "next";
import DoctorProfileClient from "@/components/booking/DoctorProfileClient";
import { DoctorJsonLd } from "@/components/seo/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getDoctor(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/public/doctors/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.doctor;
  } catch (error) {
    console.error("Failed to fetch doctor:", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctor(slug);

  if (!doctor) {
    return {
      title: "Doctor Not Found | DFC",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  const description = doctor.bio
    ? doctor.bio.substring(0, 160)
    : `Book a consultation with ${doctor.name}, a specialist in ${doctor.specialty}. World-trained Nigerian diaspora doctor available via DFC.`;

  return {
    title: `Dr. ${doctor.name} — ${doctor.specialty} Specialist`,
    description,
    alternates: { canonical: `/book/${slug}` },
    openGraph: {
      title: `Dr. ${doctor.name} — ${doctor.specialty} | Book Consultation`,
      description,
      images: doctor.profileImage
        ? [{ url: doctor.profileImage, width: 600, height: 600, alt: `Dr. ${doctor.name}` }, ...previousImages]
        : previousImages,
    },
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dfcare.org";

  return (
    <>
      {doctor && (
        <DoctorJsonLd
          name={`Dr. ${doctor.name}`}
          specialty={doctor.specialty}
          description={doctor.bio}
          image={doctor.profileImage}
          url={`${baseUrl}/book/${slug}`}
        />
      )}
      <DoctorProfileClient doctor={doctor} />
    </>
  );
}
