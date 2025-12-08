"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";

export default function BookingPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await fetch(`/api/public/doctors/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data.doctor);
        } else {
             // Handle 404
        }
      } catch (error) {
        console.error("Failed to load doctor", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchDoctor();
    }
  }, [slug]);

  if (loading) return <Loading />;

  if (!doctor) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold mb-4">Doctor Not Found</h1>
              <Button onClick={() => router.push('/book')}>Back to Directory</Button>
          </div>
      )
  }

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-[#0A2463]">Book Appointment</h1>
                <p className="text-gray-600 mt-2">with {doctor.name}</p>
            </div>
            <BookingWizard doctor={doctor} />
        </div>
      </main>
      <Footer />
    </>
  );
}
