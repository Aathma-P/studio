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

export default function HomePage() {
  const [shoppingList, setShoppingList] = React.useState<ShoppingListItem[]>([]);
  const [view, setView] = React.useState<View>("map");
  const [mobileView, setMobileView] = React.useState<MobileView>("list");
  const { toast } = useToast();

  const handleAddItem = (product: Product) => {
    setShoppingList((prevList) => {
      const existingItem = prevList.find((item) => item.id === product.id);
      if (existingItem) {
        return prevList.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Item Added",
          description: `${product.name} has been added to your list.`,
        });
        return [...prevList, { ...product, quantity: 1, completed: false }];
      }
    });
  };

  const handleIncreaseQuantity = (productId: string) => {
    setShoppingList((prevList) =>
      prevList.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (productId: string) => {
    setShoppingList((prevList) => {
      const existingItem = prevList.find((item) => item.id === productId);
      if (existingItem?.quantity === 1) {
        return prevList.filter((item) => item.id !== productId);
      } else {
        return prevList.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
    });
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
    return shoppingList.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [shoppingList]);

  const cartTotal = React.useMemo(() => {
    return completedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [completedItems]);

  const navButtonClass = "gap-2 transition-all duration-300";
  const inactiveNavButtonClass = "bg-green-100 text-green-900 hover:bg-green-200";

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 text-card-foreground md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Icons.logo className="h-6 w-6 text-primary-foreground" />
          <span className="text-lg font-bold">GROC_AI</span>
        </div>
        <div className="hidden items-center gap-2 rounded-lg p-1 md:flex">
          <Button
            variant={view === "map" ? "secondary" : "default"}
            size="sm"
            onClick={() => setView("map")}
            className={cn(navButtonClass, view !== "map" && inactiveNavButtonClass)}
          >
            <Map className="h-4 w-4" />
            2D Map
          </Button>
          <Button
            variant={view === "ar" ? "secondary" : "default"}
            size="sm"
            onClick={() => setView("ar")}
            className={cn(navButtonClass, view !== "ar" && inactiveNavButtonClass)}
          >
            <Camera className="h-4 w-4" />
            AR View
          </Button>
          <Button
            variant={view === "scan" ? "secondary" : "default"}
            size="sm"
            onClick={() => setView("scan")}
            className={cn(navButtonClass, view !== "scan" && inactiveNavButtonClass)}
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
        <div className="hidden w-80 shrink-0 border-r bg-background md:flex md:flex-col">
          <ShoppingList
            items={shoppingList}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onToggleItem={handleToggleItem}
            allProducts={ALL_PRODUCTS}
            listTotal={listTotal}
            cartTotal={cartTotal}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
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
                  onIncreaseQuantity={handleIncreaseQuantity}
                  onDecreaseQuantity={handleDecreaseQuantity}
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

            <div className="absolute bottom-0 left-0 right-0 flex h-16 shrink-0 items-center justify-around border-t bg-background">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-col h-auto py-2 hover:bg-transparent text-muted-foreground",
                  mobileView === "list" && "text-green-500",
                   "hover:text-green-500"
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
                  "flex-col h-auto py-2 hover:bg-transparent text-muted-foreground",
                  mobileView === "map" && "text-green-500",
                  "hover:text-green-500"
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
                  "flex-col h-auto py-2 hover:bg-transparent text-muted-foreground",
                  mobileView === "ar" && "text-green-500",
                  "hover:text-green-500"
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
                  "flex-col h-auto py-2 hover:bg-transparent text-muted-foreground",
                  mobileView === "scan" && "text-green-500",
                  "hover:text-green-500"
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