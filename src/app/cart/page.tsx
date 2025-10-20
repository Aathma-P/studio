
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem } from "@/lib/types";
import { ALL_PRODUCTS } from "@/lib/data";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
}

const TAX_RATE = 0.05;

export default function CartPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const [items, setItems] = React.useState<ShoppingListItem[]>([]);

    React.useEffect(() => {
        const cartData = searchParams.get('items');
        if (cartData) {
            try {
                const parsedItemsFromUrl: Pick<ShoppingListItem, 'id' | 'quantity' | 'completed'>[] = JSON.parse(decodeURIComponent(cartData));
                
                // Re-hydrate the items with full product details, including the icon component
                const fullItems = parsedItemsFromUrl.map(urlItem => {
                    const productDetails = ALL_PRODUCTS.find(p => p.id === urlItem.id);
                    if (!productDetails) return null;
                    return {
                        ...productDetails,
                        quantity: urlItem.quantity,
                        completed: urlItem.completed,
                    };
                }).filter((item): item is ShoppingListItem => item !== null);
                
                setItems(fullItems);

            } catch (error) {
                console.error("Failed to parse cart items:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load cart items.",
                });
                router.push('/home'); // Redirect if data is invalid
            }
        }
    }, [searchParams, router, toast]);

    const handleIncreaseQuantity = (productId: string) => {
      setItems(prevList => prevList.map(item => 
        item.id === productId ? {...item, quantity: item.quantity + 1} : item
      ));
    };
  
    const handleDecreaseQuantity = (productId: string) => {
      setItems(prevList => {
        const itemToUpdate = prevList.find(item => item.id === productId);
        if (itemToUpdate && itemToUpdate.quantity > 1) {
          return prevList.map(item => item.id === productId ? {...item, quantity: item.quantity - 1} : item);
        }
        // If quantity is 1, it should be removed via Trash icon, but this is a safe fallback.
        return prevList;
      });
    };

    const handleRemoveItem = (productId: string) => {
        setItems(prevList => prevList.filter(item => item.id !== productId));
        toast({
            title: "Item Removed",
            description: "The item has been removed from your cart.",
        });
    }

    const subtotal = React.useMemo(() => 
        items.reduce((sum, item) => sum + item.price * item.quantity, 0), 
    [items]);

    const tax = subtotal * TAX_RATE;
    const grandTotal = subtotal + tax;

    const handleCheckout = () => {
        if (items.length === 0) {
            toast({
                variant: "destructive",
                title: "Your cart is empty",
                description: "Add items to your cart before checking out.",
            });
            return;
        }
        toast({
            title: "Checkout Successful!",
            description: "Your order has been placed. Thank you for shopping with GROC_AR.",
            duration: 5000,
        });
        // Clear items and redirect after a short delay
        setTimeout(() => {
            setItems([]);
            router.push('/home');
        }, 2000);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold text-gray-800">My Cart</h1>
                <Button variant="ghost" size="icon">
                    <ShoppingCart />
                </Button>
            </header>

            <main className="flex-1 overflow-auto p-4 bg-white">
                {items.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {items.map(item => {
                                const ItemIcon = item.icon;
                                return (
                                    <Card key={item.id} className="rounded-xl shadow-md p-4 mb-4">
                                        <CardContent className="p-0 flex items-center gap-4 relative">
                                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                                {ItemIcon ? <ItemIcon className="w-8 h-8 text-muted-foreground" /> : <div className="w-8 h-8 bg-muted-foreground/20 rounded-md" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{item.name}</p>
                                                <p className="text-sm text-gray-500">1pc</p>
                                                <p className="font-medium mt-1">{formatPrice(item.price * item.quantity)}</p>
                                                <p className="text-xs text-gray-400 mt-1">You saved {formatPrice(item.price * 0.1)}</p>
                                            </div>
                                            <div className="absolute top-0 right-0">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleRemoveItem(item.id)}>
                                                    <Trash2 size={18}/>
                                                </Button>
                                            </div>
                                            <div className="absolute bottom-0 right-0 flex items-center gap-2">
                                                 <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleDecreaseQuantity(item.id)} disabled={item.quantity <= 1}>
                                                    <Minus size={14}/>
                                                </Button>
                                                <span className="font-bold text-center w-4">{item.quantity}</span>
                                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleIncreaseQuantity(item.id)}>
                                                    <Plus size={14}/>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <Card className="mt-6 rounded-xl shadow-md">
                             <CardContent className="p-4 space-y-3">
                                <h3 className="text-lg font-bold mb-3">Order Summary</h3>
                                <div className="flex justify-between text-gray-600">
                                    <p>Subtotal</p>
                                    <p className="font-medium">{formatPrice(subtotal)}</p>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <p>Tax ({(TAX_RATE * 100).toFixed(0)}%)</p>
                                    <p className="font-medium">{formatPrice(tax)}</p>
                                </div>
                                <Separator className="my-2"/>
                                <div className="flex justify-between text-lg font-bold text-gray-800">
                                    <p>Grand Total</p>
                                    <p>{formatPrice(grandTotal)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <ShoppingCart size={48} className="mb-4 text-gray-400"/>
                        <h2 className="text-xl font-semibold">Your cart is empty</h2>
                        <p className="mt-2">Looks like you haven't added anything to your cart yet.</p>
                        <Button className="mt-6" onClick={() => router.push('/home')}>
                            Start Shopping
                        </Button>
                    </div>
                )}
            </main>

            <footer className="p-4 border-t bg-white sticky bottom-0">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => router.push('/home')}>
                        Back to Shopping
                    </Button>
                    <Button onClick={handleCheckout} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                        Proceed to Checkout
                    </Button>
                </div>
            </footer>
        </div>
    );
}
