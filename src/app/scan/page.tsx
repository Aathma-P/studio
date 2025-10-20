"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();

  const handleScanClick = () => {
    router.push("/scan/scanner"); // navigate to scanner page
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#EAF6EE] p-4">
      <div className="w-full max-w-md text-center">
        <Image
          src="https://picsum.photos/seed/hot-air-balloon/800/600"
          data-ai-hint="hot air balloon"
          alt="Scan the image"
          width={800}
          height={600}
          className="rounded-xl object-contain w-full h-auto"
          priority
        />

        <button
          onClick={handleScanClick}
          className="mt-8 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg"
        >
          Scan
        </button>
      </div>
    </div>
  );
}
