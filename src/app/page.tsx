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
      setTimeout(() => setShowSplash(false), 700); // wait for fade-out
    }, 3000); // splash duration
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-700 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src="https://picsum.photos/seed/groceries/1920/1080"
          alt="Splash Screen"
          fill
          priority
          className="object-cover w-full h-full"
          data-ai-hint="grocery store background"
        />
      </div>
    );
  }

  // After splash finishes, render the app normally
  return <HomePage />;
}
