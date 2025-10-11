"use client";

import * as React from "react";
import { ArrowUp, CornerUpLeft, CornerUpRight, ShoppingBasket, ScanLine, LoaderCircle, CameraOff, MoveLeft, MoveRight } from "lucide-react";
import type { ShoppingListItem, MapPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { findItemInAisle, FindItemOutput } from "@/ai/flows/find-item-flow";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTurnByTurnInstructions, Instruction } from "@/lib/pathfinding";
import { ALL_PRODUCTS } from "@/lib/data";

interface ArViewProps {
  items: ShoppingListItem[];
}

const instructionIcons = {
    "start": ArrowUp,
    "straight": ArrowUp,
    "left": CornerUpLeft,
    "right": CornerUpRight,
    "turn-left": MoveLeft,
    "turn-right": MoveRight,
    "scan": ScanLine,
    "finish": ShoppingBasket,
};


export default function ArView({ items }: ArViewProps) {
  const [currentItemIndex, setCurrentItemIndex] = React.useState(0);
  const [instructionIndex, setInstructionIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(100);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<FindItemOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [arInstructions, setArInstructions] = React.useState<Instruction[]>([]);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();

  React.useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Not Supported",
          description: "Your browser does not support camera access.",
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);


  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.location.aisle !== b.location.aisle) {
        return a.location.aisle - b.location.aisle;
      }
      return a.location.section - b.location.section;
    });
  }, [items]);

  const currentItem = sortedItems[currentItemIndex];
  
  React.useEffect(() => {
    if (sortedItems.length > 0) {
      const instructions = getTurnByTurnInstructions(sortedItems);
      setArInstructions(instructions);
    } else {
      setArInstructions([]);
    }
    setCurrentItemIndex(0);
    setInstructionIndex(0);
  }, [sortedItems]);


  const currentInstruction = arInstructions[instructionIndex];

  React.useEffect(() => {
    if (!currentItem || isScanning || !currentInstruction || currentInstruction.type === 'scan') return;

    const intervalTime = (currentInstruction.distance || 5) * 200; // Adjust multiplier for desired speed

    const interval = setInterval(() => {
      setInstructionIndex((prev) => {
        if (prev < arInstructions.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [currentItem, isScanning, arInstructions, instructionIndex, currentInstruction]);
  
  React.useEffect(() => {
    setProgress(100);
    const intervalTime = (currentInstruction?.distance || 5) * 200;
    
    // Smoothly decrease progress
    let start: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const newProgress = Math.max(0, 100 - (elapsed / intervalTime) * 100);
      setProgress(newProgress);
      if (newProgress > 0) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
        cancelAnimationFrame(animationFrameId);
    };
  }, [instructionIndex, currentItemIndex, currentInstruction]);

  const handleScan = async () => {
    if (!currentItem || !videoRef.current || !canvasRef.current || !hasCameraPermission) return;

    setIsScanning(true);
    setScanResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setIsScanning(false);
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL("image/jpeg");

    try {
        const result = await findItemInAisle({
            photoDataUri,
            itemName: currentItem.name,
        });

        setScanResult(result);
        
        setTimeout(() => {
            // This will move to the next instruction which should be the start of the next leg
            setInstructionIndex(prev => prev + 1);
            if (result.isFound) {
                 // Find which item in the sorted list we just found
                 const foundItemIndex = sortedItems.findIndex(it => it.id === currentItem.id);
                 if (foundItemIndex !== -1) {
                     setCurrentItemIndex(foundItemIndex + 1);
                 }
            }
            setScanResult(null);
        }, 4000);

    } catch (error) {
        console.error("AI scan failed:", error);
        toast({
            variant: "destructive",
            title: "Scan Failed",
            description: "Could not analyze the image. Please try again.",
        });
        setScanResult({isFound: false, guidance: "The AI scan failed. Please check your connection and try again."})
    } finally {
        setIsScanning(false);
    }
  };
  
  const handleNextInstruction = () => {
    if (isScanning) return;

    if (currentInstruction?.type === 'scan') {
      handleScan();
    } else if (instructionIndex < arInstructions.length - 1) {
      setInstructionIndex(prev => prev + 1);
      const nextInstruction = arInstructions[instructionIndex + 1];
      if (nextInstruction?.itemId) {
         const itemIdx = sortedItems.findIndex(i => i.id === nextInstruction.itemId);
         if (itemIdx !== -1) {
            setCurrentItemIndex(itemIdx);
         }
      }
    }
  }


  if (hasCameraPermission === null) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-black">
              <LoaderCircle className="w-12 h-12 text-white animate-spin" />
          </div>
      )
  }

  if (hasCameraPermission === false) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black p-4">
            <Alert variant="destructive" className="max-w-sm">
              <CameraOff className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to use the AR view.
              </AlertDescription>
            </Alert>
        </div>
    );
  }

  if (items.length === 0) {
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
  
  if (!currentInstruction && items.length > 0) {
     return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <ShoppingBasket className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium">Navigation Complete!</h3>
          <p className="mt-1 text-sm text-muted-foreground">You've found all items. Proceed to checkout.</p>
        </div>
      </div>
    );
  }

  if (!currentInstruction) {
      return null;
  }

  const Icon = instructionIcons[currentInstruction.type as keyof typeof instructionIcons] || ArrowUp;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" onClick={handleNextInstruction}>
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      <div className="absolute top-0 left-0 right-0 p-6 text-white z-10">
        <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-1.5">
           <Progress value={progress} className="h-1.5 transition-transform duration-200 ease-linear" />
        </div>
        <div className="flex items-center justify-between mt-4">
            <div>
                <p className="text-sm text-neutral-300">Next item:</p>
                <p className="text-xl font-bold">{currentItem?.name || "All items found"}</p>
            </div>
             {currentItem && <div className="text-right">
                <p className="text-sm text-neutral-300">Aisle:</p>
                <p className="text-xl font-bold">{currentItem.location.aisle}</p>
            </div>}
        </div>
      </div>
      
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full px-8">
        {isScanning && !scanResult && (
          <div className="flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur-md p-6 rounded-xl">
            <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-bold">Scanning for {currentItem.name}...</p>
          </div>
        )}
        {scanResult && (
            <div className={cn("p-6 rounded-xl text-center text-white animate-fade-in backdrop-blur-md", scanResult.isFound ? "bg-primary/80" : "bg-destructive/80")}>
                <h3 className="text-2xl font-bold mb-2">
                    {scanResult.isFound ? "Item Found!" : "Item Not Found"}
                </h3>
                <p className="text-lg">{scanResult.guidance}</p>
            </div>
        )}
      </div>


      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center text-center text-white z-10">
        {currentInstruction.type !== 'scan' ? (
             <div
                key={instructionIndex}
                className="flex flex-col items-center animate-fade-in"
                >
                <Icon
                    className="w-24 h-24 mb-4 drop-shadow-lg"
                />
                <h2 className="text-3xl font-bold drop-shadow-lg">
                    {currentInstruction.text}
                </h2>
            </div>
        ) : (
             <div className="flex flex-col items-center animate-fade-in">
                 <p className="text-2xl font-bold drop-shadow-lg mb-4">{currentInstruction.text}</p>
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
