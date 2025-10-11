"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowUp, CornerUpLeft, ShoppingBasket } from "lucide-react";
import type { ShoppingListItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ArViewProps {
  items: ShoppingListItem[];
}

const arInstructions = [
  { text: "Proceed straight", icon: ArrowUp, distance: 30 },
  { text: "Turn left at the end of the aisle", icon: CornerUpLeft, distance: 10 },
  { text: "Your item is on the right", icon: ArrowUp, distance: 5 },
];

export default function ArView({ items }: ArViewProps) {
  const [currentItemIndex, setCurrentItemIndex] = React.useState(0);
  const [instructionIndex, setInstructionIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(100);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.location.aisle !== b.location.aisle) {
        return a.location.aisle - b.location.aisle;
      }
      return a.location.section - b.location.section;
    });
  }, [items]);

  const currentItem = sortedItems[currentItemIndex];
  const currentInstruction = arInstructions[instructionIndex];

  React.useEffect(() => {
    if (!currentItem) return;

    const interval = setInterval(() => {
      setInstructionIndex((prev) => {
        if (prev < arInstructions.length - 1) {
          return prev + 1;
        } else {
          setCurrentItemIndex((prevItem) =>
            prevItem < sortedItems.length - 1 ? prevItem + 1 : 0
          );
          return 0;
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentItem, sortedItems.length]);
  
  React.useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 10);
    const progressInterval = setInterval(() => {
       setProgress(100);
    }, 4000);
    
    return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
    };
  }, [instructionIndex, currentItemIndex]);


  const arBgImage = PlaceHolderImages.find((img) => img.id === "ar-background");

  if (!currentItem) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">AR View is ready</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add items to your list to start AR navigation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {arBgImage && (
        <Image
          src={arBgImage.imageUrl}
          alt={arBgImage.description}
          fill
          className="object-cover opacity-60"
          data-ai-hint={arBgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      <div className="absolute top-0 left-0 right-0 p-6 text-white z-10">
        <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-1.5">
           <Progress value={progress} className="h-1.5 transition-all duration-[4000ms] ease-linear" />
        </div>
        <div className="flex items-center justify-between mt-4">
            <div>
                <p className="text-sm text-neutral-300">Next item:</p>
                <p className="text-xl font-bold">{currentItem.name}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-neutral-300">Category:</p>
                <p className="text-xl font-bold">{currentItem.category}</p>
            </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center text-center text-white z-10">
        <div
          key={instructionIndex}
          className="flex flex-col items-center animate-fade-in"
        >
          {React.createElement(currentInstruction.icon, {
            className: "w-24 h-24 mb-4 drop-shadow-lg",
          })}
          <h2 className="text-3xl font-bold drop-shadow-lg">
            {currentInstruction.text}
          </h2>
          <p className="text-lg text-neutral-200 mt-2">
            In {currentInstruction.distance} ft
          </p>
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
