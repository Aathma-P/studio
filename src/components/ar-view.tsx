
"use client";

import * as React from "react";
import { ShoppingBasket, LoaderCircle, CameraOff, SkipForward } from "lucide-react";
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

export default function ArView({ items, onItemScannedAndFound }: ArViewProps) {
  const [arInstructions, setArInstructions] = React.useState<Instruction[]>([]);
  const [instructionIndex, setInstructionIndex] = React.useState(0);
  const [sortedItems, setSortedItems] = React.useState<ShoppingListItem[]>([]);

  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<FindItemOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();

  React.useEffect(() => {
    // This effect runs only when the uncompleted items list changes fundamentally,
    // establishing the initial optimal route.
    const itemsToVisit = items.filter(i => !i.completed);
    if (itemsToVisit.length === 0) {
      setSortedItems([]);
      setArInstructions([]);
      setInstructionIndex(0);
      return;
    };
  
    const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;
    
    const itemsWithNavPoints = itemsToVisit.map(item => ({
      ...item,
      navPoint: {
        x: getAisleNavX(item.location.aisle),
        y: item.location.section,
      }
    }));
    
    let unvisited = [...itemsWithNavPoints];
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
        // No path to any remaining items, break.
        break;
      }
    }
    setSortedItems(orderedPath);
    const instructions = getTurnByTurnInstructions(orderedPath);
    setArInstructions(instructions);
    setInstructionIndex(0);

  // This dependency array is crucial. It only reruns when the *IDs* of uncompleted items change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.filter(i => !i.completed).map(i => i.id).join(',')]);


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
  

  const currentInstruction = arInstructions[instructionIndex];
  
  const itemToScan = React.useMemo(() => {
    if (currentInstruction?.type !== 'scan') return null;
    return sortedItems.find(it => it.id === currentInstruction.itemId);
  }, [currentInstruction, sortedItems]);

  const currentItem = React.useMemo(() => {
    if (!currentInstruction) return null;
    const nextScanInstruction = arInstructions.slice(instructionIndex).find(inst => inst.type === 'scan');
    if (nextScanInstruction) {
        return sortedItems.find(it => it.id === nextScanInstruction.itemId) || null;
    }
    return null;
  }, [instructionIndex, arInstructions, sortedItems]);


  const advanceToNextLogicalStep = (startSearchIndex: number = instructionIndex) => {
    const currentItemId = arInstructions[startSearchIndex]?.itemId;
    
    // If we're not on an item-specific step, just go to the next instruction.
    if (!currentItemId) {
        setInstructionIndex(prev => Math.min(prev + 1, arInstructions.length - 1));
        return;
    }
  
    // Find the first instruction that belongs to a *different* item
    let nextIndex = startSearchIndex + 1;
    while (nextIndex < arInstructions.length && arInstructions[nextIndex].itemId === currentItemId) {
        nextIndex++;
    }
  
    if (nextIndex < arInstructions.length) {
        setInstructionIndex(nextIndex);
    } else {
        // We've finished with the last item, go to the final instruction (checkout).
        setInstructionIndex(arInstructions.length - 1);
    }
  };
  
  const handleSkip = () => {
      if (!itemToScan) return;
      toast({
          title: `Skipped ${itemToScan.name}`,
          description: "Moving to the next item on your list.",
      });
      // Advance past all instructions for the current skipped item.
      advanceToNextLogicalStep();
  };
  
  const handleSuccessfulScan = (itemId: string) => {
    // Mark the item as found in the parent component.
    onItemScannedAndFound(itemId);
    toast({
        title: `Found it!`,
        description: `Added to your cart.`,
    });
    // Now, advance to the next step in our *stable* instruction list.
    advanceToNextLogicalStep();
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
             setTimeout(() => {
                handleSuccessfulScan(itemToScan.id);
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
    
    if (currentInstruction && currentInstruction.type !== 'scan') {
      setInstructionIndex(prev => Math.min(prev + 1, arInstructions.length - 1));
    }
  }

  if (hasCameraPermission === null) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-black">
              <LoaderCircle className="w-12 h-12 text-white animate-spin" />
          </div>
      )
  }
  
  const itemsRemainingToFind = items.filter(i => !i.completed).length;

  if (items.length > 0 && itemsRemainingToFind === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <ShoppingBasket className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium">Shopping Complete!</h3>
          <p className="mt-1 text-sm text-muted-foreground">{arInstructions[arInstructions.length-1]?.text || "Proceed to checkout."}</p>
        </div>
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
    )
  }
  
  if (!currentInstruction) {
    // This can happen briefly while instructions are being calculated.
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <LoaderCircle className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const mapPosition = currentInstruction?.pathPoint;
  
  const nextItemOnPathIndex = sortedItems.findIndex(it => it.id === currentItem?.id);
  const itemsToMap = nextItemOnPathIndex !== -1 ? sortedItems.slice(nextItemOnPathIndex) : [];
  
  const arrowDirection = ['left', 'turn-left'].includes(currentInstruction.type) ? 'left' 
                       : ['right', 'turn-right'].includes(currentInstruction.type) ? 'right' 
                       : 'straight';


  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden">
      <div className="relative flex-1 w-full" onClick={handleUserTap}>
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
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />
        
        {/* Main AR UI elements */}
        <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300",
            currentInstruction.type === 'scan' ? 'opacity-0' : 'opacity-100'
        )}>
             <div
                key={instructionIndex}
                className={cn("arrow-container animate-fade-in", `arrow-${arrowDirection}`)}
              >
                <svg
                  viewBox="0 0 100 120"
                  className="w-full h-full"
                  style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
                >
                  <defs>
                    <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'hsla(145, 70%, 60%, 0.9)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'hsla(145, 63%, 42%, 0.9)', stopOpacity: 1 }} />
                    </linearGradient>
                    <style>
                      {`
                        .arrow-pulse-1, .arrow-pulse-2, .arrow-pulse-3 {
                          animation: chevron-fade 2s infinite ease-in-out;
                        }
                        .arrow-pulse-2 { animation-delay: 0.33s; }
                        .arrow-pulse-3 { animation-delay: 0.66s; }
                      `}
                    </style>
                  </defs>
                  <path d="M50 0 L100 50 L80 50 L50 20 L20 50 L0 50 Z" transform="translate(0, 10)" fill="url(#arrowGradient)" className="arrow-pulse-1" />
                  <path d="M50 20 L100 70 L80 70 L50 40 L20 70 L0 70 Z" transform="translate(0, 10)" fill="url(#arrowGradient)" className="arrow-pulse-2" />
                  <path d="M50 40 L100 90 L80 90 L50 60 L20 90 L0 90 Z" transform="translate(0, 10)" fill="url(#arrowGradient)" className="arrow-pulse-3" />
                </svg>
              </div>
            <div className="mt-16 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg">
                <h2 className="text-xl font-bold">
                    {currentInstruction.text}
                </h2>
            </div>
        </div>

        {/* Scanning UI elements */}
        <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300",
            currentInstruction.type === 'scan' ? 'opacity-100' : 'opacity-0',
            'pointer-events-none'
        )}>
           {itemToScan && (
             <div className="text-center">
                <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg">
                    <h2 className="text-xl font-bold">
                        Scan for {itemToScan.name}
                    </h2>
                </div>
             </div>
           )}
        </div>
        
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full px-8">
            {isScanning && !scanResult && itemToScan && (
              <div className="flex items-center justify-center gap-3 text-white bg-black/50 backdrop-blur-md p-3 rounded-lg text-lg">
                <LoaderCircle className="w-6 h-6 animate-spin" />
                <span>Scanning for {itemToScan.name}...</span>
              </div>
            )}
            {scanResult && (
                <div className={cn("p-4 rounded-lg text-lg text-white text-center font-semibold animate-fade-in backdrop-blur-md", scanResult.isFound ? "bg-green-600/80" : "bg-destructive/80")}>
                    {scanResult.isFound ? `Found ${itemToScan?.name}!` : `Couldn't find ${itemToScan?.name}. Try again.`}
                </div>
            )}
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="w-full bg-white flex flex-col flex-shrink-0" style={{ maxHeight: '40vh' }}>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-4 p-4">
                  <div className="relative grid place-items-center bg-muted/50 rounded-lg p-2">
                      <StoreMap items={itemsToMap} simulatedUserPosition={mapPosition} />
                  </div>
                  <div className="flex flex-col justify-between">
                      {currentItem ? (
                          <div className="space-y-3">
                              <div>
                                  <p className="text-sm font-medium text-gray-500">Next Item</p>
                                  <p className="font-bold text-lg text-gray-800">{currentItem.name}</p>
                                  <p className="text-sm text-gray-500">Aisle {currentItem.location.aisle}, Section {currentItem.location.section}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                  {currentInstruction.type === 'scan' && (
                                      <Button
                                          onClick={handleSkip}
                                          disabled={isScanning}
                                          variant="outline"
                                          size="sm"
                                          className="font-semibold rounded-lg w-full"
                                      >
                                          <SkipForward className="mr-2 h-4 w-4" />
                                          Skip
                                      </Button>
                                  )}
                                  <Button
                                      onClick={currentInstruction.type === 'scan' ? handleScan : handleUserTap}
                                      disabled={isScanning}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg w-full"
                                  >
                                      {isScanning 
                                          ? <LoaderCircle className="w-5 h-5 animate-spin"/> 
                                          : (currentInstruction.type === 'scan' ? "Scan Item" : "Next")
                                      }
                                  </Button>
                              </div>
                          </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                          <ShoppingBasket className="h-8 w-8 mb-2" />
                          <p className="font-semibold">All items found!</p>
                          <p className="text-sm">Proceed to checkout.</p>
                        </div>
                      )}
                  </div>
              </div>
          </ScrollArea>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .arrow-container {
            width: 100px;
            height: 120px;
            position: relative;
            transform-style: preserve-3d;
            perspective: 150px;
            animation: float-animation 2s infinite ease-in-out;
            transition: transform 0.5s ease-out;
        }

        @keyframes chevron-fade {
            0%, 75%, 100% { opacity: 0; transform: translateY(20px); }
            25% { opacity: 1; }
            50% { opacity: 0; transform: translateY(-20px); }
        }
        
        @keyframes float-animation {
            0%, 100% { transform: var(--transform-base); }
            50% { transform: var(--transform-base) translateY(-20px); }
        }
        
        .arrow-container.arrow-left {
            --transform-base: rotateX(50deg) scaleY(1.5) rotate(-60deg);
            transform: var(--transform-base);
        }

        .arrow-container.arrow-right {
            --transform-base: rotateX(50deg) scaleY(1.5) rotate(60deg);
            transform: var(--transform-base);
        }
        
        .arrow-container.arrow-straight {
            --transform-base: rotateX(50deg) scaleY(1.5) rotate(0deg);
            transform: var(--transform-base);
        }
      `}</style>
    </div>
  );
}
