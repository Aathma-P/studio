"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import HomePage from "@/components/HomePage";
import splashImg from "@/assets/images/Splash.png";

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setShowSplash(false), 700);
    }, 1500); // ⏱️ show splash for 1.5 seconds
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Fullscreen splash image */}
        <Image
          src={splashImg}
          alt="Splash Screen"
          fill
          priority
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return <HomePage />;
}
