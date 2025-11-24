'use client';

import { Medal, CalendarCheck, Wallet } from 'lucide-react';
import { useScrollAnimation } from '@/lib/useScrollAnimation';
import Image from 'next/image';

export default function WhyChooseDFC() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: card1Ref, isVisible: card1Visible } = useScrollAnimation();
  const { ref: card2Ref, isVisible: card2Visible } = useScrollAnimation();
  const { ref: card3Ref, isVisible: card3Visible } = useScrollAnimation();

  return (
    <section className="text-primary py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className={`text-center animate-fade-up ${titleVisible ? 'visible' : ''}`}>
          <h2 className="text-2xl md:text-3xl font-bold text-primary dark:text-white">
            Why Patients Choose DFC
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            ref={card1Ref}
            className={`bg-[#8322320D] p-8 rounded-lg shadow-sm text-center transition-all duration-500 hover:shadow-lg hover:scale-105 animate-fade-up ${card1Visible ? 'visible' : ''}`}
            style={{ animationDelay: '100ms' }}
          >
            <div className="inline-flex items-center justify-center mx-auto">
              <Image src="/excellence.png" alt="World-Class Excellence" width={80} height={50}  />
            </div>
            <h3 className="mt-4 text-xl font-semibold">World-Class Excellence</h3>
            <p className="mt-2 text-muted-light dark:text-muted-dark text-sm">
              Access diaspora doctors with international training and experience, now practicing in Nigeria.
            </p>
          </div>

          <div
            ref={card2Ref}
            className={`bg-[#8322320D] p-8 rounded-lg shadow-sm text-center transition-all duration-500 hover:shadow-lg hover:scale-105 animate-fade-up ${card2Visible ? 'visible' : ''}`}
            style={{ animationDelay: '200ms' }}
          >
            <div className="inline-flex items-center justify-center mx-auto">
              <Image src="/booking.png" alt="World-Class Excellence" width={70} height={50}  />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Flexible Scheduling</h3>
            <p className="mt-2 text-sm">
             Book appointments in minutes, not months. Get the care you need when you need it.
            </p>
            <ul className="list-disc px-8 mt-2 text-sm">
              <li>Same-day appointments</li>
 <li>24/7 booking system</li>
 <li>Instant confirmation</li>
            </ul>
          </div>

          <div
            ref={card3Ref}
            className={`bg-[#8322320D] p-8 rounded-lg shadow-sm text-center transition-all duration-500 hover:shadow-lg hover:scale-105 animate-fade-up ${card3Visible ? 'visible' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="inline-flex items-center justify-center mx-auto">
              <Image src="/affordable.png" alt="Affordable Care" width={60} height={50}  />
            </div>
            <h3 className="mt-9 text-xl font-semibold">Affordable Care</h3>
            <p className="mt-2 text-sm">
              Premium healthcare at local prices. No need for expensive medical tourism.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}