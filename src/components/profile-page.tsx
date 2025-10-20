
"use client";

import * as React from "react";
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import type { PurchaseRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";


interface ProfilePageProps {
  purchases: PurchaseRecord[];
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function ProfilePage({ purchases }: ProfilePageProps) {
  const [openCollapsible, setOpenCollapsible] = React.useState<string | null>(purchases.length > 0 ? purchases[0].date : null);

  return (
    <div className="flex flex-col min-h-full bg-[#F9FAFB]">
        <header className="p-4 md:p-6 bg-white sticky top-0 z-10 border-b">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-[#1F2937]">Profile</h1>
        </header>

        <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6">
            <div className="space-y-6">
                <div>
                    <h2 className="text-base font-semibold text-gray-700 mb-4">Previous Purchases</h2>
                    {purchases.length > 0 ? (
                        <div className="space-y-4">
                            {purchases.map((purchase) => (
                                <Collapsible
                                    key={purchase.date}
                                    open={openCollapsible === purchase.date}
                                    onOpenChange={(isOpen) => setOpenCollapsible(isOpen ? purchase.date : null)}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                                >
                                    <CollapsibleTrigger className="w-full p-4 flex justify-between items-center cursor-pointer">
                                        <div className="text-left">
                                            <p className="font-medium text-gray-800">{formatDate(purchase.date)}</p>
                                            <p className="text-sm text-gray-500">{purchase.items.length} items</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-semibold text-green-700">{formatPrice(purchase.total)}</p>
                                            <div className="h-8 w-8 flex items-center justify-center text-gray-500">
                                                {openCollapsible === purchase.date ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <Separator />
                                        <div className="p-4 space-y-3">
                                            {purchase.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm">
                                                    <p className="text-gray-600">{item.name} <span className="text-gray-400">x{item.quantity}</span></p>
                                                    <p className="font-medium text-gray-800">{formatPrice(item.totalPrice)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center text-gray-500 py-16 px-4 border-2 border-dashed border-gray-300 rounded-2xl">
                            <ShoppingBag size={48} className="mb-4 text-gray-400"/>
                            <h2 className="text-xl font-semibold text-gray-800">No purchase history</h2>
                            <p className="mt-2 text-gray-600">Start shopping to see your previous orders here.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
}
