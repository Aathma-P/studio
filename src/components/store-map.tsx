"use client";

import * as React from 'react';
import type { ShoppingListItem, MapPoint } from '@/lib/types';
import { STORE_LAYOUT, ENTRANCE_POS, CHECKOUT_POS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ShoppingBasket, Navigation } from 'lucide-react';

interface StoreMapProps {
  items: ShoppingListItem[];
}

const CELL_SIZE = 40; // in pixels

const getAisleX = (aisle: number) => (aisle - 1) * 2 + 1;

export default function StoreMap({ items }: StoreMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [userPosition, setUserPosition] = React.useState<MapPoint | null>(null);
  const [userHeading, setUserHeading] = React.useState<number | null>(null);


  React.useEffect(() => {
    let watchId: number;

    const handleSuccess = (position: GeolocationPosition) => {
      // In a real application, you would have a function to convert
      // GPS coordinates (latitude, longitude) to your store's map coordinates (x, y).
      // For this demo, we'll continue to use a simulated path, but triggered by GPS updates.
      // This demonstrates the integration of the Geolocation API.
      
      // A simple simulation of converting coordinates:
      // This is NOT a real conversion. It's for demonstration purposes.
      const simulatedX = (position.coords.longitude % 0.001) * 10000;
      const simulatedY = (position.coords.latitude % 0.001) * 10000;

      // To keep the arrow within the map for the demo, we'll still use predefined points,
      // but the *update* is now triggered by real GPS data.
      if (!userPosition) {
        setUserPosition({ x: 0.5, y: 11.5 });
      } else {
         // This is where you would put your logic to update the position based on the new coordinates.
         // For now, let's just log it to show it's working.
         console.log("New position from GPS:", position.coords);
         // To make it visually move for the demo, let's just cycle through some points on each update.
         const simulatedPositions: MapPoint[] = [
            { x: 0.5, y: 11.5 }, { x: 2.5, y: 11.5 }, { x: 4.5, y: 10.5 },
            { x: 4.5, y: 8 }, { x: 4.5, y: 6 }, { x: 6.5, y: 6 },
            { x: 8.5, y: 6 }, { x: 8.5, y: 4 }, { x: 8.5, y: 2 },
            { x: 6.5, y: 2 }, { x: 4.5, y: 2 }, { x: 2.5, y: 2 },
            { x: 0.5, y: 2 }, { x: 0.5, y: 5 }, { x: 0.5, y: 8 },
            { x: 0.5, y: 11.5 }
         ];
         const currentIndex = simulatedPositions.findIndex(p => p.x === userPosition.x && p.y === userPosition.y);
         const nextIndex = (currentIndex + 1) % simulatedPositions.length;
         setUserPosition(simulatedPositions[nextIndex]);
      }
      if (position.coords.heading !== null) {
          setUserHeading(position.coords.heading);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn(`ERROR(${error.code}): ${error.message}`);
      // Fallback to initial position if GPS fails
      if (!userPosition) {
        setUserPosition(ENTRANCE_POS);
      }
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    }

    // Device orientation for compass heading
    const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.webkitCompassHeading) {
            // Apple devices
            setUserHeading(event.webkitCompassHeading);
        } else if (event.alpha !== null) {
            // Standard devices
            setUserHeading(360 - event.alpha);
        }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


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
    <div className="w-full h-full flex items-center justify-center overflow-auto bg-muted/20">
      {items.length === 0 ? (
        <div className="text-center">
          <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Map is ready</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add items to your list to see the optimal route.</p>
        </div>
      ) : (
        <div 
          ref={mapContainerRef} 
          className="relative origin-top-left"
          style={{
            width: STORE_LAYOUT[0].length * CELL_SIZE,
            height: STORE_LAYOUT.length * CELL_SIZE,
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
              const isFirst = index === 0;
              return (
                <div 
                    key={item.id}
                    className="absolute flex items-center justify-center bg-primary rounded-full text-primary-foreground text-xs w-6 h-6"
                    style={{
                        left: aisleX * CELL_SIZE + CELL_SIZE / 4,
                        top: itemY * CELL_SIZE + CELL_SIZE / 4,
                    }}
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

          {/* User Location Arrow */}
          {userPosition && (
              <div 
                className="absolute transition-all duration-500 ease-linear"
                style={{
                    left: userPosition.x * CELL_SIZE,
                    top: userPosition.y * CELL_SIZE,
                    transform: `translate(${CELL_SIZE/2}px, ${CELL_SIZE/2}px) rotate(${userHeading || 0}deg)`
                }}
              >
                  <Navigation className="text-blue-500 w-5 h-5 -translate-x-1/2 -translate-y-1/2" fill="currentColor" />
              </div>
          )}
        </div>
      )}
    </div>
  );
}