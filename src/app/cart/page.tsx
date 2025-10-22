
"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, CreditCard, LoaderCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem, PurchaseRecord } from "@/lib/types";
import { ALL_PRODUCTS } from "@/lib/data";
import illust from "@/assets/images/illust.png";
import { cn } from "@/lib/utils";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
}

const TAX_RATE = 0.05;

type CheckoutState = 'idle' | 'loading' | 'success';

export default function CartPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const [items, setItems] = React.useState<ShoppingListItem[]>([]);
    const [checkoutState, setCheckoutState] = React.useState<CheckoutState>('idle');
    const [isClient, setIsClient] = React.useState(false);
    
    React.useEffect(() => {
        setIsClient(true);
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
        if (items.length === 0 || checkoutState !== 'idle' || !isClient) return;

        setCheckoutState('loading');
    
        setTimeout(() => {
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
              const storedPurchasesRaw = localStorage.getItem('previousPurchases');
              const storedPurchases: PurchaseRecord[] = storedPurchasesRaw ? JSON.parse(storedPurchasesRaw) : [];
              const updatedPurchases = [newPurchase, ...storedPurchases];
              localStorage.setItem('previousPurchases', JSON.stringify(updatedPurchases));
            } catch (e) {
              console.error("Failed to save purchase to localStorage", e);
            }
    
            toast({
                description: "You can view your previous purchases in your profile.",
                className: "bg-green-100 border-green-300 text-green-800 font-medium",
                duration: 3000,
            });

            setCheckoutState('success');

            setTimeout(() => {
                router.push("/home?refresh=true");
            }, 2000); // Wait 2 seconds on success before redirecting

        }, 1000); // Simulate network delay
    };

    if (!isClient) {
      return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
            <header className="flex items-center justify-between p-4 md:p-6 bg-white sticky top-0 z-10 max-w-[500px] mx-auto w-full">
                <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="rounded-full hover:bg-gray-200">
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
                                                {typeof ItemIcon === 'function' ? (
                                                    <ItemIcon className="w-full h-full text-[#1B7E48]" />
                                                ) : (
                                                    <Image src={ItemIcon} alt={item.name} width={40} height={40} className="rounded-md object-contain" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{item.name}</p>
                                                <p className="font-semibold text-green-700 mt-1">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between h-full">
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
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 pt-10">
                        <Image
                          src={illust}
                          alt="Empty Cart Illustration"
                          width={600}
                          height={400}
                          className="h-48 md:h-64 w-auto object-contain mb-8"
                          priority
                          data-ai-hint="empty cart"
                        />
                        <h2 className="text-xl font-semibold text-gray-800">Your cart is empty</h2>
                        <p className="mt-2 text-gray-600">Looks like you haven't added anything yet.</p>
                        <Button className="mt-6 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg" onClick={() => router.push('/home')}>
                            Start Shopping
                        </Button>
                    </div>
                )}
            </main>

            {items.length > 0 && (
                <footer className="p-4 border-t bg-white sticky bottom-0">
                    <div className="flex items-center justify-between gap-4 max-w-[500px] mx-auto">
                        <Button
                        variant="outline"
                        className="w-1/2 border-2 border-green-600 text-green-700 font-medium hover:bg-green-50 transition"
                        onClick={() => router.push('/home')}
                        disabled={checkoutState !== 'idle'}
                        >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Home
                        </Button>

                        <Button
                        onClick={handleCheckout}
                        disabled={items.length === 0 || checkoutState !== 'idle'}
                        className={cn(
                            "w-1/2 font-semibold transition-all duration-300",
                            checkoutState === 'success' ? 'bg-blue-500 hover:bg-blue-600 animate-pulse' : 'bg-green-600 hover:bg-green-700',
                            'text-white'
                        )}
                        >
                        {checkoutState === 'idle' && <> <CreditCard className="mr-2 h-4 w-4" /> Checkout </>}
                        {checkoutState === 'loading' && <> <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing... </>}
                        {checkoutState === 'success' && <> <CheckCircle className="mr-2 h-4 w-4" /> Success! </>}
                        </Button>
                    </div>
                </footer>
            )}
        </div>
    );
}
