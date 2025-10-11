"use client";

import * as React from "react";
import { Plus, Search, Trash2, X } from "lucide-react";

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
}

export default function ShoppingList({
  items,
  allProducts,
  onAddItem,
  onRemoveItem,
  onToggleItem,
}: ShoppingListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  React.useEffect(() => {
    if (searchTerm.trim() !== "") {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  const searchResults = React.useMemo(() => {
    if (!searchTerm) return [];
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allProducts]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setShowSearchResults(false);
    searchInputRef.current?.focus();
  };

  const handleAddItem = (product: Product) => {
    onAddItem(product);
    handleClearSearch();
  };

  const pendingItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);

  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      <div className="p-4">
        <h2 className="text-lg font-semibold md:hidden">Shopping List</h2>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search for products..."
            className="pl-10"
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
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Search Results
              </h3>
              {searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <product.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{product.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleAddItem(product)}
                      disabled={items.some((i) => i.id === product.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No products found.
                </p>
              )}
            </div>
          ) : (
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
                          "flex-1 text-sm",
                          item.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {item.name}
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
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Completed
                    </h3>
                    {completedItems.map((item) => (
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
                            "flex-1 text-sm",
                            item.completed &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {item.name}
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

              {items.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Your shopping list is empty.
                  <br />
                  Start by searching for a product.
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
