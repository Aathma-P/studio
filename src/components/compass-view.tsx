
"use client";

import * as React from "react";
import { ArrowUp, CornerUpLeft, ShoppingBasket, ArrowRight, CornerUpRight } from "lucide-react";
import type { ShoppingListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getTurnByTurnInstructions, Instruction } from "@/lib/pathfinding";
import { findPath } from "@/lib/pathfinding";
import { ENTRANCE_POS } from "@/lib/data";
import StoreMap from "./store-map";

interface CompassViewProps {
  items: ShoppingListItem[];
}

export default function CompassView({ items }: CompassViewProps) {
  const [instructions, setInstructions] = React.useState<Instruction[]>([]);
  const [instructionIndex, setInstructionIndex] = React.useState(0);

  const itemsToVisit = React.useMemo(() => items.filter(i => !i.completed), [items]);
  
  const sortedItems = React.useMemo(() => {
    if (itemsToVisit.length === 0) return [];
  
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
        break;
      }
    }
    return orderedPath;
  }, [itemsToVisit]);

  React.useEffect(() => {
    if (sortedItems.length > 0) {
      const newInstructions = getTurnByTurnInstructions(sortedItems);
      setInstructions(newInstructions);
      setInstructionIndex(0);
    } else {
      setInstructions([]);
      setInstructionIndex(0);
    }
  }, [sortedItems]);

  const currentInstruction = instructions[instructionIndex];

  const goToNextInstruction = () => {
    setInstructionIndex(prev => Math.min(prev + 1, instructions.length - 1));
  };

  const goToPreviousInstruction = () => {
    setInstructionIndex(prev => Math.max(prev - 1, 0));
  };
  
  if (items.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center text-gray-500">
          <ShoppingBasket className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-medium text-gray-800">Compass is ready</h3>
          <p className="mt-1 text-sm">Add items to your list to start navigation.</p>
        </div>
      </div>
    );
  }

  if (!currentInstruction) {
    return (
       <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center text-gray-500">
          <ShoppingBasket className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-800">Shopping Complete!</h3>
          <p className="mt-1 text-sm">You've found all your items.</p>
        </div>
      </div>
    );
  }

  const getArrowRotation = () => {
    switch (currentInstruction.type) {
      case 'left':
      case 'turn-left':
        return '-rotate-90';
      case 'right':
      case 'turn-right':
        return 'rotate-90';
      case 'straight':
      case 'start':
      case 'scan':
      case 'finish':
      default:
        return 'rotate-0';
    }
  };
  
  const mapPosition = currentInstruction?.pathPoint;
  const currentItem = React.useMemo(() => {
    if (!currentInstruction) return null;
    const nextScanInstruction = instructions.slice(instructionIndex).find(inst => inst.type === 'scan' || inst.type === 'finish');
    if (nextScanInstruction) {
        return sortedItems.find(it => it.id === nextScanInstruction.itemId) || sortedItems[sortedItems.length - 1];
    }
    return null;
  }, [instructionIndex, instructions, sortedItems]);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center bg-gray-900 text-white p-4 gap-8 overflow-hidden">
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-between">
          <div className="text-center opacity-80">
            <p className="text-lg">Next Item</p>
            <p className="text-2xl font-bold">
                {currentItem?.name || "Checkout"}
            </p>
          </div>

          <div 
            key={instructionIndex}
            className="flex flex-col items-center justify-center animate-fade-in"
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gray-800/50 border-4 border-gray-700 flex items-center justify-center">
                <div className="absolute top-2 text-xl font-bold opacity-50">N</div>
                <div className="absolute bottom-2 text-xl font-bold opacity-50">S</div>
                <div className="absolute left-2 text-xl font-bold opacity-50">W</div>
                <div className="absolute right-2 text-xl font-bold opacity-50">E</div>

                <ArrowUp 
                    className={cn(
                        'w-24 h-24 md:w-32 md:h-32 text-green-400 transition-transform duration-500 ease-in-out',
                        getArrowRotation()
                    )} 
                    strokeWidth={1}
                />
            </div>

            <div className="mt-8 text-center">
                <p className="text-2xl md:text-3xl font-bold tracking-tight">
                    {currentInstruction.text}
                </p>
                {currentInstruction.distance && currentInstruction.type === 'straight' && (
                    <p className="mt-2 text-lg md:text-xl text-green-400 font-medium">
                        for {currentInstruction.distance * 5} feet
                    </p>
                )}
                {currentInstruction.type === 'scan' && (
                    <p className="mt-2 text-lg md:text-xl text-green-400 font-medium">
                        Item should be nearby
                    </p>
                )}
            </div>
          </div>
          
          <div className="w-full flex justify-between items-center">
              <Button 
                onClick={goToPreviousInstruction} 
                disabled={instructionIndex === 0}
                variant="outline"
                className="bg-transparent border-gray-600 hover:bg-gray-800 text-white"
              >
                  Previous
              </Button>
              <p className="text-sm opacity-60">Step {instructionIndex + 1} of {instructions.length}</p>
              <Button 
                onClick={goToNextInstruction}
                disabled={instructionIndex === instructions.length -1}
                className="bg-green-600 hover:bg-green-700"
              >
                  Next
              </Button>
          </div>
      </div>
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4">
        <div className="w-full h-full max-w-md max-h-[50vh] lg:max-h-full aspect-auto rounded-lg overflow-hidden bg-white">
          <StoreMap items={sortedItems} simulatedUserPosition={mapPosition} />
        </div>
      </div>

       <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
