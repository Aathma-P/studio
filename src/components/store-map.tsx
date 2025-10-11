"use client";

import * as React from 'react';
import type { ShoppingListItem, MapPoint } from '@/lib/types';
import { STORE_LAYOUT, ENTRANCE_POS, CHECKOUT_POS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ShoppingBasket } from 'lucide-react';

interface StoreMapProps {
  items: ShoppingListItem[];
}

const CELL_SIZE = 40; // in pixels

const getAisleX = (aisle: number) => (aisle - 1) * 2 + 1;

export default function StoreMap({ items }: StoreMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.location.aisle !== b.location.aisle) {
        return a.location.aisle - b.location.aisle;
      }
      return a.location.section - b.location.section;
    });
  }, [items]);

  const pathPoints = React.useMemo(() => {
    if (sortedItems.length === 0) return [];
    
    let currentPos = ENTRANCE_POS;
    const points: MapPoint[] = [currentPos];

    sortedItems.forEach(item => {
      const aisleX = getAisleX(item.location.aisle);
      const itemY = item.location.section;
      
      // Move along top/bottom aisle
      points.push({ x: aisleX, y: currentPos.y });
      // Move into the aisle
      points.push({ x: aisleX, y: itemY });
      currentPos = { x: aisleX, y: itemY };
    });

    // Path to checkout
    const lastItemPos = points[points.length - 1];
    points.push({ x: lastItemPos.x, y: CHECKOUT_POS.y });
    points.push(CHECKOUT_POS);
    
    return points;
  }, [sortedItems]);


  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto bg-muted/20 p-4">
      {items.length === 0 ? (
        <div className="text-center">
          <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Map is ready</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add items to your list to see the optimal route.</p>
        </div>
      ) : (
        <div 
          ref={mapContainerRef} 
          className="relative"
          style={{
            width: STORE_LAYOUT[0].length * CELL_SIZE,
            height: STORE_LAYOUT.length * CELL_SIZE,
            minWidth: STORE_LAYOUT[0].length * CELL_SIZE,
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
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              />
            ))
          ))}
          {/* Render item locations */}
          {sortedItems.map((item, index) => {
              const aisleX = getAisleX(item.location.aisle);
              const itemY = item.location.section;
              return (
                <div 
                    key={item.id}
                    className="absolute flex items-center justify-center bg-primary rounded-full text-primary-foreground text-xs w-6 h-6 z-10"
                    style={{
                        left: aisleX * CELL_SIZE + (CELL_SIZE - 24) / 2,
                        top: itemY * CELL_SIZE + (CELL_SIZE - 24) / 2,
                    }}
                    title={item.name}
                >
                    {index + 1}
                </div>
              )
          })}
          {/* Render path */}
          <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <polyline
              points={pathPoints.map(p => `${p.x * CELL_SIZE + CELL_SIZE / 2},${p.y * CELL_SIZE + CELL_SIZE / 2}`).join(' ')}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
