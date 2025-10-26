
import type { Product, MapSection } from './types';
import { Icons } from '@/components/icons';
import { Carrot, Citrus, Banana } from 'lucide-react';

export const ALL_PRODUCTS: Product[] = [
  // Produce (Aisle 1)
  { id: 'prod-1', name: 'Apples', category: 'Produce', icon: Icons.apple, price: 10.00, location: { aisle: 1, section: 2 } },
  { id: 'prod-2', name: 'Bananas', category: 'Produce', icon: Banana, price: 4.80, location: { aisle: 1, section: 3 } },
  { id: 'prod-3', name: 'Carrots', category: 'Produce', icon: Icons.apple, price: 7.20, location: { aisle: 1, section: 5 } },
  { id: 'prod-4', name: 'Lettuce', category: 'Produce', icon: Icons.apple, price: 8.00, location: { aisle: 1, section: 6 } },

  // Dairy (Aisle 2)
  { id: 'dairy-1', name: 'Milk', category: 'Dairy', icon: Icons.milk, price: 14.00, location: { aisle: 2, section: 2 } },
  { id: 'dairy-2', name: 'Cheese', category: 'Dairy', icon: Icons.milk, price: 20.00, location: { aisle: 2, section: 4 } },
  { id: 'dairy-3', name: 'Yogurt', category: 'Dairy', icon: Icons.milk, price: 17.00, location: { aisle: 2, section: 6 } },
  { id: 'dairy-4', name: 'Butter', category: 'Dairy', icon: Icons.milk, price: 12.00, location: { aisle: 2, section: 7 } },

  // Meat (Aisle 3)
  { id: 'meat-1', name: 'Chicken Breast', category: 'Meat', icon: Icons.meat, price: 32.00, location: { aisle: 3, section: 3 } },
  { id: 'meat-2', name: 'Ground Beef', category: 'Meat', icon: Icons.meat, price: 26.00, location: { aisle: 3, section: 4 } },
  { id: 'meat-3', name: 'Sausages', category: 'Meat', icon: Icons.meat, price: 22.00, location: { aisle: 3, section: 6 } },

  // Bakery (Aisle 4)
  { id: 'bakery-1', name: 'Bread', category: 'Bakery', icon: Icons.bakery, price: 11.00, location: { aisle: 4, section: 2 } },
  { id: 'bakery-2', name: 'Bagels', category: 'Bakery', icon: Icons.bakery, price: 13.00, location: { aisle: 4, section: 4 } },
  { id: 'bakery-3', name: 'Croissants', category: 'Bakery', icon: Icons.bakery, price: 18.00, location: { aisle: 4, section: 6 } },

  // Pantry (Aisle 5)
  { id: 'pantry-1', name: 'Pasta', category: 'Pantry', icon: Icons.pantry, price: 6.00, location: { aisle: 5, section: 2 } },
  { id: 'pantry-2', name: 'Pasta Sauce', category: 'Pantry', icon: Icons.pantry, price: 9.00, location: { aisle: 5, section: 3 } },
  { id: 'pantry-3', name: 'Canned Beans', category: 'Pantry', icon: Icons.pantry, price: 4.00, location: { aisle: 5, section: 5 } },
  { id: 'pantry-4', name: 'Rice', category: 'Pantry', icon: Icons.pantry, price: 15.00, location: { aisle: 5, section: 6 } },
  
  // Frozen (Aisle 6)
  { id: 'frozen-1', name: 'Ice Cream', category: 'Frozen', icon: Icons.frozen, price: 22.00, location: { aisle: 6, section: 2 } },
  { id: 'frozen-2', name: 'Frozen Pizza', category: 'Frozen', icon: Icons.frozen, price: 28.00, location: { aisle: 6, section: 4 } },
  { id: 'frozen-3', name: 'Frozen Vegetables', category: 'Frozen', icon: Icons.frozen, price: 11.00, location: { aisle: 6, section: 6 } },
];

// 0: path, 1: shelf, 2: entrance, 3: checkout
// Grid is 14 cells wide (x) and 12 cells tall (y)
export const STORE_LAYOUT = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAP_SECTIONS: MapSection[] = [
    { name: 'Fruits', icon: Citrus, color: 'text-orange-500', position: { x: 1, y: 1 }, size: { width: 1, height: 2 } },
    { name: 'Vegetables', icon: Carrot, color: 'text-green-600', position: { x: 1, y: 4 }, size: { width: 1, height: 2 } },
    { name: 'Dairy', icon: Icons.milk, color: 'text-blue-400', position: { x: 3, y: 1 }, size: { width: 1, height: 2 } },
    { name: 'Meat', icon: Icons.meat, color: 'text-red-500', position: { x: 5, y: 1 }, size: { width: 1, height: 2 } },
    { name: 'Bakery', icon: Icons.bakery, color: 'text-yellow-600', position: { x: 7, y: 1 }, size: { width: 1, height: 2 } },
    { name: 'Pantry', icon: Icons.pantry, color: 'text-amber-700', position: { x: 9, y: 1 }, size: { width: 1, height: 2 } },
    { name: 'Frozen', icon: Icons.frozen, color: 'text-cyan-500', position: { x: 11, y: 1 }, size: { width: 1, height: 2 } },
]

export const AISLE_CENTERS = [
  { aisle: 1, x: 1 },
  { aisle: 2, x: 3 },
  { aisle: 3, x: 5 },
  { aisle: 4, x: 7 },
  { aisle: 5, x: 9 },
  { aisle: 6, x: 11 },
];

export const ENTRANCE_POS = { x: 0, y: 10 };
export const CHECKOUT_POS = { x: 13, y: 10 };
