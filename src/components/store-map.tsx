
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

const INITIAL_CELL_SIZE = 40;

const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;
const getAisleShelfX = (aisle: number) => (aisle - 1) * 2 + 1;


export default function StoreMap({ items, simulatedUserPosition }: StoreMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = React.useState(INITIAL_CELL_SIZE);

  React.useLayoutEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    const updateCellSize = () => {
        const containerWidth = mapContainer.offsetWidth;
        const containerHeight = mapContainer.offsetHeight;
        const containerPaddingX = parseFloat(getComputedStyle(mapContainer).paddingLeft) + parseFloat(getComputedStyle(mapContainer).paddingRight);
        const containerPaddingY = parseFloat(getComputedStyle(mapContainer).paddingTop) + parseFloat(getComputedStyle(mapContainer).paddingBottom);
        
        const availableWidth = containerWidth - containerPaddingX;
        const availableHeight = containerHeight - containerPaddingY;

        const mapGridWidth = STORE_LAYOUT[0].length;
        const mapGridHeight = STORE_LAYOUT.length;
        
        if (availableWidth <= 0 || availableHeight <= 0) return;

        const newCellSizeByWidth = availableWidth / mapGridWidth;
        const newCellSizeByHeight = availableHeight / mapGridHeight;
        
        setCellSize(Math.min(newCellSizeByWidth, newCellSizeByHeight));
    };

    updateCellSize();

    const resizeObserver = new ResizeObserver(updateCellSize);
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

          {/* Render Map Sections */}
          {MAP_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const iconSize = Math.max(16, cellSize * 0.6);
            return (
              <div
                key={section.name}
                className="absolute flex flex-col items-center justify-center text-neutral-500 z-0"
                style={{
                  left: section.position.x * cellSize,
                  top: section.position.y * cellSize,
                  width: cellSize * section.size.width,
                  height: cellSize * section.size.height,
                  fontSize: Math.max(8, cellSize * 0.3)
                }}
                title={section.name}
              >
                  <SectionIcon 
                    className={cn(section.color, 'opacity-80')}
                    style={{width: iconSize, height: iconSize}} 
                  />
                  <span className={cn("mt-1 font-semibold", section.color)}>{section.name}</span>
              </div>
            )
          })}


          {/* Render item locations */}
          {sortedItems.map((item, index) => {
              const aisleX = getAisleShelfX(item.location.aisle);
              const itemY = item.location.section;
              const iconSize = Math.max(16, cellSize * 0.7);
              return (
                <div 
                    key={item.id}
                    className="absolute flex items-center justify-center bg-primary/90 border-2 border-white/80 rounded-full text-primary-foreground text-xs font-bold z-20 shadow-md"
                    style={{
                        left: aisleX * cellSize + (cellSize - iconSize) / 2,
                        top: itemY * cellSize + (cellSize - iconSize) / 2,
                        width: iconSize,
                        height: iconSize,
                        fontSize: Math.max(8, cellSize * 0.35)
                    }}
                    title={item.name}
                >
                    {index + 1}
                </div>
              )
          })}
          {/* Render path */}
          {pathPoints.length > 0 && (
            <svg className="absolute top-0 left-0 w-full h-full z-10" style={{ pointerEvents: 'none' }}>
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
              className="absolute z-30 flex items-center justify-center transition-all duration-300 ease-linear"
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
