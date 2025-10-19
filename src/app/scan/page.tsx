"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import scanIntro from "@/assets/images/scan-banner.png"; // replace with your uploaded image path

export default function ScanIntroPage() {
  const router = useRouter();

  const handleScanClick = () => {
    router.push("/scan/scanner");
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#EAF6EE]">
      <div className="flex flex-col items-center justify-center max-w-md w-full p-4">
        <Image
          src={scanIntro}
          alt="Scan the image"
          className="object-contain w-full h-auto mb-6 rounded-xl"
          priority
        />

        <button
          onClick={handleScanClick}
          className="bg-[#2CA44F] text-white font-semibold text-lg px-8 py-2 rounded-md shadow-md hover:bg-[#259543] transition-all duration-300"
        >
          Scan
        </button>
      </div>
    </div>
  );
}
