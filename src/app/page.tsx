"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import splashImg from "@/assets/images/Splash.png";

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShowSplash(false);
        router.replace("/home"); // Redirect to the home page
      }, 700);
    }, 1500); // ⏱️ show splash for 1.5 seconds
    return () => clearTimeout(timer);
  }, [router]);

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

  // Render nothing or a loading spinner while redirecting
  return null;
}
