"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import HomePage from "./home/page";

export default function SplashPage() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 800); // wait for fade out
    }, 3000); // 3s splash time
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-screen w-screen bg-[#e8f5e9] transition-opacity duration-700 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src="/assets/images/Splash.png"
          alt="Splash"
          width={320}
          height={320}
          priority
          className="object-contain animate-fade-in"
        />
      </div>
    );
  }

  return <HomePage />;
}
