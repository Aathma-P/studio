"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowUp, CornerUpLeft, ShoppingBasket, ScanLine, LoaderCircle } from "lucide-react";
import type { ShoppingListItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { findItemInAisle, FindItemOutput } from "@/ai/flows/find-item-flow";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<FindItemOutput | null>(null);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState(true);
  const { toast } = useToast();

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
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use AR mode.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);


  React.useEffect(() => {
    if (!currentItem || isScanning) return;

    const interval = setInterval(() => {
      setInstructionIndex((prev) => {
        if (prev < arInstructions.length - 1) {
          return prev + 1;
        } else {
          setCurrentItemIndex((prevItem) =>
            prevItem < sortedItems.length - 1 ? prevItem + 1 : 0
          );
          setScanResult(null); // Reset scan result for new item
          return 0;
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentItem, sortedItems.length, isScanning]);
  
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

  const handleScan = async () => {
    if (!videoRef.current || !currentItem) return;

    setIsScanning(true);
    setScanResult(null);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
        setIsScanning(false);
        return;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL("image/jpeg");

    try {
      const result = await findItemInAisle({
        photoDataUri,
        itemName: currentItem.name,
      });
      setScanResult(result);
    } catch (error) {
      console.error("AI scan failed:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Could not analyze the image. Please try again.",
      });
    } finally {
      setIsScanning(false);
    }
  };


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
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      {!hasCameraPermission && (
          <div className="absolute inset-0 flex items-center justify-center z-20 p-4">
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please enable camera permissions in your browser to use the AR View.
                </AlertDescription>
            </Alert>
          </div>
      )}

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
                <p className="text-sm text-neutral-300">Aisle:</p>
                <p className="text-xl font-bold">{currentItem.location.aisle}</p>
            </div>
        </div>
      </div>
      
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full px-8">
        {isScanning && (
          <div className="flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur-md p-6 rounded-xl">
            <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-bold">Scanning for {currentItem.name}...</p>
          </div>
        )}
        {scanResult && (
            <div className={cn("p-6 rounded-xl text-center text-white", scanResult.isFound ? "bg-primary/80" : "bg-destructive/80")}>
                <h3 className="text-2xl font-bold mb-2">
                    {scanResult.isFound ? "Item Found!" : "Item Not Found"}
                </h3>
                <p className="text-lg">{scanResult.isFound ? scanResult.guidance : "Try moving your camera or checking another shelf."}</p>
            </div>
        )}
      </div>


      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center text-center text-white z-10">
        {instructionIndex < arInstructions.length -1 ? (
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
        ) : (
             <div className="flex flex-col items-center animate-fade-in">
                 <p className="text-2xl font-bold drop-shadow-lg mb-4">You've arrived. Scan the aisle to find your item.</p>
                <Button size="lg" className="rounded-full h-20 w-20 p-0" onClick={handleScan} disabled={isScanning || !hasCameraPermission}>
                    {isScanning ? <LoaderCircle className="w-8 h-8 animate-spin"/> : <ScanLine className="w-8 h-8"/>}
                </Button>
             </div>
        )}
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
