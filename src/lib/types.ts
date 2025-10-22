

import type { StaticImageData } from "next/image";

export type Product = {
  id: string;
  name: string;
  category: 'Produce' | 'Dairy' | 'Meat' | 'Bakery' | 'Pantry' | 'Frozen';
  icon: React.ComponentType<{ className?: string }> | StaticImageData;
  price: number;
  location: {
    aisle: number;
    section: number; // Position along the aisle
  };
};

export type ShoppingListItem = Product & {
  completed: boolean;
  quantity: number;
};

export type MapPoint = {
  x: number;
  y: number;
};

export type PurchasedItem = {
  name: string;
  quantity: number;
  totalPrice: number;
};

export type PurchaseRecord = {
  date: string; // ISO date string
  items: PurchasedItem[];
  total: number;
};

export type MapSection = {
    name: string;
    icon: React.ComponentType<{ className?: string, style?: React.CSSProperties }>;
    color: string;
    position: MapPoint;
    size: { width: number, height: number };
}
