"use client";

import * as React from 'react';
import type { ShoppingListItem, MapPoint } from '@/lib/types';
import { STORE_LAYOUT, ENTRANCE_POS, CHECKOUT_POS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ShoppingBasket } from 'lucide-react';
import { findPath } from '@/lib/pathfinding';

interface StoreMapProps {
  items: ShoppingListItem[];
  simulatedUserPosition?: MapPoint;
}

const INITIAL_CELL_SIZE = 40;

const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;
const getAisleShelfX = (aisle: number) => (aisle - 1) * 2 + 1;


export default function StoreMap({ items, simulatedUserPosition }: StoreMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = React.useState(INITIAL_CELL_SIZE);

  React.useLayoutEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    const resizeObserver = new ResizeObserver(() => {
      const containerWidth = mapContainer.offsetWidth;
      const containerHeight = mapContainer.offsetHeight;
      const containerPaddingX = parseFloat(getComputedStyle(mapContainer).paddingLeft) + parseFloat(getComputedStyle(mapContainer).paddingRight);
      const containerPaddingY = parseFloat(getComputedStyle(mapContainer).paddingTop) + parseFloat(getComputedStyle(mapContainer).paddingBottom);
      
      const availableWidth = containerWidth - containerPaddingX;
      const availableHeight = containerHeight - containerPaddingY;

      const mapGridWidth = STORE_LAYOUT[0].length;
      const mapGridHeight = STORE_LAYOUT.length;
      
      const newCellSizeByWidth = availableWidth / mapGridWidth;
      const newCellSizeByHeight = availableHeight / mapGridHeight;

      setCellSize(Math.min(newCellSizeByWidth, newCellSizeByHeight, INITIAL_CELL_SIZE));
    });

    resizeObserver.observe(mapContainer);

    return () => resizeObserver.disconnect();
  }, []);

  const sortedItems = React.useMemo(() => {
    if (items.length === 0) return [];
  
    const itemsWithNavPoints = items.map(item => ({
      ...item,
      navPoint: {
        x: getAisleNavX(item.location.aisle),
        y: item.location.section,
      }
    }));
  
    const calculateTotalDistance = (path: typeof itemsWithNavPoints): number => {
      let totalDist = 0;
      let lastPoint = ENTRANCE_POS;
      
      const waypoints = [lastPoint, ...path.map(p => p.navPoint), CHECKOUT_POS];
      
      for(let i=0; i<waypoints.length-1; i++) {
        const segment = findPath(waypoints[i], waypoints[i+1], STORE_LAYOUT);
        totalDist += segment?.length || Infinity;
      }
      return totalDist;
    };
  
    const findShortestPath = (itemsToVisit: typeof itemsWithNavPoints): typeof itemsWithNavPoints => {
      let shortestPath: typeof itemsWithNavPoints = [];
      let minDistance = Infinity;
  
      const permute = (arr: typeof itemsWithNavPoints, l: number, r: number) => {
        if (l === r) {
          const currentDistance = calculateTotalDistance(arr);
          if (currentDistance < minDistance) {
            minDistance = currentDistance;
            shortestPath = [...arr];
          }
        } else {
          for (let i = l; i <= r; i++) {
            [arr[l], arr[i]] = [arr[i], arr[l]];
            permute(arr, l + 1, r);
            [arr[l], arr[i]] = [arr[i], arr[l]]; // backtrack
          }
        }
      };
      // For performance, only use permutation for small lists.
      // For larger lists, a greedy approach is better than nothing.
      if (itemsToVisit.length <= 7) { 
        permute(itemsToVisit, 0, itemsToVisit.length - 1);
      } else { // Greedy approach for larger lists
        let unvisited = [...itemsToVisit];
        let currentPoint = ENTRANCE_POS;
        while(unvisited.length > 0) {
          unvisited.sort((a,b) => {
            const distA = findPath(currentPoint, a.navPoint, STORE_LAYOUT)?.length || Infinity;
            const distB = findPath(currentPoint, b.navPoint, STORE_LAYOUT)?.length || Infinity;
            return distA - distB;
          });
          const nextItem = unvisited.shift()!;
          shortestPath.push(nextItem);
          currentPoint = nextItem.navPoint;
        }
      }
      
      return shortestPath;
    };
  
    return findShortestPath(itemsWithNavPoints);
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
        
        const segment = findPath(startPoint, endPoint, STORE_LAYOUT);

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

  const userIconSize = cellSize;

  return (
    <div ref={mapContainerRef} className="w-full h-full flex items-center justify-center bg-muted/20 p-4 overflow-hidden">
      {items.length === 0 && !simulatedUserPosition ? (
        <div className="text-center">
          <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Map is ready</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add items to your list to see the optimal route.</p>
        </div>
      ) : (
        <div 
          className="relative shrink-0"
          style={{
            width: STORE_LAYOUT[0].length * cellSize,
            height: STORE_LAYOUT.length * cellSize,
          }}
        >
          {/* Render layout */}
          {STORE_LAYOUT.map((row, y) => (
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={cn(
                  "absolute",
                  cell === 1 && "bg-neutral-300 dark:bg-neutral-700",
                  cell === 2 && "bg-green-500/20", // Entrance
                  cell === 3 && "bg-blue-500/20", // Checkout
                )}
                style={{
                  left: x * cellSize,
                  top: y * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
              />
            ))
          ))}
          {/* Render item locations */}
          {sortedItems.map((item, index) => {
              const aisleX = getAisleShelfX(item.location.aisle);
              const itemY = item.location.section;
              const iconSize = Math.max(16, cellSize * 0.6);
              return (
                <div 
                    key={item.id}
                    className="absolute flex items-center justify-center bg-primary rounded-full text-primary-foreground text-xs font-bold z-10"
                    style={{
                        left: aisleX * cellSize + (cellSize - iconSize) / 2,
                        top: itemY * cellSize + (cellSize - iconSize) / 2,
                        width: iconSize,
                        height: iconSize,
                        fontSize: Math.max(8, cellSize * 0.3)
                    }}
                    title={item.name}
                >
                    {index + 1}
                </div>
              )
          })}
          {/* Render path */}
          {pathPoints.length > 0 && (
            <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <polyline
                points={pathPoints.map(p => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinejoin="round"
                strokeLinecap="round"
                />
            </svg>
           )}
           {/* Render simulated user position */}
           {simulatedUserPosition && (
            <div
              className="absolute z-20 flex items-center justify-center transition-all duration-300 ease-linear"
              style={{
                left: simulatedUserPosition.x * cellSize + (cellSize - userIconSize) / 2,
                top: simulatedUserPosition.y * cellSize + (cellSize - userIconSize) / 2,
                width: userIconSize,
                height: userIconSize,
              }}
            >
              <div className="w-3/5 h-3/5 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            </div>
           )}
        </div>
      )}
    </div>
  );
}