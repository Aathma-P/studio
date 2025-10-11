"use client";

import * as React from 'react';
import type { ShoppingListItem, MapPoint } from '@/lib/types';
import { STORE_LAYOUT, ENTRANCE_POS, CHECKOUT_POS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ShoppingBasket } from 'lucide-react';
import { findPath } from '@/lib/pathfinding';

interface StoreMapProps {
  items: ShoppingListItem[];
}

const INITIAL_CELL_SIZE = 40; // in pixels

// This function gets the walkable space in the aisle for a given shelf column
const getAisleNavX = (aisle: number) => aisle * 2;
// This function gets the X coordinate of the shelf itself
const getAisleShelfX = (aisle: number) => aisle * 2 - 1;


export default function StoreMap({ items }: StoreMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = React.useState(INITIAL_CELL_SIZE);

  React.useLayoutEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    const resizeObserver = new ResizeObserver(() => {
      const containerWidth = mapContainer.offsetWidth;
      // Subtract padding from container width for more accurate calculations
      const containerPadding = parseFloat(getComputedStyle(mapContainer).paddingLeft) + parseFloat(getComputedStyle(mapContainer).paddingRight);
      const availableWidth = containerWidth - containerPadding;
      const mapGridWidth = STORE_LAYOUT[0].length;
      
      const newCellSize = availableWidth / mapGridWidth;
      setCellSize(Math.min(newCellSize, INITIAL_CELL_SIZE));
    });

    resizeObserver.observe(mapContainer);

    return () => resizeObserver.disconnect();
  }, []);

  const sortedItems = React.useMemo(() => {
    // This sort determines the order of visiting items
    return [...items].sort((a, b) => {
      if (a.location.aisle !== b.location.aisle) {
        return a.location.aisle - b.location.aisle;
      }
      return a.location.section - b.location.section;
    });
  }, [items]);

  const pathPoints = React.useMemo(() => {
    if (sortedItems.length === 0) return [];

    const waypoints: MapPoint[] = [
        ENTRANCE_POS,
        ...sortedItems.map(item => ({
            // Target the navigation path in the aisle next to the shelf
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
            // If it's not the first segment, slice(1) to avoid duplicate points
            const segmentToAdd = i === 0 ? segment : segment.slice(1);
            fullPath = fullPath.concat(segmentToAdd);
        }
    }
    
    return fullPath;
  }, [sortedItems]);

  return (
    <div ref={mapContainerRef} className="w-full h-full flex items-center justify-center bg-muted/20 p-4 overflow-auto">
      {items.length === 0 ? (
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
        </div>
      )}
    </div>
  );
}
