"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SpecialistsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#0D1F3C]">
          Specialists
        </h2>
        <p className="text-gray-500 mt-1">
          View specialists deployed to your facility
        </p>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="h-16 w-16 rounded-full bg-[#0A4A50]/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-[#0A4A50]" />
          </div>
          <h3 className="text-lg font-serif font-semibold text-[#0D1F3C] mb-2">
            No specialists assigned yet
          </h3>
          <p className="text-gray-500 max-w-md mb-6">
            Request a deployment to get started. Once a deployment is confirmed,
            assigned specialists will appear here with their credentials and
            availability status.
          </p>
          <Button
            onClick={() => router.push("/hospital/deployments")}
            className="bg-[#0A4A50] hover:bg-[#0A4A50]/90 text-white"
          >
            Request a Deployment
          </Button>
        </div>
      </div>
    </div>
  );
}
