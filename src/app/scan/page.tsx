"use client";

import Image from "next/image";
import scanBanner from "@/assets/images/scan-banner.png";

export default function ScanPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#EAF6EE] p-4">
      <div className="bg-white rounded-3xl shadow-md p-6 w-full max-w-md flex flex-col items-center justify-center">
        <Image
          src={scanBanner}
          alt="Scan the image"
          className="object-contain w-full h-auto"
          priority
        />
      </div>
    </div>
  );
}
