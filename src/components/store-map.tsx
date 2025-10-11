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

// This function gets the walkable space next to an aisle
const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;
// This function gets the shelf space for an aisle
const getAisleShelfX = (aisle: number) => (aisle - 1) * 2 + 1;


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
    
    let fullPath: MapPoint[] = [];
    let currentPos = {x: Math.round(ENTRANCE_POS.x), y: Math.round(ENTRANCE_POS.y)};

    // Path from entrance to first item
    const firstItemTarget = { x: getAisleNavX(sortedItems[0].location.aisle), y: sortedItems[0].location.section };
    let segment = findPath(currentPos, firstItemTarget, STORE_LAYOUT);
    if (segment) {
      fullPath = fullPath.concat(segment);
      currentPos = segment[segment.length - 1];
    }
    
    // Path between items
    for (let i = 0; i < sortedItems.length - 1; i++) {
        const startItem = sortedItems[i];
        const endItem = sortedItems[i+1];
        // Start from the walkable space next to the previous item
        const startPos = { x: getAisleNavX(startItem.location.aisle), y: startItem.location.section };
        const endPos = { x: getAisleNavX(endItem.location.aisle), y: endItem.location.section };
        
        segment = findPath(startPos, endPos, STORE_LAYOUT);
        if (segment) {
            // remove first point to avoid duplicate with previous segment's end
            fullPath = fullPath.concat(segment.slice(1));
            currentPos = segment[segment.length - 1];
        }
    }

    // Path from last item to checkout
    if (sortedItems.length > 0) {
        const lastItem = sortedItems[sortedItems.length - 1];
        const lastItemPos = { x: getAisleNavX(lastItem.location.aisle), y: lastItem.location.section };
        const checkoutTarget = { x: Math.round(CHECKOUT_POS.x), y: Math.round(CHECKOUT_POS.y) };
        segment = findPath(lastItemPos, checkoutTarget, STORE_LAYOUT);
        if (segment) {
            fullPath = fullPath.concat(segment.slice(1));
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
                  cell === 2 && "bg-green-500/20",
                  cell === 3 && "bg-blue-500/20",
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
                    className="absolute flex items-center justify-center bg-primary rounded-full text-primary-foreground text-xs z-10"
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
