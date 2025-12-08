"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "../ui/button";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Trigger animations after component mounts
    setMounted(true);
  }, []);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/80 dark:from-background-dark/80 dark:to-background-dark/20 z-10" />
      <Image
        alt="Compassionate doctor looking thoughtfully into the distance"
        src="/hero.jpg"
        fill
        priority
        className="object-cover"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-60 pb-24 text-center z-20">
        <div className={`animate-text-reveal ${mounted ? "visible" : ""}`}>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Get World-Class Medical Care
            <br />
            Right Here in Nigeria
          </h1>
        </div>

        <div
          className={`animate-text-reveal ${mounted ? "visible" : ""}`}
          style={{ animationDelay: "200ms" }}
        >
          <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-200">
            Book consultations and surgeries with top diaspora doctors visiting
            Nigeria. Premium facilities, international expertise, local
            convenience.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div
            className={`animate-fade-up ${mounted ? "visible" : ""}`}
            style={{ animationDelay: "400ms" }}
          >
            <form 
              className="flex flex-col sm:flex-row items-center gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/book?search=${encodeURIComponent(searchTerm)}`);
              }}
            >
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-light h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for doctors by specialty e.g general surgery"
                  className="w-full pl-12 pr-4 py-3 rounded-full border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-surface-dark/90 focus:ring-accent focus:border-accent text-text-light dark:text-text-dark placeholder-muted-light dark:placeholder-muted-dark"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="default"
                size="sm"
                type="submit"
                className="w-full sm:w-auto py-6 px-8 rounded-full cursor-pointer"
              >
                Find a Doctor
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
