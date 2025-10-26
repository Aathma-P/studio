
"use client";

import * as React from 'react';
import type { ShoppingListItem, MapPoint } from '@/lib/types';
import { STORE_LAYOUT, ENTRANCE_POS, CHECKOUT_POS, MAP_SECTIONS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ShoppingBasket } from 'lucide-react';
import { findPath } from '@/lib/pathfinding';

interface StoreMapProps {
  items: ShoppingListItem[];
  simulatedUserPosition?: MapPoint;
}

const GRID_COLS = STORE_LAYOUT[0].length;
const GRID_ROWS = STORE_LAYOUT.length;

const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;
const getAisleShelfX = (aisle: number) => (aisle - 1) * 2 + 1;


export default function StoreMap({ items, simulatedUserPosition }: StoreMapProps) {
  
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
          // If no path can be found to any remaining item, break to avoid infinite loop
          break;
        }
      }
      return orderedPath;
    };
  
    return findShortestGreedyPath(itemsWithNavPoints);
  }, [items]);

  const pathPoints = React.useMemo(() => {
    if (sortedItems.length === 0) return [];

    const waypoints: MapPoint[] = [
        ENTRANCE_POS,
        ...sortedItems.map(item => ({
            x: getAisleNavX(item.location.aisle),
            y: item.location.section,
        })),
        CHECKOUT_POS,
    ];

    let fullPath: MapPoint[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
        const startPoint = waypoints[i];
        const endPoint = waypoints[i+1];
        
        const segment = findPath(startPoint, endPoint);

        if (segment) {
            // The first segment includes the start point, subsequent ones shouldn't to avoid duplicates
            const segmentToAdd = i === 0 ? segment : segment.slice(1);
            fullPath = fullPath.concat(segmentToAdd);
        } else {
          // If any segment fails, the whole path is invalid.
          console.error("Pathfinding failed between", startPoint, "and", endPoint);
          return [];
        }
    }
    
    return fullPath;
  }, [sortedItems]);

  if (items.length === 0 && !simulatedUserPosition) {
    return (
      <div className="text-center p-4">
        <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Map is ready</h3>
        <p className="mt-1 text-sm text-muted-foreground">Add items to your list to see the optimal route.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative grid bg-muted/20 max-w-full max-h-full"
      style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`
      }}
    >
      {/* Render layout */}
      {STORE_LAYOUT.map((row, y) => (
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={cn(
              "w-full h-full",
              cell === 1 && "bg-neutral-300 dark:bg-neutral-700",
              cell === 2 && "bg-green-500/20", // Entrance
              cell === 3 && "bg-blue-500/20", // Checkout
            )}
            style={{
              gridColumnStart: x + 1,
              gridRowStart: y + 1,
            }}
          />
        ))
      ))}

      {/* Render Map Sections */}
      {MAP_SECTIONS.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div
            key={section.name}
            className="flex flex-col items-center justify-center text-neutral-500 z-0 text-[8px] md:text-[10px] lg:text-xs"
            style={{
              gridColumn: `${section.position.x + 1} / span ${section.size.width}`,
              gridRow: `${section.position.y + 1} / span ${section.size.height}`,
            }}
            title={section.name}
          >
              <SectionIcon 
                className={cn(section.color, 'opacity-80 h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5')}
              />
              <span className={cn("mt-1 font-semibold", section.color)}>{section.name}</span>
          </div>
        )
      })}


      {/* Render item locations */}
      {sortedItems.map((item, index) => {
          const aisleX = getAisleShelfX(item.location.aisle);
          const itemY = item.location.section;
          return (
            <div 
                key={item.id}
                className="relative flex items-center justify-center bg-primary/90 border-2 border-white/80 rounded-full text-primary-foreground text-xs font-bold z-20 shadow-md p-1 aspect-square"
                style={{
                    gridColumnStart: aisleX + 1,
                    gridRowStart: itemY + 1,
                }}
                title={item.name}
            >
                <span className="text-[8px] md:text-xs">{index + 1}</span>
            </div>
          )
      })}

      {/* Render path */}
      {pathPoints.length > 0 && (
        <svg className="absolute top-0 left-0 w-full h-full z-10" style={{ pointerEvents: 'none' }} 
          viewBox={`0 0 ${GRID_COLS} ${GRID_ROWS}`} preserveAspectRatio="none">
            <polyline
            className="path-animation"
            points={pathPoints.map(p => `${p.x + 0.5},${p.y + 0.5}`).join(' ')}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="0.4 0.4"
            />
        </svg>
       )}

       {/* Render simulated user position */}
       {simulatedUserPosition && (
        <div
          className="relative z-30 flex items-center justify-center transition-all duration-300 ease-linear"
          style={{
            gridColumnStart: Math.round(simulatedUserPosition.x) + 1,
            gridRowStart: Math.round(simulatedUserPosition.y) + 1,
          }}
        >
          <div className="w-3/5 h-3/5 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
        </div>
       )}
       <style jsx>{`
        .path-animation {
            animation: march 15s linear infinite;
        }
        @keyframes march {
            from {
                stroke-dashoffset: 20;
            }
            to {
                stroke-dashoffset: 0;
            }
        }
       `}</style>
    </div>
  );
}
