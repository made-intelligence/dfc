'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/layout/HeroSection';
import ImpactStats from '@/components/layout/ImpactStats';
import WhyChooseDFC from '@/components/layout/WhyChooseDFC';
import JoinDFCSection from '@/components/layout/JoinDFCSection';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@prisma/client';


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect doctors and admins to their dashboards
      if (user.role === UserRole.DOCTOR) {
        router.push('/doctor/patients');
      } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
        router.push('/admin');
      }
      // Patients stay on the landing page
    }
  }, [user, loading, router]);

  return (
    <>
      <Topbar />
      <main className='flex-1'>
    <div className="font-display bg-background-light text-text-light dark:bg-background-dark dark:text-text-dark">

        <HeroSection />
        <ImpactStats />
        <WhyChooseDFC />
        <JoinDFCSection />
    </div>
      </main>

      <Footer />
    </>
  );
}
