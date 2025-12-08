"use client";

import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";


export default function About() {

  return (
    <>
        {/* Hero Section */}
        <div className="relative pt-24 md:pt-42 pb-24 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/dfc-logo.png"
              alt="Healthcare team"
              fill
              className="object-cover opacity-10"
              priority
            />
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-primary">
            <h1 className="text-xl md:text-4xl font-bold mb-6 leading-tight">
              About Us
            </h1>
            <p className="text-lg mx-auto text-primary">
              Connecting patients with qualified healthcare professionals for
              better health outcomes
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="">
            <h2 className="text-2xl font-bold text-[#0A2463] mb-3">Overview</h2>
            <p className="text-primary leading-relaxed mb-4">
              {`Doctors Foundation For Care (Doctors for Change) is a global healthcare movement and digital platform created to bridge the gap between Nigerians and the wealth of medical expertise across the world.`}
              <br />
              {`As thousands of our brightest doctors leave the country to pursue residency and specialist training abroad, a gap has grown in Nigeria’s healthcare system. Doctors for Change was built to bridge that gap — reconnecting foreign-trained Nigerian doctors with patients back home who still need their expertise, compassion, and care.`}
            </p>
            <p className="text-primary leading-relaxed mb-4">
              {` Our platform allows Nigerians to book virtual consultations, specialist appointments, and second opinions with trusted Nigerian doctors practicing across the world. It’s a safe, affordable, and accessible way to benefit from international medical standards — without the cost or complexity of traveling abroad. It’s also an opportunity to earn fairly and sustainably for your time and expertise while giving back to Nigeria’s healthcare system.`}
            </p>
            <p className="text-primary leading-relaxed">
              {`For diaspora doctors, Doctors for Change is more than a telemedicine platform — it’s a movement of return and reconnection. It’s a way to give back meaningfully, to strengthen a healthcare system that shaped our beginnings, and to ensure that no Nigerian is left behind because of geography or circumstance.`}
            </p>
          </div>

          <div className="my-16">
            <h2 className="text-2xl font-bold text-[#0A2463] mb-3">
              Our Mission
            </h2>
            <p className="text-primary leading-relaxed mb-4">
              {`To reconnect Nigerian doctors in the diaspora with patients in Nigeria — providing affordable access to world-class expertise while restoring strength, trust, and hope in our nation’s healthcare system.`}
              <br />
              {`We envision a Nigeria where no one is denied quality care because their doctor now lives abroad.`}
            </p>
          </div>

          <div className="my-3">
            <h2 className="text-2xl font-bold text-[#0A2463] mb-2">
              What We Do and Why It Matters
            </h2>
            <p className="text-primary leading-relaxed mb-4">
              {`Nigeria’s healthcare system is under immense strain — with limited specialists, long wait times, and preventable deaths. Yet, the solution already exists within our own global medical community. Thousands of Nigerian-trained doctors abroad are eager to contribute their skills and give back to the system that raised them.`}
              <br />
              {`DFC transforms goodwill into impact — connecting patients with the very doctors who once walked Nigeria’s hospital wards, now armed with international training and experience. Together, we are redefining what it means to serve, heal, and belong.`}
              <br />
            </p>
              <p className="text-primary">We aim to: </p>
              <ul className="list-disc pl-8 text-primary">
                <li>{`Bridge the Brain Drain: We turn brain drain into brain gain by reconnecting foreign-trained Nigerian doctors with their home country.`}</li>
                <li>{`Empower Diaspora Specialists: We make it easy for Nigerian doctors abroad to consult, mentor, and impact care delivery from anywhere.`}</li>
                <li>{`Provide Access for All: We give Nigerians an affordable pathway to world-class expertise — in real time, online.`}</li>
                <li>{`Rebuild Trust in Care: We’re reshaping the healthcare experience through reliability, compassion, and excellence.`}</li>
              </ul>
          </div>
        </div>
    </>
  );
}
