
export type Product = {
  id: string;
  name: string;
  category: 'Produce' | 'Dairy' | 'Meat' | 'Bakery' | 'Pantry' | 'Frozen';
  icon: React.ComponentType<{ className?: string }>;
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
