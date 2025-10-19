"use client";

import * as React from "react";
import { Map, Camera, List, ScanLine as Scan } from "lucide-react";

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

type View = "list" | "map" | "ar" | "scan";

export default function HomePage() {
  const [view, setView] = React.useState<View>("list");
  const [shoppingList, setShoppingList] = React.useState<ShoppingListItem[]>([]);
  const [listTotal, setListTotal] = React.useState(0);
  const [cartTotal, setCartTotal] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    const total = shoppingList.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setListTotal(total);
    const cartT = shoppingList.filter(i => i.completed).reduce((sum, item) => sum + item.price * item.quantity, 0);
    setCartTotal(cartT);
  }, [shoppingList]);

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
        return [...prevList, { ...product, completed: false, quantity: 1 }];
      }
    });
  };
  
  const handleIncreaseQuantity = (productId: string) => {
    setShoppingList(prevList => prevList.map(item => 
      item.id === productId ? {...item, quantity: item.quantity + 1} : item
    ));
  };
  
  const handleDecreaseQuantity = (productId: string) => {
    setShoppingList(prevList => {
      const itemToUpdate = prevList.find(item => item.id === productId);
      if (itemToUpdate && itemToUpdate.quantity > 1) {
        return prevList.map(item => item.id === productId ? {...item, quantity: item.quantity - 1} : item);
      } else {
        // If quantity is 1, remove the item
        return prevList.filter(item => item.id !== productId);
      }
    });
  };

  const handleRemoveItem = (productId: string) => {
    setShoppingList((prevList) =>
      prevList.filter((item) => item.id !== productId)
    );
  };

  const handleToggleItem = (productId: string) => {
    setShoppingList((prevList) =>
      prevList.map((item) =>
        item.id === productId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleScanSuccess = (scannedId: string) => {
    const product = ALL_PRODUCTS.find(p => p.id === scannedId);
    if(product) {
        handleAddItem(product);
        toast({
            title: "Item Added",
            description: `${product.name} has been added to your shopping list.`,
        });
        setView('list');
    } else {
        toast({
            variant: "destructive",
            title: "Item Not Found",
            description: "The scanned code does not match any product in our store.",
        });
    }
  }

  const handleItemScannedAndFound = (itemId: string) => {
    // This is called from AR view when an item is confirmed found.
    // It marks the item as completed in the main list.
    handleToggleItem(itemId);
  }

  const inactiveNavButtonClass = "bg-green-100 text-green-900 hover:bg-green-200";

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 text-card-foreground md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Icons.logo className="h-6 w-6 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground">GROC_AI</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
            <Button 
                variant={view === 'map' ? 'secondary' : 'default'}
                size="sm"
                onClick={() => setView('map')}
                className={cn("gap-2 transition-all", view !== 'map' && inactiveNavButtonClass)}
            >
                <Map /> 2D Map
            </Button>
            <Button
                variant={view === 'ar' ? 'secondary' : 'default'}
                size="sm"
                onClick={() => setView('ar')}
                className={cn("gap-2 transition-all", view !== 'ar' && inactiveNavButtonClass)}
            >
                <Camera /> AR View
            </Button>
            <Button
                variant={view === 'scan' ? 'secondary' : 'default'}
                size="sm"
                onClick={() => setView('scan')}
                className={cn("gap-2 transition-all", view !== 'scan' && inactiveNavButtonClass)}
            >
                <Scan /> Barcode Scan
            </Button>
        </div>
      </header>
      
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="hidden h-full flex-col md:flex md:w-80 lg:w-96">
          <ShoppingList
            items={shoppingList}
            allProducts={ALL_PRODUCTS}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onToggleItem={handleToggleItem}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            listTotal={listTotal}
            cartTotal={cartTotal}
          />
        </div>

        <main className="flex-1 overflow-auto">
           {view === 'map' && <StoreMap items={shoppingList} />}
           {view === 'ar' && isClient && <ArView items={shoppingList.filter(i => !i.completed)} onItemScannedAndFound={handleItemScannedAndFound} />}
           {view === 'scan' && isClient && <BarcodeScanner onScanSuccess={handleScanSuccess} />}
           {view === 'list' && (
             <div className="h-full md:hidden">
               <ShoppingList
                  items={shoppingList}
                  allProducts={ALL_PRODUCTS}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onToggleItem={handleToggleItem}
                  onIncreaseQuantity={handleIncreaseQuantity}
                  onDecreaseQuantity={handleDecreaseQuantity}
                  listTotal={listTotal}
                  cartTotal={cartTotal}
                />
             </div>
           )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <footer className="flex shrink-0 items-center justify-around border-t py-2 md:hidden">
        <Button
          variant="ghost"
          className={cn("flex h-auto flex-col gap-1 px-2 py-1", view === "list" ? 'text-green-500' : 'text-muted-foreground')}
          onClick={() => setView("list")}
        >
          <List />
          <span className="text-xs">List</span>
        </Button>
        <Button
          variant="ghost"
          className={cn("flex h-auto flex-col gap-1 px-2 py-1", view === "map" ? 'text-green-500' : 'text-muted-foreground')}
          onClick={() => setView("map")}
        >
          <Map />
          <span className="text-xs">Map</span>
        </Button>
        <Button
          variant="ghost"
          className={cn("flex h-auto flex-col gap-1 px-2 py-1", view === "ar" ? 'text-green-500' : 'text-muted-foreground')}
          onClick={() => setView("ar")}
        >
          <Camera />
          <span className="text-xs">AR</span>
        </Button>
        <Button
          variant="ghost"
          className={cn("flex h-auto flex-col gap-1 px-2 py-1", view === "scan" ? 'text-green-500' : 'text-muted-foreground')}
          onClick={() => setView("scan")}
        >
          <Scan />
          <span className="text-xs">Scan</span>
        </Button>
      </footer>
    </div>
  );
}
