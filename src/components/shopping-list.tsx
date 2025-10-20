
"use client";

import * as React from "react";
import { Plus, Search, Trash2, X, ChevronDown, ChevronUp, Minus, ShoppingCart, ScanLine } from "lucide-react";
import Link from "next/link";
import type { Product, ShoppingListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ShoppingListProps {
  items: ShoppingListItem[];
  allProducts: Product[];
  onAddItem: (product: Product) => void;
  onRemoveItem: (productId: string) => void;
  onToggleItem: (productId: string) => void;
  onIncreaseQuantity: (productId: string) => void;
  onDecreaseQuantity: (productId: string) => void;
  onScanClick: () => void;
  listTotal: number;
  cartTotal: number;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
}

const pastelColors = [
    'bg-red-100 text-red-800',
    'bg-yellow-100 text-yellow-800',
    'bg-green-100 text-green-800',
    'bg-blue-100 text-blue-800',
    'bg-pink-100 text-pink-800',
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
];

const ProductCard = ({ 
    product, 
    quantity,
    onAddItem,
    onIncreaseQuantity,
    onDecreaseQuantity,
    colorClass,
}: { 
    product: Product, 
    quantity: number,
    onAddItem: (product: Product) => void,
    onIncreaseQuantity: (productId: string) => void,
    onDecreaseQuantity: (productId: string) => void,
    colorClass: string,
}) => {
    return (
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-3">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-md", colorClass)}>
                    <product.icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="font-bold text-sm text-black">{product.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(product.price)}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm">
                {quantity > 0 ? (
                    <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-green-100 text-primary hover:bg-green-200" onClick={() => onDecreaseQuantity(product.id)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold bg-[#4CAF50] text-white rounded-sm px-2">{quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-green-100 text-primary hover:bg-green-200" onClick={() => onIncreaseQuantity(product.id)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground" onClick={() => onAddItem(product)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}

export default function ShoppingList({
  items,
  allProducts,
  onAddItem,
  onRemoveItem,
  onToggleItem,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onScanClick,
  listTotal,
  cartTotal,
}: ShoppingListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(true);

  React.useEffect(() => {
    if (searchTerm.trim() !== "") {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  const searchResults = React.useMemo(() => {
    if (!searchTerm) return [];
    const filtered = allProducts.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.sort((a, b) => a.price - b.price);
  }, [searchTerm, allProducts]);

  const groupedProducts = React.useMemo(() => {
    const groups = allProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    for (const category in groups) {
        groups[category].sort((a,b) => a.price - b.price);
    }
    return groups;

  }, [allProducts]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setShowSearchResults(false);
    searchInputRef.current?.focus();
  };

  const sortedItems = React.useMemo(() => items.sort((a, b) => a.price - b.price), [items]);
  const pendingItems = sortedItems.filter((item) => !item.completed);
  const completedItems = sortedItems.filter((item) => item.completed);
  
  const itemQuantities = React.useMemo(() => {
      const quantities = new Map<string, number>();
      items.forEach(item => {
          quantities.set(item.id, item.quantity);
      });
      return quantities;
  }, [items]);

  const cartLinkHref = React.useMemo(() => {
    if (completedItems.length === 0) return '/cart';
    const cartData = encodeURIComponent(JSON.stringify(completedItems.map(item => ({ id: item.id, quantity: item.quantity, completed: item.completed }))));
    return `/cart?items=${cartData}`;
  }, [completedItems]);

  let productIndex = 0;

  return (
    <div className="flex h-full flex-col bg-background text-card-foreground">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold md:hidden">Shopping List</h2>
        <div className="grid grid-cols-2 gap-4 text-center mt-2">
            <div className="bg-green-200 text-emerald-900 rounded-lg p-2 shadow">
                <p className="text-sm font-semibold">In Cart</p>
                <p className="text-xl font-bold">{formatPrice(cartTotal)}</p>
            </div>
             <div className="bg-green-200 text-emerald-900 rounded-lg p-2 shadow">
                <p className="text-sm font-semibold">List Total</p>
                <p className="text-xl font-bold">{formatPrice(listTotal)}</p>
            </div>
        </div>
        <Link href={cartLinkHref} passHref>
          <Button variant="outline" className="w-full mt-3 text-[#1B7E48] border-[#1B7E48] hover:bg-[#1B7E48]/10 hover:text-[#1B7E48]">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Cart ({completedItems.length})
          </Button>
        </Link>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search or browse products..."
            className="pl-10 bg-white text-gray-800 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-4">
          {showSearchResults ? (
            <div className="space-y-2 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Search Results
              </h3>
              {searchResults.length > 0 ? (
                searchResults.map((product, index) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    quantity={itemQuantities.get(product.id) || 0}
                    onAddItem={onAddItem}
                    onIncreaseQuantity={onIncreaseQuantity}
                    onDecreaseQuantity={onDecreaseQuantity}
                    colorClass={pastelColors[index % pastelColors.length]}
                  />
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No products found for "{searchTerm}".
                </p>
              )}
            </div>
          ) : (
            <div className="pt-4">
              {items.length > 0 ? (
                <>
                  {pendingItems.length > 0 && (
                    <div className="space-y-2">
                      {pendingItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                        >
                          <Checkbox
                            id={`item-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={() => onToggleItem(item.id)}
                          />
                          <label
                            htmlFor={`item-${item.id}`}
                            className={cn(
                              "flex-1",
                              item.completed && "line-through text-muted-foreground"
                            )}
                          >
                            <span className="text-sm">{item.name} (x{item.quantity})</span>
                            <p className="text-xs text-muted-foreground">{formatPrice(item.price * item.quantity)}</p>
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {completedItems.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Completed
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="text-xs"
                          >
                            {showCompleted ? "Hide" : "Show"}
                            {showCompleted ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                          </Button>
                        </div>

                        {showCompleted && completedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                          >
                            <Checkbox
                              id={`item-${item.id}`}
                              checked={item.completed}
                              onCheckedChange={() => onToggleItem(item.id)}
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className={cn(
                                "flex-1",
                                item.completed &&
                                  "line-through text-muted-foreground"
                              )}
                            >
                                <span className="text-sm">{item.name} (x{item.quantity})</span>
                                <p className="text-xs text-muted-foreground">{formatPrice(item.price * item.quantity)}</p>
                            </label>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => onRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                   <Separator className="my-4" />
                </>
              ) : (
                 <div className="py-2 my-4 text-center text-sm text-muted-foreground">
                  Your shopping list is empty.
                </div>
              )}
             
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Browse All Items</h3>
                    <button onClick={onScanClick} className="flex items-center gap-1 text-green-600 hover:text-green-700 transition">
                      <ScanLine className="h-5 w-5" />
                      <span className="text-sm font-semibold">Scan</span>
                    </button>
                </div>
                {Object.entries(groupedProducts).map(([category, products]) => (
                  <div key={category}>
                    <h4 className="mb-2 text-sm font-semibold">{category}</h4>
                    <div className="space-y-2">
                      {products.map((product) => {
                         const colorClass = pastelColors[productIndex % pastelColors.length];
                         productIndex++;
                         return (
                            <ProductCard 
                                key={product.id}
                                product={product}
                                quantity={itemQuantities.get(product.id) || 0}
                                onAddItem={onAddItem}
                                onIncreaseQuantity={onIncreaseQuantity}
                                onDecreaseQuantity={onDecreaseQuantity}
                                colorClass={colorClass}
                            />
                         );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

    