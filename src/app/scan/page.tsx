"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import scanBanner from "@/assets/images/scan-banner.png";

export default function ScanPage() {
  const router = useRouter();

  const handleScanClick = () => {
    router.push("/scan/scanner"); // navigate to scanner page
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#EAF6EE]">
      <div className="relative max-w-md w-full">
        {/* Banner image */}
        <Image
          src={scanBanner}
          alt="Scan the image"
          className="rounded-xl object-cover w-full h-auto"
          priority
        />

        {/* Button overlay */}
        <div className="absolute bottom-6 left-6">
          <button
            onClick={handleScanClick}
            className="bg-[#2CA44F] text-white text-lg font-semibold px-6 py-2 rounded-md shadow-lg hover:bg-[#259543] transition-all duration-300"
          >
            Scan
          </button>
        </div>
      </div>
    </div>
  );
}
