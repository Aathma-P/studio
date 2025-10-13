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
import { useIsMobile, useOrientation } from "@/hooks/use-mobile";
import StoreMap from "./store-map";
import { findPath } from "@/lib/pathfinding";
import { ENTRANCE_POS } from "@/lib/data";


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
  const [arInstructions, setArInstructions] = React.useState<Instruction[]>([]);
  const [instructionIndex, setInstructionIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(100);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<FindItemOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [currentItem, setCurrentItem] = React.useState<ShoppingListItem | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();
  const orientation = useOrientation();
  const isMobile = useIsMobile();

  const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;

  const sortedItems = React.useMemo(() => {
    if (items.length === 0) return [];

    const itemsWithNavPoints = items.map(item => ({
      ...item,
      navPoint: {
        x: getAisleNavX(item.location.aisle),
        y: item.location.section,
      }
    }));

    const findShortestGreedyPath = (itemsToVisit: typeof itemsWithNavPoints): typeof itemsWithNavPoints => {
        let unvisited = [...itemsToVisit];
        let orderedPath: typeof itemsWithNavPoints = [];
        let currentPoint = ENTRANCE_POS;

        while (unvisited.length > 0) {
            let nearestItem: (typeof itemsWithNavPoints[0]) | null = null;
            let shortestDistance = Infinity;

            for (const item of unvisited) {
                const path = findPath(currentPoint, item.navPoint);
                const distance = path ? path.length : Infinity;
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestItem = item;
                }
            }

            if (nearestItem) {
                orderedPath.push(nearestItem);
                currentPoint = nearestItem.navPoint;
                unvisited = unvisited.filter(item => item.id !== nearestItem!.id);
            } else {
                break;
            }
        }
        return orderedPath;
    };

    return findShortestGreedyPath(itemsWithNavPoints);
  }, [items]);


  React.useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
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
  }, []);

  
  React.useEffect(() => {
    if (sortedItems.length > 0) {
      const instructions = getTurnByTurnInstructions(sortedItems);
      setArInstructions(instructions);
      setInstructionIndex(0);
      setCurrentItem(sortedItems[0]);
    } else {
      setArInstructions([]);
      setInstructionIndex(0);
      setCurrentItem(null);
    }
  }, [sortedItems]);


  const currentInstruction = arInstructions[instructionIndex];
  
  const itemToScan = React.useMemo(() => {
    if (currentInstruction?.type !== 'scan') return null;
    return sortedItems.find(it => it.id === currentInstruction.itemId);
  }, [currentInstruction, sortedItems]);


  const goToNextInstruction = React.useCallback(() => {
    setInstructionIndex(prev => {
        if (prev < arInstructions.length - 1) {
            const nextIndex = prev + 1;
            const nextInstruction = arInstructions[nextIndex];
            
            // Update current item when we pass a scan instruction
            if (arInstructions[prev].type === 'scan') {
                const currentItemIndex = sortedItems.findIndex(it => it.id === arInstructions[prev].itemId);
                if (currentItemIndex !== -1 && currentItemIndex < sortedItems.length - 1) {
                    setCurrentItem(sortedItems[currentItemIndex + 1]);
                } else {
                    setCurrentItem(null); // All items are done, navigating to checkout
                }
            }

            return nextIndex;
        }
        return prev;
    });
  }, [arInstructions, sortedItems]);

  // Effect for handling automatic advancement of instructions (e.g., "straight")
  React.useEffect(() => {
    if (!currentInstruction || isScanning || scanResult) return;
  
    if (currentInstruction.type === 'straight') {
      const duration = (currentInstruction.distance || 1) * 300; 
      const timer = setTimeout(() => {
        goToNextInstruction();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentInstruction, isScanning, scanResult, goToNextInstruction]);
  
  // Effect for managing the progress bar for "straight" instructions
  React.useEffect(() => {
    setProgress(100);
    if (!currentInstruction || currentInstruction.type !== 'straight' || isScanning) return;

    const intervalTime = (currentInstruction.distance || 1) * 300;
    
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

    return () => cancelAnimationFrame(animationFrameId);
  }, [instructionIndex, currentInstruction, isScanning]);

  const handleScan = async () => {
    if (!itemToScan || !videoRef.current || !canvasRef.current || !hasCameraPermission) return;

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
            itemName: itemToScan.name,
        });

        setScanResult(result);
        
        setTimeout(() => {
            setIsScanning(false);
            setScanResult(null);
            goToNextInstruction();
        }, 3000);

    } catch (error) {
        console.error("AI scan failed:", error);
        toast({
            variant: "destructive",
            title: "Scan Failed",
            description: "Could not analyze the image. Please try again.",
        });
        setScanResult({isFound: false, guidance: "The AI scan failed. Please try again."})
        setTimeout(() => {
            setIsScanning(false);
            setScanResult(null);
            goToNextInstruction();
        }, 3000);
    }
  };
  
  const handleUserTap = () => {
    if (isScanning || scanResult) return;
    
    if (currentInstruction) {
        if (['start', 'left', 'right', 'turn-left', 'turn-right', 'finish'].includes(currentInstruction.type)) {
            goToNextInstruction();
        } else if (currentInstruction.type === 'scan') {
            handleScan();
        }
    }
  }

  if (hasCameraPermission === null || orientation === 'unknown') {
      return (
          <div className="w-full h-full flex items-center justify-center bg-black">
              <LoaderCircle className="w-12 h-12 text-white animate-spin" />
          </div>
      )
  }

  if (hasCameraPermission === false && orientation === 'portrait') {
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
  
  if (!currentInstruction || currentInstruction.type === 'finish') {
     return (
      <div className="w-full h-full flex items-center justify-center bg-black" onClick={handleUserTap}>
        <div className="text-center text-white">
          <ShoppingBasket className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium">Shopping Complete!</h3>
          <p className="mt-1 text-sm text-muted-foreground">{currentInstruction?.text || "Proceed to checkout."}</p>
        </div>
      </div>
    );
  }

  if (isMobile && orientation === 'landscape') {
    const currentPosition = currentInstruction?.pathPoint;
    const currentItemIndex = sortedItems.findIndex(it => it.id === currentItem?.id);
    const itemsToMap = currentItemIndex !== -1 ? sortedItems.slice(currentItemIndex) : sortedItems;
    
    return (
      <div className="w-full h-full bg-background">
        <StoreMap items={itemsToMap} simulatedUserPosition={currentPosition} />
      </div>
    )
  }

  const Icon = instructionIcons[currentInstruction.type as keyof typeof instructionIcons] || ArrowUp;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" onClick={handleUserTap}>
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 text-white z-10">
         {currentInstruction.type === 'straight' && (
            <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-1.5 mb-4">
                <Progress value={progress} className="h-1.5 transition-transform duration-200 ease-linear" />
            </div>
         )}
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-neutral-300">Next item:</p>
                <p className="text-xl font-bold">{currentItem?.name || "Checkout"}</p>
            </div>
             {currentItem && <div className="text-right">
                <p className="text-sm text-neutral-300">Aisle:</p>
                <p className="text-xl font-bold">{currentItem.location.aisle}</p>
            </div>}
        </div>
      </div>
      
       {/* Scanning UI */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full px-8">
        {isScanning && !scanResult && itemToScan && (
          <div className="flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur-md p-6 rounded-xl">
            <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-bold">Scanning for {itemToScan.name}...</p>
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

      {/* Main Instruction UI */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center text-center text-white z-10">
        {currentInstruction.type === 'scan' && itemToScan ? (
             <div className="flex flex-col items-center animate-fade-in">
                 <p className="text-2xl font-bold drop-shadow-lg mb-4">{currentInstruction.text}</p>
                <Button size="lg" className="rounded-full h-20 w-20 p-0" onClick={handleScan} disabled={isScanning || !hasCameraPermission}>
                    {isScanning ? <LoaderCircle className="w-8 h-8 animate-spin"/> : <ScanLine className="w-8 h-8"/>}
                </Button>
             </div>
        ) : (
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
                 {['start', 'left', 'right', 'turn-left', 'turn-right'].includes(currentInstruction.type) && <p className="mt-2 text-base text-neutral-300 drop-shadow-md">Tap to continue</p>}
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
