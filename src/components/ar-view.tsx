
"use client";

import * as React from "react";
import { ArrowUp, CornerUpLeft, CornerUpRight, ShoppingBasket, ScanLine, LoaderCircle, CameraOff, MoveLeft, MoveRight, ArrowRight } from "lucide-react";
import type { ShoppingListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { findItemInAisle, FindItemOutput } from "@/ai/flows/find-item-flow";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTurnByTurnInstructions, Instruction } from "@/lib/pathfinding";
import StoreMap from "./store-map";
import { findPath } from "@/lib/pathfinding";
import { ENTRANCE_POS } from "@/lib/data";

interface ArViewProps {
  items: ShoppingListItem[];
  onItemScannedAndFound: (itemId: string) => void;
}

const instructionIcons = {
    "start": ArrowUp,
    "straight": ArrowUp,
    "left": CornerUpLeft,
    "right": ArrowRight,
    "turn-left": MoveLeft,
    "turn-right": MoveRight,
    "scan": ScanLine,
    "finish": ShoppingBasket,
};


export default function ArView({ items, onItemScannedAndFound }: ArViewProps) {
  const [arInstructions, setArInstructions] = React.useState<Instruction[]>([]);
  const [instructionIndex, setInstructionIndex] = React.useState(0);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<FindItemOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [currentItem, setCurrentItem] = React.useState<ShoppingListItem | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();

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
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
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
            const prevInstruction = arInstructions[prev];

            if (prevInstruction.type === 'scan') {
                const currentItemIndex = sortedItems.findIndex(it => it.id === prevInstruction.itemId);
                const isLastItem = currentItemIndex === sortedItems.length - 1;
                
                if (!isLastItem && currentItemIndex !== -1) {
                    setCurrentItem(sortedItems[currentItemIndex + 1]);
                } else {
                    setCurrentItem(null); 
                }
            } else {
                 const nextInstruction = arInstructions[nextIndex];
                 if (nextInstruction.type === 'scan') {
                    const item = sortedItems.find(it => it.id === nextInstruction.itemId);
                    if (item) setCurrentItem(item);
                }
            }

            return nextIndex;
        }
        return prev;
    });
  }, [arInstructions, sortedItems]);


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
        
        if (result.isFound) {
            onItemScannedAndFound(itemToScan.id);
            setTimeout(() => {
                goToNextInstruction();
                setIsScanning(false);
                setScanResult(null);
            }, 2000);
        } else {
             setTimeout(() => {
                setIsScanning(false);
                setScanResult(null);
            }, 3000);
        }

    } catch (error) {
        console.error("AI scan failed:", error);
        toast({
            variant: "destructive",
            title: "Scan Failed",
            description: "The AI scan could not be completed. Please try again.",
        });
        setScanResult({isFound: false, guidance: "Scan failed. Please align with the shelf and try again."})
        setTimeout(() => {
            setIsScanning(false);
            setScanResult(null);
        }, 3000);
    }
  };
  
  const handleUserTap = () => {
    if (isScanning || scanResult) return;
    
    if (currentInstruction) {
        if (currentInstruction.type === 'scan') {
            // "Got It" button now handles this
        } else {
            goToNextInstruction();
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

  const InstructionIcon = instructionIcons[currentInstruction.type] || ArrowUp;
  const currentPosition = currentInstruction?.pathPoint;
  const currentItemIndex = sortedItems.findIndex(it => it.id === currentItem?.id);
  const itemsToMap = currentItemIndex !== -1 ? sortedItems.slice(currentItemIndex) : sortedItems;

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden">
      {/* Top half: Camera view */}
      <div className="relative w-full flex-1" onClick={handleUserTap}>
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            {currentInstruction.type !== 'scan' && (
                <div
                    key={instructionIndex}
                    className="flex flex-col items-center animate-fade-in"
                >
                    <div className="bg-blue-500/80 backdrop-blur-sm rounded-full w-28 h-28 flex items-center justify-center shadow-lg">
                        <InstructionIcon className="w-16 h-16 text-white drop-shadow-lg" />
                    </div>
                    <div className="mt-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg">
                        <h2 className="text-lg font-bold">
                            {currentInstruction.text}
                        </h2>
                    </div>
                </div>
            )}
        </div>
        
         <div className="absolute top-4 right-4 z-20">
            {isScanning && !scanResult && itemToScan && (
              <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-md p-2 rounded-lg">
                <LoaderCircle className="w-5 h-5 animate-spin" />
                <span>Scanning...</span>
              </div>
            )}
            {scanResult && (
                <div className={cn("p-2 rounded-lg text-sm text-white animate-fade-in backdrop-blur-md", scanResult.isFound ? "bg-primary/80" : "bg-destructive/80")}>
                    {scanResult.isFound ? "Item Found!" : "Not Found"}
                </div>
            )}
        </div>
      </div>

      {/* Bottom half: Map view */}
      <div className="relative w-full h-[45%] bg-white flex flex-col">
        <StoreMap items={itemsToMap} simulatedUserPosition={currentPosition} />

        {/* Item Card Overlay */}
        {currentItem && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800">{currentItem.name}</p>
                <p className="text-sm text-gray-500">End of Aisle {currentItem.location.aisle}</p>
              </div>
              <Button
                onClick={handleScan}
                disabled={isScanning || currentInstruction.type !== 'scan'}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-2"
              >
                {isScanning ? <LoaderCircle className="w-5 h-5 animate-spin"/> : "Got it"}
              </Button>
            </div>
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
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
