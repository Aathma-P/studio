"use client";

import BarcodeScanner from "@/components/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { ALL_PRODUCTS } from "@/lib/data";
import { Product } from "@/lib/types";
import { useRouter } from "next/navigation";

// A simplified version of what's in HomePage, just for handling the scan result.
// In a real app, this logic would be shared via a global state manager (like Zustand or Redux).

export default function ScannerPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleScanSuccess = (scannedId: string) => {
        const product = ALL_PRODUCTS.find(p => p.id === scannedId);
        if(product) {
            // In a real app, you would add this to a global shopping list state.
            // For now, we'll just show a success toast and navigate back.
            toast({
                title: "Item Scanned",
                description: `${product.name} would be added to your list.`,
            });
            // Navigate back to the home/list view after a successful scan.
            router.push("/home");
        } else {
            toast({
                variant: "destructive",
                title: "Item Not Found",
                description: "The scanned code does not match any product in our store.",
            });
        }
    };

    return <BarcodeScanner onScanSuccess={handleScanSuccess} />;
}
