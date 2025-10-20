

"use client";

import * as React from "react";
import Image from "next/image";
import { Map, Camera, List, ScanLine as Scan, User } from "lucide-react";
import { useSearchParams } from 'next/navigation'


import type { ShoppingListItem, Product, PurchaseRecord } from "@/lib/types";
import { ALL_PRODUCTS } from "@/lib/data";

import { Button } from "@/components/ui/button";
import ShoppingList from "@/components/shopping-list";
import StoreMap from "@/components/store-map";
import ArView from "@/components/ar-view";
import BarcodeScanner from "@/components/barcode-scanner";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import scanBanner from "@/assets/images/scan-banner.png";
import ProfilePage from "@/components/profile-page";


type View = "list" | "map" | "ar" | "scan" | "scan-banner" | "profile";

export default function HomePage() {
  const [view, setView] = React.useState<View>("list");
  const [shoppingList, setShoppingList] = React.useState<ShoppingListItem[]>([]);
  const [previousPurchases, setPreviousPurchases] = React.useState<PurchaseRecord[]>([]);
  const [listTotal, setListTotal] = React.useState(0);
  const [cartTotal, setCartTotal] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setIsClient(true);
    // Load purchase history from localStorage on initial mount
    try {
      const storedPurchases = localStorage.getItem('previousPurchases');
      if (storedPurchases) {
        setPreviousPurchases(JSON.parse(storedPurchases));
      }
    } catch (e) {
      console.error("Failed to load purchase history from localStorage", e);
    }
  }, []);
  
  // This effect listens for a query parameter to refresh purchase history after checkout
  React.useEffect(() => {
    if (searchParams.get('refresh')) {
      try {
        const storedPurchases = localStorage.getItem('previousPurchases');
        if (storedPurchases) {
          setPreviousPurchases(JSON.parse(storedPurchases));
        }
      } catch (e) {
        console.error("Failed to load purchase history from localStorage", e);
      }
      // Optionally remove the query param from URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({...window.history.state, as: newUrl, url: newUrl}, '', newUrl);
    }
  }, [searchParams]);

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
          <span className="text-lg font-bold text-primary-foreground">GROC_AR</span>
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
                variant={view === 'profile' ? 'secondary' : 'default'}
                size="sm"
                onClick={() => setView('profile')}
                className={cn("gap-2 transition-all", view !== 'profile' && inactiveNavButtonClass)}
            >
                <User /> Profile
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
            onScanClick={() => setView("scan-banner")}
            listTotal={listTotal}
            cartTotal={cartTotal}
          />
        </div>

        <main className="flex-1 overflow-auto">
           {view === 'map' && <StoreMap items={shoppingList} />}
           {view === 'ar' && isClient && <ArView items={shoppingList.filter(i => !i.completed)} onItemScannedAndFound={handleItemScannedAndFound} />}
           {view === "scan-banner" && (
            <div className="flex items-center justify-center h-full w-full bg-[#EAF6EE] p-4">
              <div className="relative w-full max-w-md">
                <Image
                  src={scanBanner}
                  alt="Scan the image"
                  width={800}
                  height={600}
                  className="rounded-xl object-contain w-full h-auto"
                  priority
                />
                <button
                  onClick={() => setView("scan")}
                  className="absolute top-[40%] left-[10%] bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition-all duration-200"
                >
                  Scan
                </button>
              </div>
            </div>
          )}
           {view === 'scan' && isClient && <BarcodeScanner onScanSuccess={handleScanSuccess} />}
           {view === 'profile' && isClient && <ProfilePage purchases={previousPurchases} />}
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
                  onScanClick={() => setView("scan-banner")}
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
          className={cn(
            "flex h-auto flex-col gap-1 px-2 py-1 transition-colors duration-200 hover:bg-transparent",
            view === "list" ? "text-green-600" : "text-muted-foreground hover:text-green-600"
          )}
          onClick={() => setView("list")}
        >
          <List />
          <span className="text-xs">List</span>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex h-auto flex-col gap-1 px-2 py-1 transition-colors duration-200 hover:bg-transparent",
            view === "map" ? "text-green-600" : "text-muted-foreground hover:text-green-600"
          )}
          onClick={() => setView("map")}
        >
          <Map />
          <span className="text-xs">Map</span>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex h-auto flex-col gap-1 px-2 py-1 transition-colors duration-200 hover:bg-transparent",
            view === "ar" ? "text-green-600" : "text-muted-foreground hover:text-green-600"
          )}
          onClick={() => setView("ar")}
        >
          <Camera />
          <span className="text-xs">AR</span>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex h-auto flex-col gap-1 px-2 py-1 transition-colors duration-200 hover:bg-transparent",
            view === "profile" ? "text-green-600" : "text-muted-foreground hover:text-green-600"
          )}
          onClick={() => setView("profile")}
        >
          <User />
          <span className="text-xs">Profile</span>
        </Button>
      </footer>
    </div>
  );
}
