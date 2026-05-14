export interface MenuItem {
  itemId?: string;
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  isAvailable: boolean;
  isVeg: boolean;
  preparationTime?: number;
}

export const FALLBACK_MENU: MenuItem[] = [
  { id: '1', name: 'Masala Chai', price: 60, category: 'beverages', isAvailable: true, isVeg: true, preparationTime: 5, description: 'Aromatic spiced tea brewed with fresh ginger & cardamom' },
  { id: '2', name: 'Fresh Lime Soda', price: 80, category: 'beverages', isAvailable: true, isVeg: true, preparationTime: 3 },
  { id: '3', name: 'Cold Coffee', price: 120, category: 'beverages', isAvailable: true, isVeg: true, preparationTime: 5, description: 'Creamy cold brew topped with vanilla foam' },
  { id: '4', name: 'Veg Sandwich', price: 150, category: 'snacks', isAvailable: true, isVeg: true, preparationTime: 10 },
  { id: '5', name: 'Club Sandwich', price: 220, category: 'snacks', isAvailable: true, isVeg: false, preparationTime: 12, description: 'Triple-decker with grilled chicken, egg & smoked bacon' },
  { id: '6', name: 'French Fries', price: 130, category: 'snacks', isAvailable: true, isVeg: true, preparationTime: 8 },
  { id: '7', name: 'Dal Tadka', price: 180, category: 'main', isAvailable: true, isVeg: true, preparationTime: 20, description: 'Yellow lentils tempered with cumin and ghee' },
  { id: '8', name: 'Paneer Butter Masala', price: 250, category: 'main', isAvailable: true, isVeg: true, preparationTime: 20 },
  { id: '9', name: 'Butter Chicken', price: 320, category: 'main', isAvailable: true, isVeg: false, preparationTime: 25, description: 'Slow-cooked chicken in silky tomato-cream gravy' },
  { id: '10', name: 'Steamed Rice', price: 120, category: 'rice', isAvailable: true, isVeg: true, preparationTime: 15 },
  { id: '11', name: 'Butter Naan', price: 50, category: 'breads', isAvailable: true, isVeg: true, preparationTime: 8 },
  { id: '12', name: 'Chicken Biryani', price: 320, category: 'rice', isAvailable: true, isVeg: false, preparationTime: 25, description: 'Long-grain basmati layered with marinated chicken' },
  { id: '13', name: 'Gulab Jamun', price: 100, category: 'desserts', isAvailable: true, isVeg: true, preparationTime: 5 },
  { id: '14', name: 'Paneer Tikka', price: 280, category: 'starters', isAvailable: true, isVeg: true, preparationTime: 18 },
];

export const PRESET_ITEMS: Record<string, Array<{ name: string; isVeg: boolean; category: string; price: number }>> = {
  beverages: [
    { name: 'Masala Chai', isVeg: true, category: 'beverages', price: 60 },
    { name: 'Filter Coffee', isVeg: true, category: 'beverages', price: 70 },
    { name: 'Cold Coffee', isVeg: true, category: 'beverages', price: 120 },
    { name: 'Fresh Lime Soda', isVeg: true, category: 'beverages', price: 80 },
    { name: 'Mango Lassi', isVeg: true, category: 'beverages', price: 110 },
  ],
  starters: [
    { name: 'Paneer Tikka', isVeg: true, category: 'starters', price: 280 },
    { name: 'Chicken Tikka', isVeg: false, category: 'starters', price: 320 },
    { name: 'Tandoori Chicken', isVeg: false, category: 'starters', price: 380 },
  ],
  main: [
    { name: 'Dal Makhani', isVeg: true, category: 'main', price: 200 },
    { name: 'Butter Chicken', isVeg: false, category: 'main', price: 320 },
    { name: 'Paneer Butter Masala', isVeg: true, category: 'main', price: 250 },
  ],
  rice: [
    { name: 'Chicken Biryani', isVeg: false, category: 'rice', price: 320 },
    { name: 'Veg Biryani', isVeg: true, category: 'rice', price: 220 },
  ],
  breads: [
    { name: 'Butter Naan', isVeg: true, category: 'breads', price: 50 },
    { name: 'Garlic Naan', isVeg: true, category: 'breads', price: 60 },
  ],
  desserts: [
    { name: 'Gulab Jamun', isVeg: true, category: 'desserts', price: 100 },
    { name: 'Rasmalai', isVeg: true, category: 'desserts', price: 130 },
  ],
};

export const CATEGORY_META: Record<string, { emoji: string; label: string; gradient: string }> = {
  all: { emoji: '✨', label: 'All', gradient: 'from-primary to-accent' },
  beverages: { emoji: '🥤', label: 'Beverages', gradient: 'from-blue-400 to-cyan-500' },
  breakfast: { emoji: '🍳', label: 'Breakfast', gradient: 'from-amber-400 to-orange-500' },
  starters: { emoji: '🥗', label: 'Starters', gradient: 'from-lime-400 to-emerald-500' },
  snacks: { emoji: '🍔', label: 'Snacks', gradient: 'from-yellow-400 to-red-500' },
  main: { emoji: '🍛', label: 'Main Course', gradient: 'from-orange-500 to-red-600' },
  rice: { emoji: '🍚', label: 'Rice', gradient: 'from-amber-300 to-yellow-500' },
  breads: { emoji: '🫓', label: 'Breads', gradient: 'from-amber-500 to-orange-700' },
  desserts: { emoji: '🍰', label: 'Desserts', gradient: 'from-pink-400 to-rose-500' },
  specials: { emoji: '⭐', label: 'Specials', gradient: 'from-violet-500 to-fuchsia-500' },
};
