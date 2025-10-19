
"use client";

import * as React from "react";
import { Map, Camera, List, Scan } from "lucide-react";

import type { ShoppingListItem, Product } from "@/lib/types";
import { ALL_PRODUCTS } from "@/lib/data";

import { Button } from "@/components/ui/button";
import ShoppingList from "@/components/shopping-list";
import StoreMap from "@/components/store-map";
import ArView from "@/components/ar-view";
import BarcodeScanner from "@/components/barcode-scanner";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type View = "map" | "ar" | "scan";
type MobileView = "list" | "map" | "ar" | "scan";

export default function Home() {
  const [shoppingList, setShoppingList] = React.useState<ShoppingListItem[]>([]);
  const [view, setView] = React.useState<View>("map");
  const [mobileView, setMobileView] = React.useState<MobileView>("list");
  const { toast } = useToast();

  const handleAddItem = (product: Product) => {
    if (!shoppingList.find((item) => item.id === product.id)) {
      setShoppingList([...shoppingList, { ...product, completed: false }]);
      toast({
        title: "Item Added",
        description: `${product.name} has been added to your list.`,
      });
    }
  };

  const handleAddItemById = (productId: string) => {
    const product = ALL_PRODUCTS.find(p => p.id === productId);
    if (product) {
      handleAddItem(product);
    } else {
       toast({
        variant: "destructive",
        title: "Scan Error",
        description: `Product with code "${productId}" not found.`,
      });
    }
  }

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
  const completedItems = shoppingList.filter((item) => item.completed);

  const listTotal = React.useMemo(() => {
    return shoppingList.reduce((total, item) => total + item.price, 0);
  }, [shoppingList]);

  const cartTotal = React.useMemo(() => {
    return completedItems.reduce((total, item) => total + item.price, 0);
  }, [completedItems]);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="text-lg">Aisle Navigator</span>
        </div>
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
          <Button
            variant={view === "scan" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("scan")}
            className="gap-2"
          >
            <Scan className="h-4 w-4" />
            Barcode Scan
          </Button>
        </div>
        <div className="md:hidden">
          {/* Placeholder for potential mobile header actions */}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden md:grid md:grid-cols-[320px_1fr]">
        {/* Desktop Shopping List */}
        <div className="hidden w-80 shrink-0 border-r md:flex md:flex-col">
          <ShoppingList
            items={shoppingList}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onToggleItem={handleToggleItem}
            allProducts={ALL_PRODUCTS}
            listTotal={listTotal}
            cartTotal={cartTotal}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col overflow-auto">
          {/* Desktop View */}
          <div className="hidden h-full md:block">
            {view === "map" && <StoreMap items={pendingItems} />}
            {view === "ar" && (
              <ArView
                items={pendingItems}
                onItemScannedAndFound={handleToggleItem}
              />
            )}
            {view === "scan" && <BarcodeScanner onScanSuccess={handleAddItemById} />}
          </div>

          {/* Mobile View */}
          <div className="relative flex h-full flex-col md:hidden">
            <div className="flex-1 overflow-y-auto pb-16">
              {mobileView === "list" && (
                <ShoppingList
                  items={shoppingList}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onToggleItem={handleToggleItem}
                  allProducts={ALL_PRODUCTS}
                  listTotal={listTotal}
                  cartTotal={cartTotal}
                />
              )}
              {mobileView === "map" && <StoreMap items={pendingItems} />}
              {mobileView === "ar" && (
                <ArView
                  items={pendingItems}
                  onItemScannedAndFound={handleToggleItem}
                />
              )}
              {mobileView === "scan" && <BarcodeScanner onScanSuccess={handleAddItemById} />}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex h-16 shrink-0 items-center justify-around border-t bg-card">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-col h-auto py-2",
                  mobileView === "list" && "text-primary"
                )}
                onClick={() => setMobileView("list")}
              >
                <List className="h-5 w-5" />
                <span className="text-xs">List</span>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-col h-auto py-2",
                  mobileView === "map" && "text-primary"
                )}
                onClick={() => setMobileView("map")}
              >
                <Map className="h-5 w-5" />
                <span className="text-xs">Map</span>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-col h-auto py-2",
                  mobileView === "ar" && "text-primary"
                )}
                onClick={() => setMobileView("ar")}
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs">AR</span>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-col h-auto py-2",
                  mobileView === "scan" && "text-primary"
                )}
                onClick={() => setMobileView("scan")}
              >
                <Scan className="h-5 w-5" />
                <span className="text-xs">Scan</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
