// app/data/menuPresets.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  isAvailable?: boolean;
  isVeg?: boolean;
  preparationTime?: number;
  imageUrl?: string;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot';
  serves?: string;
  calories?: number;
  rating?: number;
}

// ─── Smart Suggestions ────────────────────────────────────────────────────────

const PRESET_SUGGESTIONS: Record<
  string,
  { calories: number[]; descriptions: string[] }
> = {
  'filter coffee': {
    calories: [60, 90, 120],
    descriptions: [
      'Classic South Indian decoction coffee with frothy steamed milk',
      'Strong aromatic filter coffee brewed fresh from dark roasted beans',
      'Traditional Chennai-style kaapi with chicory blend and creamy milk',
    ],
  },
  'masala chai': {
    calories: [60, 80, 110],
    descriptions: [
      'Aromatic spiced tea brewed with fresh ginger & cardamom',
      'Traditional Indian chai with cinnamon, cloves, and tulsi',
      'Rich masala tea simmered with whole spices and full-cream milk',
    ],
  },
  'cold coffee': {
    calories: [150, 200, 280],
    descriptions: [
      'Creamy cold brew topped with vanilla foam',
      'Chilled blended coffee with ice cream and chocolate drizzle',
      'Smooth iced coffee made with freshly brewed espresso',
    ],
  },
  'idli': {
    calories: [100, 150, 200],
    descriptions: [
      'Soft steamed rice cakes served with sambar and chutneys',
      'Light fluffy idlis made from fermented rice-urad batter',
      'Classic South Indian idli with peanut chutney and hotel sambar',
    ],
  },
  'dosa': {
    calories: [180, 250, 320],
    descriptions: [
      'Crispy golden crepe made from fermented rice-lentil batter',
      'Thin crunchy dosa served with three chutneys and sambar',
      'Classic plain dosa with a lacy crisp texture and soft centre',
    ],
  },
  'biryani': {
    calories: [450, 550, 650],
    descriptions: [
      'Fragrant basmati rice layered with slow-cooked spiced meat and saffron',
      'Aromatic dum biryani with whole spices, caramelised onions, and mint',
      'Rich Hyderabadi-style biryani garnished with fried onions and boiled egg',
    ],
  },
  'paneer': {
    calories: [280, 380, 480],
    descriptions: [
      'Fresh cottage cheese cubes in a creamy tomato-based gravy',
      'Soft paneer cooked with bell peppers and aromatic spices',
      'Rich and velvety paneer curry with cashew-tomato sauce',
    ],
  },
  'butter chicken': {
    calories: [380, 480, 580],
    descriptions: [
      'Slow-cooked chicken in silky tomato-cream gravy',
      'Tender chicken tikka simmered in a buttery makhani sauce',
      'Classic murgh makhani with dried fenugreek and fresh cream',
    ],
  },
  'dal': {
    calories: [180, 240, 300],
    descriptions: [
      'Yellow lentils tempered with cumin and ghee',
      'Slow-cooked dal with a smoky tadka of mustard and dry chilli',
      'Creamy black lentil dal simmered overnight with butter and cream',
    ],
  },
  'naan': {
    calories: [180, 240, 300],
    descriptions: [
      'Soft leavened flatbread baked in a tandoor and brushed with butter',
      'Fluffy naan with a golden char from the clay oven',
      'Classic tandoori naan topped with melted salted butter',
    ],
  },
  'pasta': {
    calories: [320, 420, 520],
    descriptions: [
      'Al dente pasta tossed in a rich tomato basil sauce',
      'Creamy white sauce pasta with sautéed vegetables and herbs',
      'Penne pasta in a spiced arrabbiata sauce with garlic and parmesan',
    ],
  },
  'pizza': {
    calories: [400, 550, 700],
    descriptions: [
      'Stone-baked pizza with mozzarella, fresh basil, and tomato sauce',
      'Hand-tossed pizza loaded with seasonal vegetables and cheese',
      'Thin-crust pizza with a golden base, rich sauce, and premium toppings',
    ],
  },
  'sandwich': {
    calories: [250, 350, 450],
    descriptions: [
      'Toasted sandwich with fresh vegetables, cheese, and herb spread',
      'Grilled club sandwich with layers of filling on multigrain bread',
      'Classic cold sandwich with crisp lettuce, tomato, and mustard dressing',
    ],
  },
  'juice': {
    calories: [80, 120, 160],
    descriptions: [
      'Freshly squeezed seasonal fruit juice with no added sugar',
      'Chilled blended juice with a hint of ginger and rock salt',
      'Cold-pressed juice made from hand-picked local fruits',
    ],
  },
  'gulab jamun': {
    calories: [150, 200, 280],
    descriptions: [
      'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup',
      'Warm golden gulab jamun served with a scoop of vanilla ice cream',
      'Classic Mithai-style gulab jamun dunked in saffron syrup',
    ],
  },
  'french fries': {
    calories: [280, 360, 440],
    descriptions: [
      'Crispy golden fries seasoned with sea salt and herbs',
      'Double-fried potato strips served with ketchup and mayo',
      'Shoestring fries tossed in smoked paprika and chaat masala',
    ],
  },
  'tikka': {
    calories: [250, 340, 440],
    descriptions: [
      'Marinated cubes grilled in a tandoor with smoky char',
      'Juicy tikka skewers with mint chutney and onion rings',
      'Spiced tikka coated in yoghurt marinade and charcoal-grilled',
    ],
  },
  'lassi': {
    calories: [150, 200, 280],
    descriptions: [
      'Thick chilled yoghurt drink blended with seasonal fruit',
      'Creamy sweet lassi topped with a layer of malai and dry fruits',
      'Classic Punjabi lassi made from hand-churned curd and raw sugar',
    ],
  },
};

