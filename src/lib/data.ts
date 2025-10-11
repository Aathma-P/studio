import type { Product } from './types';
import { Icons } from '@/components/icons';

export const ALL_PRODUCTS: Product[] = [
  // Produce (Aisle 1)
  { id: 'prod-1', name: 'Apples', category: 'Produce', icon: Icons.apple, location: { aisle: 1, section: 2 } },
  { id: 'prod-2', name: 'Bananas', category: 'Produce', icon: Icons.apple, location: { aisle: 1, section: 3 } },
  { id: 'prod-3', name: 'Carrots', category: 'Produce', icon: Icons.apple, location: { aisle: 1, section: 5 } },
  { id: 'prod-4', name: 'Lettuce', category: 'Produce', icon: Icons.apple, location: { aisle: 1, section: 6 } },

  // Dairy (Aisle 2)
  { id: 'dairy-1', name: 'Milk', category: 'Dairy', icon: Icons.milk, location: { aisle: 2, section: 2 } },
  { id: 'dairy-2', name: 'Cheese', category: 'Dairy', icon: Icons.milk, location: { aisle: 2, section: 4 } },
  { id: 'dairy-3', name: 'Yogurt', category: 'Dairy', icon: Icons.milk, location: { aisle: 2, section: 6 } },
  { id: 'dairy-4', name: 'Butter', category: 'Dairy', icon: Icons.milk, location: { aisle: 2, section: 7 } },

  // Meat (Aisle 3)
  { id: 'meat-1', name: 'Chicken Breast', category: 'Meat', icon: Icons.meat, location: { aisle: 3, section: 3 } },
  { id: 'meat-2', name: 'Ground Beef', category: 'Meat', icon: Icons.meat, location: { aisle: 3, section: 4 } },
  { id: 'meat-3', name: 'Sausages', category: 'Meat', icon: Icons.meat, location: { aisle: 3, section: 6 } },

  // Bakery (Aisle 4)
  { id: 'bakery-1', name: 'Bread', category: 'Bakery', icon: Icons.bakery, location: { aisle: 4, section: 2 } },
  { id: 'bakery-2', name: 'Bagels', category: 'Bakery', icon: Icons.bakery, location: { aisle: 4, section: 4 } },
  { id: 'bakery-3', name: 'Croissants', category: 'Bakery', icon: Icons.bakery, location: { aisle: 4, section: 6 } },

  // Pantry (Aisle 5 & 6)
  { id: 'pantry-1', name: 'Pasta', category: 'Pantry', icon: Icons.pantry, location: { aisle: 5, section: 2 } },
  { id: 'pantry-2', name: 'Pasta Sauce', category: 'Pantry', icon: Icons.pantry, location: { aisle: 5, section: 3 } },
  { id: 'pantry-3', name: 'Canned Beans', category: 'Pantry', icon: Icons.pantry, location: { aisle: 5, section: 5 } },
  { id: 'pantry-4', name: 'Rice', category: 'Pantry', icon: Icons.pantry, location: { aisle: 6, section: 2 } },
  { id: 'pantry-5', name: 'Cereal', category: 'Pantry', icon: Icons.pantry, location: { aisle: 6, section: 4 } },
  { id: 'pantry-6', name: 'Coffee', category: 'Pantry', icon: Icons.pantry, location: { aisle: 6, section: 7 } },
  
  // Frozen (Aisle 7)
  { id: 'frozen-1', name: 'Ice Cream', category: 'Frozen', icon: Icons.frozen, location: { aisle: 7, section: 2 } },
  { id: 'frozen-2', name: 'Frozen Pizza', category: 'Frozen', icon: Icons.frozen, location: { aisle: 7, section: 4 } },
  { id: 'frozen-3', name: 'Frozen Vegetables', category: 'Frozen', icon: Icons.frozen, location: { aisle: 7, section: 6 } },
];

// 0: path, 1: shelf, 2: entrance, 3: checkout
export const STORE_LAYOUT = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
];

export const AISLE_CENTERS = [
  { aisle: 1, x: 1 },
  { aisle: 2, x: 3 },
  { aisle: 3, x: 5 },
  { aisle: 4, x: 7 },
  { aisle: 5, x: 9 },
  { aisle: 6, x: 11 },
  { aisle: 7, x: 13 }, // Assuming more aisles
];

export const ENTRANCE_POS = { x: 0.5, y: 11.5 };
export const CHECKOUT_POS = { x: 12.5, y: 11.5 };
