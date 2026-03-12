import { Metadata, ResolvingMetadata } from "next";
import DoctorProfileClient from "@/components/booking/DoctorProfileClient";

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

  return {
    title: `${doctor.name} - ${doctor.specialty} | DFC`,
    description: doctor.bio
      ? doctor.bio.substring(0, 160)
      : `Book a consultation with ${doctor.name}, a specialist in ${doctor.specialty}.`,
    openGraph: {
      title: `${doctor.name} - ${doctor.specialty} | DFC`,
      description: `Schedule a consultation with ${doctor.name}.`,
      images: doctor.profileImage
        ? [doctor.profileImage, ...previousImages]
        : previousImages,
    },
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);

  return <DoctorProfileClient doctor={doctor} />;
}
