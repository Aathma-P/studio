"use client";

import * as React from "react";
import Image from "next/image";
import { Map, Camera, PanelLeft, ShoppingBasket, Search } from "lucide-react";

import type { ShoppingListItem, Product } from "@/lib/types";
import { ALL_PRODUCTS } from "@/lib/data";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import ShoppingList from "@/components/shopping-list";
import StoreMap from "@/components/store-map";
import ArView from "@/components/ar-view";
import { Icons } from "@/components/icons";

export default function Home() {
  const [shoppingList, setShoppingList] = React.useState<ShoppingListItem[]>([]);
  const [view, setView] = React.useState<"map" | "ar">("map");
  const [isSearching, setIsSearching] = React.useState(false);

  const handleAddItem = (product: Product) => {
    if (!shoppingList.find((item) => item.id === product.id)) {
      setShoppingList([...shoppingList, { ...product, completed: false }]);
    }
    setIsSearching(false);
  };

  const handleRemoveItem = (productId: string) => {
    setShoppingList(shoppingList.filter((item) => item.id !== productId));
  };

  const handleToggleItem = (productId: string) => {
    setShoppingList(
      shoppingList.map((item) =>
        item.id === productId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const pendingItems = shoppingList.filter((item) => !item.completed);

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full flex-col bg-background">
        <header className="flex h-16 items-center border-b bg-card px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="text-lg">Aisle Navigator</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg bg-muted p-1 md:flex">
              <Button
                variant={view === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("map")}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                2D Map
              </Button>
              <Button
                variant={view === "ar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("ar")}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                AR View
              </Button>
            </div>
             <Sheet open={isSearching} onOpenChange={setIsSearching}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <ShoppingBasket className="h-4 w-4" />
                        <span className="sr-only">Toggle shopping list</span>
                    </Button>
                </SheetTrigger>
                 <SheetContent side="left" className="w-full max-w-sm p-0">
                   <SheetHeader>
                     <SheetTitle className="sr-only">Shopping List</SheetTitle>
                   </SheetHeader>
                   <ShoppingList
                    items={shoppingList}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onToggleItem={handleToggleItem}
                    allProducts={ALL_PRODUCTS}
                    isSearching={isSearching}
                    onSearchChange={setIsSearching}
                  />
                </SheetContent>
            </Sheet>
            <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsSearching(true)}>
                <Search className="h-4 w-4" />
                <span className="sr-only">Search items</span>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <div className="hidden w-80 shrink-0 border-r md:flex md:flex-col">
            <ShoppingList
              items={shoppingList}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onToggleItem={handleToggleItem}
              allProducts={ALL_PRODUCTS}
            />
          </div>

          <div className="flex-1 overflow-auto relative">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg bg-muted p-1 md:hidden">
                <Button
                    variant={view === "map" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setView("map")}
                >
                    <Map className="h-4 w-4" />
                </Button>
                <Button
                    variant={view === "ar" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setView("ar")}
                >
                    <Camera className="h-4 w-4" />
                </Button>
            </div>

            {view === "map" ? (
              <StoreMap items={pendingItems} />
            ) : (
              <ArView items={pendingItems} />
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
