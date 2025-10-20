"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import scanBanner from "@/assets/images/scan-banner.png";

export default function ScanPage() {
  const router = useRouter();

  const handleScanClick = () => {
    router.push("/scan/scanner");
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#EAF6EE] p-4">
      <div className="relative w-full max-w-md">
        <Image
          src={scanBanner}
          alt="Scan the image"
          width={800}
          height={600}
          className="rounded-xl object-contain w-full h-auto"
          priority
        />
        <button
          onClick={handleScanClick}
          className="absolute top-[54%] left-[22%] transform -translate-x-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition-all duration-200"
        >
          Scan
        </button>
      </div>
    </div>
  );
}
