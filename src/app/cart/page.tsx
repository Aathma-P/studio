
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem, PurchaseRecord, PurchasedItem } from "@/lib/types";
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
                router.push('/home');
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
        } else {
            return prevList.filter(item => item.id !== productId);
        }
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

        const newPurchase: PurchaseRecord = {
            date: new Date().toISOString(),
            items: items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                totalPrice: item.price * item.quantity,
            })),
            total: grandTotal,
        };

        try {
            const existingPurchases: PurchaseRecord[] = JSON.parse(localStorage.getItem('previousPurchases') || '[]');
            localStorage.setItem('previousPurchases', JSON.stringify([newPurchase, ...existingPurchases]));
        } catch (e) {
            console.error("Could not save purchase to localStorage", e);
        }

        toast({
            variant: "default",
            title: "🎉 Order placed successfully!",
            description: "You can view your previous purchases in your profile.",
            duration: 3000,
        });

        setTimeout(() => {
            setItems([]);
            // Pass a query param to tell the home page to refresh its purchase history state
            router.push('/home?refresh=true');
        }, 1000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
            <header className="flex items-center justify-between p-4 md:p-6 bg-white sticky top-0 z-10 max-w-[500px] mx-auto w-full">
                <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
                    <ArrowLeft className="text-[#1F2937]"/>
                </Button>
                <h1 className="text-lg md:text-xl font-semibold tracking-tight text-[#1F2937]">My Cart</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 w-full max-w-[500px] mx-auto p-4 md:p-6">
                {items.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {items.map(item => {
                                const ItemIcon = item.icon;
                                return (
                                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-start justify-between hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-[#A3D9A5]/30 rounded-xl flex items-center justify-center p-3">
                                                {ItemIcon ? <ItemIcon className="w-full h-full text-[#1B7E48]" /> : <div className="w-8 h-8 bg-gray-200 rounded-md" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{item.name}</p>
                                                <p className="text-sm text-gray-500">1pc</p>
                                                <p className="font-semibold text-green-700 mt-1">{formatPrice(item.price * item.quantity)}</p>
                                                <p className="text-xs text-gray-400 italic mt-1">You saved {formatPrice(item.price * 0.1)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between gap-y-3">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 transition" onClick={() => handleRemoveItem(item.id)}>
                                                <Trash2 size={18}/>
                                            </Button>
                                            <div className="flex items-center gap-2">
                                                 <button onClick={() => handleDecreaseQuantity(item.id)} className="border border-gray-300 rounded-full h-7 w-7 flex items-center justify-center text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                                                    <Minus size={14}/>
                                                 </button>
                                                <span className="font-bold text-center w-5 text-gray-800">{item.quantity}</span>
                                                 <button onClick={() => handleIncreaseQuantity(item.id)} className="border border-gray-300 rounded-full h-7 w-7 flex items-center justify-center text-gray-700 hover:bg-green-50 hover:text-green-600 transition">
                                                    <Plus size={14}/>
                                                 </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-6">
                             <div className="p-2 space-y-3">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Summary</h3>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <p>Subtotal</p>
                                    <p className="font-medium">{formatPrice(subtotal)}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <p>Tax ({(TAX_RATE * 100).toFixed(0)}%)</p>
                                    <p className="font-medium">{formatPrice(tax)}</p>
                                </div>
                                <Separator className="my-3 bg-gray-100"/>
                                <div className="flex justify-between items-center text-gray-800">
                                    <p className="font-semibold">Grand Total</p>
                                    <p className="font-bold text-lg text-green-700">{formatPrice(grandTotal)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 pt-20">
                        <ShoppingCart size={48} className="mb-4 text-gray-400"/>
                        <h2 className="text-xl font-semibold text-gray-800">Your cart is empty</h2>
                        <p className="mt-2 text-gray-600">Looks like you haven't added anything yet.</p>
                        <Button className="mt-6 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg" onClick={() => router.push('/home')}>
                            Start Shopping
                        </Button>
                    </div>
                )}
            </main>

            {items.length > 0 && (
                <footer className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                    <div className="grid grid-cols-2 gap-4 max-w-[500px] mx-auto">
                        <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-700 font-medium rounded-lg h-11" onClick={() => router.push('/home')}>
                            Back to Shopping
                        </Button>
                        <Button onClick={handleCheckout} className="bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg h-11">
                            Proceed to Checkout
                        </Button>
                    </div>
                </footer>
            )}
        </div>
    );
}
