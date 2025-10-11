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

  const routePoints = React.useMemo(() => {
    const points: MapPoint[] = [ENTRANCE_POS];
    let lastAisle = -1;

    sortedItems.forEach((item) => {
      const aisleX = getAisleX(item.location.aisle);
      const itemY = item.location.section + 0.5;

      if (item.location.aisle !== lastAisle) {
        if(lastAisle !== -1) {
            points.push({ x: getAisleX(lastAisle) + 0.5, y: 10.5 });
        }
        points.push({ x: aisleX + 0.5, y: 10.5 });
        points.push({ x: aisleX + 0.5, y: itemY });
      } else {
        points.push({ x: aisleX + 0.5, y: itemY });
      }
      lastAisle = item.location.aisle;
    });
    
    if (lastAisle !== -1) {
        points.push({ x: getAisleX(lastAisle) + 0.5, y: 10.5 });
    }
    points.push({ x: CHECKOUT_POS.x -1, y: 10.5 });
    points.push(CHECKOUT_POS);

    return points;
  }, [sortedItems]);
  
  const pathData = React.useMemo(() => {
    if (routePoints.length < 2) return '';
    const path = routePoints.map((p) => `${p.x * CELL_SIZE},${p.y * CELL_SIZE}`).join('L');
    return `M${path}`;
  }, [routePoints]);

  const mapWidth = STORE_LAYOUT[0].length * CELL_SIZE;
  const mapHeight = STORE_LAYOUT.length * CELL_SIZE;

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30 p-4 md:p-8 overflow-auto">
        {items.length === 0 ? (
             <div className="text-center">
                <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Map is ready</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add items to your shopping list to see the optimal route.</p>
            </div>
        ) : (
            <div
                ref={mapContainerRef}
                className="relative shrink-0"
                style={{ width: mapWidth, height: mapHeight }}
            >
                <div className="grid grid-cols-13" style={{ gridTemplateColumns: `repeat(${STORE_LAYOUT[0].length}, minmax(0, 1fr))` }}>
                {STORE_LAYOUT.flat().map((cell, i) => (
                    <div
                    key={i}
                    className={cn('w-full h-10 border border-border/20', {
                        'bg-card': cell === 0,
                        'bg-muted/50': cell === 1,
                        'bg-green-200': cell === 2,
                        'bg-blue-200': cell === 3,
                    })}
                    />
                ))}
                </div>
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ width: mapWidth, height: mapHeight }}>
                    {/* Route path */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="path-animate"
                    />
                    <style jsx>{`
                        .path-animate {
                            stroke-dasharray: 1000;
                            stroke-dashoffset: 1000;
                            animation: draw 5s linear forwards;
                        }
                        @keyframes draw {
                            to {
                            stroke-dashoffset: 0;
                            }
                        }
                    `}</style>
                    
                    {/* Item markers */}
                    {sortedItems.map((item, index) => {
                        const aisleX = getAisleX(item.location.aisle);
                        const itemY = item.location.section + 0.5;
                        const Icon = item.icon;
                        return (
                            <g key={item.id} transform={`translate(${aisleX * CELL_SIZE}, ${itemY * CELL_SIZE})`}>
                                <circle cx="0" cy="0" r="14" fill="hsl(var(--primary))" />
                                <text x="0" y="4" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="12" fontWeight="bold">{index + 1}</text>
                            </g>
                        );
                    })}

                    {/* Start and End markers */}
                    <g transform={`translate(${ENTRANCE_POS.x * CELL_SIZE}, ${ENTRANCE_POS.y * CELL_SIZE})`}>
                         <circle cx="0" cy="0" r="14" fill="hsl(var(--accent))" />
                         <text x="0" y="5" textAnchor="middle" fill="hsl(var(--accent-foreground))" fontSize="14" fontWeight="bold">IN</text>
                    </g>
                     <g transform={`translate(${CHECKOUT_POS.x * CELL_SIZE}, ${CHECKOUT_POS.y * CELL_SIZE})`}>
                         <circle cx="0" cy="0" r="14" fill="hsl(var(--accent))" />
                         <text x="0" y="5" textAnchor="middle" fill="hsl(var(--accent-foreground))" fontSize="14" fontWeight="bold">OUT</text>
                    </g>

                </svg>
            </div>
        )}

    </div>
  );
}
