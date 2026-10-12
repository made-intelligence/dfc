import { Metadata, ResolvingMetadata } from "next";
import { appUrl } from "@/lib/app-url";
import DoctorProfileClient from "@/components/booking/DoctorProfileClient";
import { DoctorJsonLd } from "@/components/seo/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getDoctor(slug: string) {
  const baseUrl = appUrl();
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

  // Most members were created from the register and have not filled anything
  // in yet. A page carrying only a name is thin content: indexing ninety of
  // them drags the whole domain down and spends crawl budget on nothing.
  // Keep them reachable and let link equity flow, but leave them out of the
  // index until the member has given us something to show.
  const hasSubstance = Boolean(doctor.specialty) || Boolean(doctor.bio);

  const description = doctor.bio
    ? doctor.bio.substring(0, 160)
    : doctor.specialty
      ? `Book a consultation with ${doctor.name}, a specialist in ${doctor.specialty}. World-trained Nigerian diaspora doctor available via DFC.`
      : `${doctor.name} is a member of the Doctors Foundation for Care.`;

  return {
    robots: hasSubstance ? undefined : { index: false, follow: true },
    title: doctor.specialty
      ? `${doctor.name} — ${doctor.specialty} Specialist`
      : `${doctor.name} | DFC`,
    description,
    alternates: { canonical: `/book/${slug}` },
    openGraph: {
      title: doctor.specialty
        ? `${doctor.name} — ${doctor.specialty} | Book Consultation`
        : `${doctor.name} | Doctors Foundation for Care`,
      description,
      images: doctor.profileImage
        ? [{ url: doctor.profileImage, width: 600, height: 600, alt: doctor.name }, ...previousImages]
        : previousImages,
    },
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  const baseUrl = appUrl();

  return (
    <>
      {doctor && (
        <DoctorJsonLd
          name={doctor.name}
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
