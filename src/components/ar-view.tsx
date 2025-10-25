
"use client";

import * as React from "react";
import { ArrowUp, CornerUpLeft, ShoppingBasket, ScanLine, LoaderCircle, CameraOff, MoveLeft, MoveRight, ArrowRight, SkipForward } from "lucide-react";
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
import { ScrollArea } from "./ui/scroll-area";

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
        console.error("Media Devices API not available.");
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
                const nextItem = sortedItems[currentItemIndex + 1];
                setCurrentItem(nextItem || null); 
            } else {
                 const nextScanInstruction = arInstructions.slice(nextIndex).find(inst => inst.type === 'scan');
                 if (nextScanInstruction) {
                    const item = sortedItems.find(it => it.id === nextScanInstruction.itemId);
                    if (item) setCurrentItem(item);
                 } else {
                    setCurrentItem(null);
                 }
            }
            return nextIndex;
        }
        return prev;
    });
  }, [arInstructions, sortedItems]);


  const handleSkip = () => {
    if (isScanning || !itemToScan) return;
    toast({
      title: `Skipped ${itemToScan.name}`,
      description: "Moving to the next item on your list.",
    });
    
    let nextIndex = instructionIndex + 1;
    while(nextIndex < arInstructions.length && arInstructions[nextIndex].itemId === itemToScan.id) {
        nextIndex++;
    }

    const currentItemIndex = sortedItems.findIndex(it => it.id === itemToScan.id);
    const nextItem = sortedItems[currentItemIndex + 1];
    setCurrentItem(nextItem || null);

    setInstructionIndex(nextIndex);
  };


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
  const arrowDirection = currentInstruction.type === 'left' ? 'left' : currentInstruction.type === 'right' ? 'right' : 'straight';


  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden">
      <div className="relative w-full h-1/2" onClick={handleUserTap}>
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                <Alert variant="destructive" className="max-w-sm">
                    <CameraOff className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                    Please enable camera permissions in your browser settings to use the AR view.
                    </AlertDescription>
                </Alert>
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center scene">
            {currentInstruction.type !== 'scan' && (
                <div key={instructionIndex} className={cn("arrow-3d-container animate-fade-in", arrowDirection)}>
                    <div className="arrow-3d">
                        <div className="arrow-chevron"></div>
                        <div className="arrow-chevron"></div>
                        <div className="arrow-chevron"></div>
                    </div>
                </div>
            )}
             {currentInstruction.type !== 'scan' && (
                <div className="mt-24 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg">
                    <h2 className="text-lg font-bold">
                        {currentInstruction.text}
                    </h2>
                </div>
             )}
        </div>
        
         <div className="absolute top-4 right-4 z-20">
            {isScanning && !scanResult && itemToScan && (
              <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-md p-2 rounded-lg">
                <LoaderCircle className="w-5 h-5 animate-spin" />
                <span>Scanning for {itemToScan.name}...</span>
              </div>
            )}
            {scanResult && (
                <div className={cn("p-2 rounded-lg text-sm text-white animate-fade-in backdrop-blur-md", scanResult.isFound ? "bg-primary/80" : "bg-destructive/80")}>
                    {scanResult.isFound ? "Item Found!" : "Not Found"}
                </div>
            )}
        </div>
      </div>

      <div className="w-full bg-white flex flex-col flex-shrink-0 h-1/2">
        <ScrollArea className="flex-1">
            <div className="flex flex-col h-full">
                <div className="relative flex-1 min-h-[250px]">
                    <StoreMap items={itemsToMap} simulatedUserPosition={currentPosition} />
                </div>

                {currentItem && (
                <div className="bg-white shadow-inner p-4 border-t flex-shrink-0">
                    <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="font-bold text-gray-800">{currentItem.name}</p>
                        <p className="text-sm text-gray-500">Aisle {currentItem.location.aisle}, Section {currentItem.location.section}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentInstruction.type === 'scan' && (
                            <Button
                                onClick={handleSkip}
                                disabled={isScanning}
                                variant="outline"
                                className="font-semibold rounded-lg px-4 py-2"
                            >
                                <SkipForward className="mr-2 h-4 w-4" />
                                Skip
                            </Button>
                        )}
                        <Button
                            onClick={currentInstruction.type === 'scan' ? handleScan : goToNextInstruction}
                            disabled={isScanning}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-2"
                        >
                            {isScanning ? <LoaderCircle className="w-5 h-5 animate-spin"/> : (currentInstruction.type === 'scan' ? "Scan Item" : "Next")}
                        </Button>
                    </div>
                    </div>
                </div>
                )}
            </div>
        </ScrollArea>
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
        
        .scene {
            perspective: 600px;
            transform-style: preserve-3d;
        }

        .arrow-3d-container {
            width: 120px;
            height: 120px;
            transform-style: preserve-3d;
            animation: float 3s ease-in-out infinite;
            transform: rotateX(50deg);
            transition: transform 0.5s ease-out;
        }
        
        .arrow-3d-container.left {
            transform: rotateX(50deg) rotateZ(-45deg);
        }

        .arrow-3d-container.right {
            transform: rotateX(50deg) rotateZ(45deg);
        }

        @keyframes float {
            0% { transform: rotateX(50deg) translateY(0); }
            50% { transform: rotateX(50deg) translateY(-20px); }
            100% { transform: rotateX(50deg) translateY(0); }
        }

        .arrow-3d-container.left {
             animation-name: float-left;
        }
        @keyframes float-left {
            0% { transform: rotateX(50deg) rotateZ(-45deg) translateY(0); }
            50% { transform: rotateX(50deg) rotateZ(-45deg) translateY(-20px); }
            100% { transform: rotateX(50deg) rotateZ(-45deg) translateY(0); }
        }

        .arrow-3d-container.right {
             animation-name: float-right;
        }
        @keyframes float-right {
            0% { transform: rotateX(50deg) rotateZ(45deg) translateY(0); }
            50% { transform: rotateX(50deg) rotateZ(45deg) translateY(-20px); }
            100% { transform: rotateX(50deg) rotateZ(45deg) translateY(0); }
        }

        .arrow-3d {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transform-style: preserve-3d;
            filter: drop-shadow(0 15px 5px rgba(0,0,0,0.3));
        }

        .arrow-chevron {
            width: 60px;
            height: 60px;
            margin-top: -35px;
            border-style: solid;
            border-color: #2AC769;
            border-width: 0 12px 12px 0;
            transform: rotate(315deg);
            background: linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0));
            box-shadow: inset -5px 5px 15px rgba(0,0,0,0.1);
        }

        .arrow-chevron:first-child {
            animation: chevron-fade 1.5s infinite 0s;
        }
        .arrow-chevron:nth-child(2) {
            animation: chevron-fade 1.5s infinite 0.2s;
        }
        .arrow-chevron:nth-child(3) {
            animation: chevron-fade 1.5s infinite 0.4s;
        }

        @keyframes chevron-fade {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

      `}</style>
    </div>
  );
}

    