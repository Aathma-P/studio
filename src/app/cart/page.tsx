"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, CreditCard, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem } from "@/lib/types";

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
                const parsedItems = JSON.parse(decodeURIComponent(cartData));
                setItems(parsedItems);
            } catch (error) {
                console.error("Failed to parse cart items:", error);
                router.push('/home'); // Redirect if data is invalid
            }
        }
    }, [searchParams, router]);

    const subtotal = React.useMemo(() => 
        items.reduce((sum, item) => sum + item.price * item.quantity, 0), 
    [items]);

    const tax = subtotal * TAX_RATE;
    const grandTotal = subtotal + tax;

    const handleCheckout = () => {
        toast({
            title: "Checkout Successful!",
            description: "Your order has been placed. Thank you for shopping with GROC_AR.",
            className: "bg-green-100 border-green-300 text-green-800",
            duration: 5000,
        });
        // Optionally, redirect after a delay
        setTimeout(() => router.push('/home'), 2000);
    };

    return (
        <div className="flex flex-col h-screen bg-muted/20">
            <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold">Cart Summary</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShoppingCart className="text-primary"/> Your Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {items.length > 0 ? (
                            <div className="space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">Your cart is empty.</p>
                        )}
                    </CardContent>
                </Card>

                {items.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <p className="text-muted-foreground">Subtotal</p>
                                <p className="font-medium">{formatPrice(subtotal)}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-muted-foreground">Tax ({(TAX_RATE * 100).toFixed(0)}%)</p>
                                <p className="font-medium">{formatPrice(tax)}</p>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <p>Grand Total</p>
                                <p>{formatPrice(grandTotal)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            <footer className="p-4 border-t bg-background sticky bottom-0">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => router.push('/home')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Shopping
                    </Button>
                    <Button onClick={handleCheckout} disabled={items.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Checkout
                    </Button>
                </div>
            </footer>
        </div>
    );
}