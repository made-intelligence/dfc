"use client";

import { useScrollAnimation } from "@/lib/useScrollAnimation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function JoinDFCSection() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: descRef, isVisible: descVisible } = useScrollAnimation();
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollAnimation();
  const { ref: buttonsRef, isVisible: buttonsVisible } = useScrollAnimation();
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation();

  const features = [
    {
      title: "Guaranteed Payments",
      description:
        "Receive payments instantly after each consultation or procedure. No delays, no hassles.",
    },
    {
      title: "Premium Facilities",
      description:
        "Access world-class medical facilities with the latest equipment and dedicated support staff.",
    },
    {
      title: "Flexible Scheduling",
      description:
        "Set your own schedule and availability. Work when it suits you best.",
    },
  ];

  return (
    <section className="text-primary py-12 bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div
              ref={titleRef}
              className={`transition-all duration-700 ${titleVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
            >
              <h2 className="text-2xl md:text-4xl w-full md:w-3/4 font-bold leading-tight">
                Make Meaningful Impact While Building Your Practice
              </h2>
            </div>

            <div
              ref={descRef}
              className={`transition-all duration-700 delay-200 ${descVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
            >
              <p className="">
                Our platform handles everything so you can focus on what matters
                most - healing.
              </p>
            </div>

            {/* Features List */}
            <div ref={featuresRef} className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${featuresVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-primary/80 flex shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-primary mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-primary text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div
              ref={buttonsRef}
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-700 ${buttonsVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
            >
              <Button
                size="sm"
                className=" text-white px-8 py-6 rounded-full cursor-pointer"
              >
                Join DFC
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer border border-destructive text-primary hover:bg-destructive/10 px-8 py-6 rounded-full"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div
            ref={imageRef}
            className={`transition-all duration-700 delay-300 ${imageVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            <div className="relative h-[500px] md:h-[600px] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/impact.png"
                alt="Professional doctor portrait"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
