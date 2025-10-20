"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();

  const handleScanClick = () => {
    router.push("/scan/scanner"); // navigate to scanner page
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#EAF6EE] p-4">
      <div className="relative w-full max-w-md">
        {/* Banner image */}
        <Image
          src="https://picsum.photos/seed/scan-page-banner/800/600"
          alt="Scan the image"
          width={800}
          height={600}
          className="rounded-xl object-cover w-full h-auto"
          priority
          data-ai-hint="scan banner character"
        />

        {/* Button overlay */}
        <div className="absolute bottom-6 left-6">
          <button
            onClick={handleScanClick}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg"
          >
            Scan
          </button>
        </div>
      </div>
    </div>
  );
}
