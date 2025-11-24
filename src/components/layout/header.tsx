'use client';

import React from 'react';
import { UserPlus, Boxes, Truck, BarChart2 } from 'lucide-react';
import { useScrollAnimation } from '@/lib/useScrollAnimation';

const steps = [
  { Icon: UserPlus, title: 'Registration & Onboarding', text: ' Join our network as a manufacturer, distributor, or healthcare provider.'},
  { Icon: Boxes, title: 'Inventory Management', text: ' Easily list and manage your inventory of short-dated drugs on our platform.' },
  { Icon: Truck, title: 'Redistribution & Logistics', text: ' Our logistics network ensures safe and timely delivery of medications to those in need.' },
  { Icon: BarChart2, title: 'Reporting & Analytics', text: ' Gain insights into your redistribution activities and impact through detailed reports.' },
];

export default function HowItWorks() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const stepRefs = [
    useScrollAnimation(),
    useScrollAnimation(),
    useScrollAnimation(),
    useScrollAnimation(),
  ];
  return (
    <section id="how-it-works">
      <div className='py-4'>
      <div ref={titleRef} className={`animate-text-reveal ${titleVisible ? 'visible' : ''}`}>
        <h2 className="text-[var(--primary-text-color)] text-3xl font-bold leading-tight tracking-tight px-4">How CDN Works</h2>
      </div>
      <div className="p-4 space-y-2">
        {steps.map(({ Icon, title, text }, i) => (
          <div key={i} ref={stepRefs[i].ref} className={`animate-fade-up ${stepRefs[i].isVisible ? 'visible' : ''}`}>
            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-[var(--primary-color)] text-white rounded-full p-3 flex items-center justify-center"><Icon size={24} /></div>
                {i < steps.length - 1 && <div className="w-0.5 md:w-1 bg-[var(--primary-color)] opacity-60 md:opacity-20 h-12 md:h-16" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--primary-text-color)]">{title}</h3>
                <p className="text-base text-[var(--secondary-text-color)]">{text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
