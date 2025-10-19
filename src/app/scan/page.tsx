"use client";

import Image from "next/image";

export default function ScanPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#EAF6EE] p-4">
      <div className="bg-white rounded-3xl shadow-md p-6 w-full max-w-md flex flex-col items-center justify-center">
        <Image
          src="https://picsum.photos/seed/scan-banner/800/600"
          alt="Scan the image"
          width={800}
          height={600}
          className="object-contain w-full h-auto"
          priority
          data-ai-hint="barcode scan illustration"
        />
      </div>
    </div>
  );
}
