"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import HomePage from "./home/page";
import splashImg from "@/assets/images/Splash.png";

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
        <div className="relative w-80 h-80">
          <Image
            src={splashImg}
            alt="Splash"
            fill
            priority
            className="object-contain animate-fade-in"
          />
        </div>
      </div>
    );
  }

  return <HomePage />;
}