export function getItemSuggestions(
  name: string
): { calories: number[]; descriptions: string[] } | null {
  const key = name.toLowerCase().trim();
  const match = Object.entries(PRESET_SUGGESTIONS).find(([k]) =>
    key.includes(k)
  );
  return match ? match[1] : null;
}

// ─── Fallback Menu ────────────────────────────────────────────────────────────

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

// ─── Preset Items (for dropdown) ─────────────────────────────────────────────

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
  snacks: [
    { name: 'French Fries', isVeg: true, category: 'snacks', price: 130 },
    { name: 'Veg Sandwich', isVeg: true, category: 'snacks', price: 150 },
    { name: 'Club Sandwich', isVeg: false, category: 'snacks', price: 220 },
  ],
};

// ─── Category Meta ────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { emoji: string; label: string; gradient: string }> = {
  all:       { emoji: '✨', label: 'All',          gradient: 'from-primary to-accent' },
  beverages: { emoji: '🥤', label: 'Beverages',    gradient: 'from-blue-400 to-cyan-500' },
  breakfast: { emoji: '🍳', label: 'Breakfast',    gradient: 'from-amber-400 to-orange-500' },
  starters:  { emoji: '🥗', label: 'Starters',     gradient: 'from-lime-400 to-emerald-500' },
  snacks:    { emoji: '🍔', label: 'Snacks',        gradient: 'from-yellow-400 to-red-500' },
  main:      { emoji: '🍛', label: 'Main Course',   gradient: 'from-orange-500 to-red-600' },
  rice:      { emoji: '🍚', label: 'Rice',          gradient: 'from-amber-300 to-yellow-500' },
  breads:    { emoji: '🫓', label: 'Breads',        gradient: 'from-amber-500 to-orange-700' },
  desserts:  { emoji: '🍰', label: 'Desserts',      gradient: 'from-pink-400 to-rose-500' },
  specials:  { emoji: '⭐', label: 'Specials',      gradient: 'from-violet-500 to-fuchsia-500' },
};