"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import HomePage from "@/components/HomePage"; 

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setShowSplash(false), 800); // wait for fade out
    }, 3000); // 3s splash time
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div
        className={`flex items-center justify-center h-screen w-screen bg-white transition-opacity duration-700 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="relative w-80 h-80">
          <Image
            src="https://picsum.photos/seed/shopping/300/300"
            alt="Splash Screen"
            data-ai-hint="grocery cart"
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
