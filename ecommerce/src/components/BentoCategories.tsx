import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import {
  ArrowLeft,
  Search,
  X,
  Sparkles,
  ShieldCheck,
  Percent,
  Truck,
  RotateCcw,
  Clock,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export interface SubcategoryDef {
  id: string;
  name: string;
  badge?: string;
  matchKeywords: string[];
}

export interface CategoryItem {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  accentColor: string;
  thumbImage: string;
  bgLight?: string;
  iconType: 'fresh' | 'grocery' | 'dairy' | 'snacks' | 'drinks' | 'beauty' | 'home' | 'electronics' | 'kitchen' | 'deals';
  itemCount: number;
  subcategories: SubcategoryDef[];
}

const CATEGORIES_DATA: CategoryItem[] = [
  {
    id: 'fruits-veg',
    name: 'Fruits & Vegetables',
    tagline: 'Organic fruits, green vegetables & seasonal harvests',
    badge: '100% Organic',
    badgeColor: '#16a34a',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
    accentColor: '#059669',
    thumbImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=240&q=80',
    bgLight: '#ecfdf5',
    iconType: 'fresh',
    itemCount: 24,
    subcategories: [
      { id: 'all', name: 'All Fresh Produce', matchKeywords: [] },
      { id: 'fruits', name: 'Exotic & Seasonal Fruits', badge: 'Fresh', matchKeywords: ['banana', 'apple', 'fruit', 'mango', 'orange', 'grapes'] },
      { id: 'veggies', name: 'Daily Green Vegetables', badge: 'Organic', matchKeywords: ['spinach', 'tomato', 'potato', 'veg', 'vegetable', 'onion'] },
      { id: 'herbs', name: 'Fresh Herbs & Seasonings', matchKeywords: ['ginger', 'garlic', 'coriander', 'mint'] },
      { id: 'hydroponic', name: 'Hydroponic Greens', badge: 'Premium', matchKeywords: ['organic', 'lettuce', 'farm'] }
    ]
  },
  {
    id: 'dairy-bread-eggs',
    name: 'Dairy, Bread & Eggs',
    tagline: 'Farm fresh milk, artisanal bread, cheese & eggs',
    badge: 'Chilled Daily',
    badgeColor: '#0284c7',
    gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    accentColor: '#0284c7',
    thumbImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=240&q=80',
    bgLight: '#f0f9ff',
    iconType: 'dairy',
    itemCount: 20,
    subcategories: [
      { id: 'all', name: 'All Dairy & Eggs', matchKeywords: [] },
      { id: 'milk', name: 'Pasteurized & Whole Milk', badge: 'Daily', matchKeywords: ['milk', 'dairy', 'whole milk'] },
      { id: 'paneer-cheese', name: 'Paneer, Butter & Cheese', matchKeywords: ['paneer', 'cheese', 'butter', 'curd'] },
      { id: 'eggs', name: 'Farm Brown & White Eggs', badge: 'Protein', matchKeywords: ['egg', 'brown egg'] },
      { id: 'bread', name: 'Fresh Bread & Pav', matchKeywords: ['bread', 'pav', 'bun'] }
    ]
  },
  {
    id: 'snacks-munchies',
    name: 'Snacks & Munchies',
    tagline: 'Crispy potato chips, nachos, wafers & namkeen',
    badge: 'Trending',
    badgeColor: '#e11d48',
    gradient: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)',
    accentColor: '#e11d48',
    thumbImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=240&q=80',
    bgLight: '#fff1f2',
    iconType: 'snacks',
    itemCount: 32,
    subcategories: [
      { id: 'all', name: 'All Snacks', matchKeywords: [] },
      { id: 'chips', name: 'Chips, Crisps & Nachos', badge: 'Crunchy', matchKeywords: ['chip', 'crisp', 'nacho', 'wafer'] },
      { id: 'namkeen', name: 'Traditional Namkeen & Bhujia', matchKeywords: ['namkeen', 'bhujia', 'mixture', 'snack'] },
      { id: 'popcorn', name: 'Popcorn & Puffs', matchKeywords: ['popcorn', 'puff', 'snack'] }
    ]
  },
  {
    id: 'bakery-biscuits',
    name: 'Bakery & Biscuits',
    tagline: 'Artisan cookies, rusk, tea cakes & biscuits',
    badge: 'Freshly Baked',
    badgeColor: '#b45309',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    accentColor: '#b45309',
    thumbImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=240&q=80',
    bgLight: '#fffbeb',
    iconType: 'snacks',
    itemCount: 22,
    subcategories: [
      { id: 'all', name: 'All Bakery', matchKeywords: [] },
      { id: 'cookies', name: 'Cookies & Cream Biscuits', matchKeywords: ['cookie', 'biscuit', 'oreo', 'bourbon'] },
      { id: 'rusk-toast', name: 'Rusk & Toast', matchKeywords: ['rusk', 'toast', 'tea'] },
      { id: 'cakes', name: 'Cakes & Muffins', matchKeywords: ['cake', 'muffin', 'pastry'] }
    ]
  },
  {
    id: 'breakfast-instant',
    name: 'Breakfast & Instant',
    tagline: 'Instant noodles, oats, cereals, pasta & ready mixes',
    badge: 'Quick 2-Min',
    badgeColor: '#ea580c',
    gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
    accentColor: '#ea580c',
    thumbImage: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=240&q=80',
    bgLight: '#fff7ed',
    iconType: 'grocery',
    itemCount: 26,
    subcategories: [
      { id: 'all', name: 'All Instant Foods', matchKeywords: [] },
      { id: 'noodles', name: 'Noodles & Pasta', badge: 'Hot', matchKeywords: ['maggi', 'noodle', 'pasta', 'ramen'] },
      { id: 'oats', name: 'Oats & Muesli', matchKeywords: ['oats', 'cereal', 'muesli', 'corn flakes'] },
      { id: 'ready-mix', name: 'Ready-to-Cook Mixes', matchKeywords: ['mix', 'upma', 'poha', 'idli'] }
    ]
  },
  {
    id: 'tea-coffee',
    name: 'Tea, Coffee & More',
    tagline: 'Gourmet teas, green teas, roast coffee & health drinks',
    badge: 'Aroma',
    badgeColor: '#059669',
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
    accentColor: '#059669',
    thumbImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=240&q=80',
    bgLight: '#f0fdf4',
    iconType: 'drinks',
    itemCount: 21,
    subcategories: [
      { id: 'all', name: 'All Tea & Coffee', matchKeywords: [] },
      { id: 'tea', name: 'Leaf Tea & Green Tea', matchKeywords: ['tea', 'green tea', 'chai'] },
      { id: 'coffee', name: 'Instant & Filter Coffee', matchKeywords: ['coffee', 'nescafe', 'bru', 'roast'] },
      { id: 'health-drinks', name: 'Health Drinks & Mixes', matchKeywords: ['bournvita', 'horlicks', 'boost'] }
    ]
  },
  {
    id: 'cold-drinks-juices',
    name: 'Cold Drinks & Juices',
    tagline: 'Cold sodas, real fruit juices, iced teas & sparkling water',
    badge: 'Super Chilled',
    badgeColor: '#2563eb',
    gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
    accentColor: '#2563eb',
    thumbImage: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=240&q=80',
    bgLight: '#eff6ff',
    iconType: 'drinks',
    itemCount: 25,
    subcategories: [
      { id: 'all', name: 'All Cold Drinks', matchKeywords: [] },
      { id: 'soft-drinks', name: 'Soft Drinks & Cola', matchKeywords: ['coke', 'pepsi', 'sprite', 'soda', 'cold drink'] },
      { id: 'juices', name: '100% Real Fruit Juices', matchKeywords: ['juice', 'real', 'tropicana', 'frooti', 'mango'] },
      { id: 'energy-drinks', name: 'Energy & Sports Drinks', matchKeywords: ['red bull', 'monster', 'energy', 'gatorade'] }
    ]
  },
  {
    id: 'sweet-tooth',
    name: 'Sweet Tooth & Desserts',
    tagline: 'Premium chocolates, ice creams, candies & Indian sweets',
    badge: 'Craving',
    badgeColor: '#db2777',
    gradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
    accentColor: '#db2777',
    thumbImage: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=240&q=80',
    bgLight: '#fdf2f8',
    iconType: 'snacks',
    itemCount: 28,
    subcategories: [
      { id: 'all', name: 'All Sweets & Chocolates', matchKeywords: [] },
      { id: 'chocolates', name: 'Silk, Dark & Milk Chocolates', matchKeywords: ['chocolate', 'cadbury', 'silk', 'kitkat', 'snickers'] },
      { id: 'ice-cream', name: 'Tubs, Cones & Popsicles', matchKeywords: ['ice cream', 'kulfi', 'cone', 'tub'] },
      { id: 'mithai', name: 'Gulab Jamun & Indian Sweets', matchKeywords: ['sweet', 'gulab jamun', 'rasgulla', 'kaju'] }
    ]
  },
  {
    id: 'atta-rice-dal',
    name: 'Atta, Rice & Dal',
    tagline: 'Freshly milled chakki atta, basmati rice & unpolished dals',
    badge: 'Kitchen Staple',
    badgeColor: '#d97706',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    accentColor: '#d97706',
    thumbImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=240&q=80',
    bgLight: '#fffbeb',
    iconType: 'grocery',
    itemCount: 35,
    subcategories: [
      { id: 'all', name: 'All Staples', matchKeywords: [] },
      { id: 'atta', name: 'Wheat Atta & Multigrain', matchKeywords: ['atta', 'flour', 'wheat', 'aashirvaad'] },
      { id: 'rice', name: 'Basmati & Kolam Rice', matchKeywords: ['rice', 'basmati', 'daawat', 'india gate'] },
      { id: 'dals', name: 'Toor, Moong & Chana Dal', matchKeywords: ['dal', 'toor', 'moong', 'chana', 'urad', 'rajma'] }
    ]
  },
  {
    id: 'masala-oil',
    name: 'Masala, Oil & Spices',
    tagline: 'Mustard oils, pure cow ghee, whole & ground spices',
    badge: 'Pure & Fresh',
    badgeColor: '#c2410c',
    gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
    accentColor: '#c2410c',
    thumbImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=240&q=80',
    bgLight: '#fff7ed',
    iconType: 'grocery',
    itemCount: 30,
    subcategories: [
      { id: 'all', name: 'All Masala & Oils', matchKeywords: [] },
      { id: 'oils-ghee', name: 'Mustard, Sunflower & Ghee', matchKeywords: ['oil', 'ghee', 'mustard', 'fortune', 'amul'] },
      { id: 'spices', name: 'Turmeric, Chilli & Garam Masala', matchKeywords: ['masala', 'turmeric', 'chilli', 'coriander', 'spice'] },
      { id: 'salt-sugar', name: 'Salt, Sugar & Jaggery', matchKeywords: ['salt', 'sugar', 'jaggery', 'tata salt'] }
    ]
  },
  {
    id: 'sauces-spreads',
    name: 'Sauces & Spreads',
    tagline: 'Tomato ketchups, mayonnaise, nutella, jams & honey',
    badge: 'Tasty Add-on',
    badgeColor: '#b91c1c',
    gradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)',
    accentColor: '#b91c1c',
    thumbImage: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=240&q=80',
    bgLight: '#fef2f2',
    iconType: 'grocery',
    itemCount: 18,
    subcategories: [
      { id: 'all', name: 'All Sauces & Spreads', matchKeywords: [] },
      { id: 'ketchup', name: 'Tomato Ketchups & Dips', matchKeywords: ['ketchup', 'sauce', 'maggi sauce', 'kissan'] },
      { id: 'spreads', name: 'Peanut Butter & Nutella', matchKeywords: ['nutella', 'peanut butter', 'spread', 'jam'] },
      { id: 'honey', name: 'Pure Honey & Syrups', matchKeywords: ['honey', 'dabur', 'maple'] }
    ]
  },
  {
    id: 'chicken-meat-fish',
    name: 'Chicken, Meat & Fish',
    tagline: 'Fresh antibiotic-free chicken, mutton, prawns & seafood',
    badge: '100% Fresh',
    badgeColor: '#991b1b',
    gradient: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)',
    accentColor: '#991b1b',
    thumbImage: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=240&q=80',
    bgLight: '#fff1f2',
    iconType: 'fresh',
    itemCount: 16,
    subcategories: [
      { id: 'all', name: 'All Meat & Seafood', matchKeywords: [] },
      { id: 'chicken', name: 'Fresh Chicken Breast & Curry Cut', matchKeywords: ['chicken', 'breast', 'curry cut', 'wings'] },
      { id: 'mutton', name: 'Mutton & Lamb Chops', matchKeywords: ['mutton', 'lamb'] },
      { id: 'fish', name: 'Fish & Prawns', matchKeywords: ['fish', 'prawn', 'salmon', 'rohu'] }
    ]
  },
  {
    id: 'organic-healthy',
    name: 'Organic & Healthy',
    tagline: 'Certified organic staples, cold-pressed oils & superfoods',
    badge: 'Chemical Free',
    badgeColor: '#15803d',
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
    accentColor: '#15803d',
    thumbImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=240&q=80',
    bgLight: '#f0fdf4',
    iconType: 'fresh',
    itemCount: 22,
    subcategories: [
      { id: 'all', name: 'All Organic Essentials', matchKeywords: [] },
      { id: 'organic-staples', name: 'Organic Flours & Dals', matchKeywords: ['organic', 'sampann', 'tattva'] },
      { id: 'seeds-nuts', name: 'Chia, Flax & Pumpkin Seeds', matchKeywords: ['chia', 'seed', 'flax', 'almond'] }
    ]
  },
  {
    id: 'paan-corner',
    name: 'Paan Corner',
    tagline: 'Flavoured mukhwas, digestive sweets & mouth fresheners',
    badge: 'After Meal',
    badgeColor: '#047857',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
    accentColor: '#047857',
    thumbImage: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=240&q=80',
    bgLight: '#ecfdf5',
    iconType: 'snacks',
    itemCount: 14,
    subcategories: [
      { id: 'all', name: 'All Paan Corner', matchKeywords: [] },
      { id: 'mukhwas', name: 'Sweet Mukhwas & Saunf', matchKeywords: ['mukhwas', 'saunf', 'mint', 'pass pass'] },
      { id: 'digestive', name: 'Hing Peda & Digestive Tablets', matchKeywords: ['digestive', 'hajmola', 'hing'] }
    ]
  },
  {
    id: 'baby-care',
    name: 'Baby Care',
    tagline: 'Gentle baby soaps, diapers, wipes & nutrition',
    badge: 'Gentle & Safe',
    badgeColor: '#0369a1',
    gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    accentColor: '#0369a1',
    thumbImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=240&q=80',
    bgLight: '#f0f9ff',
    iconType: 'beauty',
    itemCount: 19,
    subcategories: [
      { id: 'all', name: 'All Baby Care', matchKeywords: [] },
      { id: 'diapers', name: 'Diapers & Sensitive Wipes', matchKeywords: ['diaper', 'pampers', 'huggies', 'wipe'] },
      { id: 'baby-bath', name: 'Baby Shampoo, Lotion & Oil', matchKeywords: ['johnson', 'baby shampoo', 'baby lotion'] }
    ]
  },
  {
    id: 'pharma-wellness',
    name: 'Pharma & Wellness',
    tagline: 'First aid, pain balms, vitamins & Ayurvedic tonics',
    badge: 'Health Plus',
    badgeColor: '#6d28d9',
    gradient: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
    accentColor: '#6d28d9',
    thumbImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=240&q=80',
    bgLight: '#faf5ff',
    iconType: 'beauty',
    itemCount: 24,
    subcategories: [
      { id: 'all', name: 'All Wellness', matchKeywords: [] },
      { id: 'ayurveda', name: 'Chyawanprash & Herbal Immunity', matchKeywords: ['chyawanprash', 'dabur', 'ayurvedic', 'zandu'] },
      { id: 'first-aid', name: 'Bandages, Antiseptics & Balms', matchKeywords: ['dettol', 'volini', 'band-aid', 'savlon', 'moov'] }
    ]
  },
  {
    id: 'cleaning-essentials',
    name: 'Cleaning Essentials',
    tagline: 'Liquid detergents, dishwash, surface cleaners & fresheners',
    badge: 'Sparkling Clean',
    badgeColor: '#0891b2',
    gradient: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)',
    accentColor: '#0891b2',
    thumbImage: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=240&q=80',
    bgLight: '#ecfeff',
    iconType: 'home',
    itemCount: 25,
    subcategories: [
      { id: 'all', name: 'All Cleaning Essentials', matchKeywords: [] },
      { id: 'detergent', name: 'Surf Excel, Ariel & Fabric Care', matchKeywords: ['detergent', 'surf', 'ariel', 'tide', 'comfort'] },
      { id: 'floor-cleaners', name: 'Lizol, Harpic & Surface Sprays', matchKeywords: ['lizol', 'harpic', 'colin', 'cleaner', 'dettol'] },
      { id: 'dishwash', name: 'Vim Gel & Dishwash Bars', matchKeywords: ['vim', 'pril', 'dishwash'] }
    ]
  },
  {
    id: 'home-office',
    name: 'Home & Office',
    tagline: 'Storage organizers, notebooks, batteries & disposables',
    badge: 'Everyday Needs',
    badgeColor: '#475569',
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
    accentColor: '#475569',
    thumbImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=240&q=80',
    bgLight: '#f8fafc',
    iconType: 'home',
    itemCount: 18,
    subcategories: [
      { id: 'all', name: 'All Home & Office', matchKeywords: [] },
      { id: 'stationery', name: 'Notebooks, Pens & Tape', matchKeywords: ['pen', 'notebook', 'tape', 'paper'] },
      { id: 'batteries', name: 'Duracell Batteries & Torches', matchKeywords: ['duracell', 'battery', 'cell'] }
    ]
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    tagline: 'Face wash, shampoos, soaps, deodorants & hair care',
    badge: 'Self Care',
    badgeColor: '#c026d3',
    gradient: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 50%, #f5d0fe 100%)',
    accentColor: '#c026d3',
    thumbImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=240&q=80',
    bgLight: '#fdf4ff',
    iconType: 'beauty',
    itemCount: 28,
    subcategories: [
      { id: 'all', name: 'All Personal Care', matchKeywords: [] },
      { id: 'skincare', name: 'Face Wash & Moisturizers', matchKeywords: ['nivea', 'face wash', 'garnier', 'pond', 'cream'] },
      { id: 'haircare', name: 'Head & Shoulders, Dove & Oils', matchKeywords: ['shampoo', 'dove', 'pantene', 'hair oil', 'parachute'] },
      { id: 'soaps', name: 'Dettol, Dove & Body Wash', matchKeywords: ['soap', 'body wash', 'lux', 'lifebuoy'] }
    ]
  },
  {
    id: 'smart-tech',
    name: 'Smart Tech & Gadgets',
    tagline: 'True wireless earbuds, fast charging cables & accessories',
    badge: '1-Yr Warranty',
    badgeColor: '#4f46e5',
    gradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)',
    accentColor: '#4f46e5',
    thumbImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=240&q=80',
    bgLight: '#eef2ff',
    iconType: 'electronics',
    itemCount: 16,
    subcategories: [
      { id: 'all', name: 'All Electronics', matchKeywords: [] },
      { id: 'audio', name: 'TWS Earbuds & Headphones', matchKeywords: ['earbuds', 'boat', 'headphone', 'audio'] },
      { id: 'cables', name: 'Fast USB-C & Lightning Cables', matchKeywords: ['charger', 'cable', 'adapter', 'type-c'] }
    ]
  }
];

const CURATED_BUNDLES = [
  {
    id: 'b1',
    title: 'Weekly Fresh Basket',
    tag: 'Save 25%',
    itemsText: 'Bananas + Apples + Farm Veggies + Whole Milk',
    price: '₹349',
    oldPrice: '₹470',
    color: '#059669',
    bg: '#ecfdf5'
  },
  {
    id: 'b2',
    title: 'Breakfast Power Pack',
    tag: 'Save 30%',
    itemsText: 'Organic Oats + Farm Brown Eggs + Pure Butter',
    price: '₹289',
    oldPrice: '₹399',
    color: '#0284c7',
    bg: '#f0f9ff'
  },
  {
    id: 'b3',
    title: 'Movie Night Snack Box',
    tag: 'Save 20%',
    itemsText: 'Gourmet Nachos + Chocolate Cookies + Cold Sodas',
    price: '₹249',
    oldPrice: '₹315',
    color: '#e11d48',
    bg: '#fff1f2'
  }
];

interface BentoCategoriesProps {
  products: Product[];
  onSelectProduct?: (productId: string) => void;
  showToast?: (msg: string) => void;
  initialCategoryId?: string | null;
  onNavigateHome?: () => void;
  onBackToHome?: () => void;
}

export const BentoCategories: React.FC<BentoCategoriesProps> = ({
  products,
  onSelectProduct,
  showToast: propShowToast,
  initialCategoryId,
  onNavigateHome,
  onBackToHome
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId || null);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'farm' | 'staples' | 'snacks' | 'beverages'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    if (propShowToast) {
      propShowToast(msg);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const currentCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return CATEGORIES_DATA.find((c) => c.id === selectedCategoryId) || CATEGORIES_DATA[0];
  }, [selectedCategoryId]);

  const displayedCategories = useMemo(() => {
    let list = CATEGORIES_DATA;
    if (quickFilter === 'farm') {
      list = list.filter((c) => c.id === 'fruits-veg' || c.id === 'organic-healthy');
    } else if (quickFilter === 'staples') {
      list = list.filter((c) => c.id === 'atta-rice-dal' || c.id === 'masala-oil' || c.id === 'dairy-bread-eggs');
    } else if (quickFilter === 'snacks') {
      list = list.filter((c) => c.id === 'snacks-munchies' || c.id === 'bakery-biscuits' || c.id === 'sweet-tooth');
    } else if (quickFilter === 'beverages') {
      list = list.filter((c) => c.id === 'cold-drinks-juices' || c.id === 'tea-coffee');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.subcategories.some((s) => s.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [quickFilter, searchQuery]);

  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];

    let filtered = products;

    if (activeSubcategoryId !== 'all') {
      const activeSub = currentCategory.subcategories.find((s) => s.id === activeSubcategoryId);
      if (activeSub && activeSub.matchKeywords.length > 0) {
        filtered = filtered.filter((p) => {
          const str = `${p.name} ${p.category} ${p.description || ''} ${(p.features || []).join(' ')}`.toLowerCase();
          return activeSub.matchKeywords.some((kw) => str.includes(kw.toLowerCase()));
        });
      }
    } else {
      const allCategoryKeywords = currentCategory.subcategories.flatMap((s) => s.matchKeywords);
      if (allCategoryKeywords.length > 0) {
        filtered = filtered.filter((p) => {
          const str = `${p.name} ${p.category} ${p.description || ''} ${(p.features || []).join(' ')}`.toLowerCase();
          return allCategoryKeywords.some((kw) => str.includes(kw.toLowerCase()));
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0 && products.length > 0) {
      filtered = products.filter(p =>
        p.category.toLowerCase().includes(currentCategory.name.toLowerCase().split(' ')[0]) ||
        currentCategory.name.toLowerCase().includes(p.category.toLowerCase())
      );
      if (filtered.length === 0) {
        filtered = products.slice(0, 6);
      }
    }

    return filtered;
  }, [products, currentCategory, activeSubcategoryId, searchQuery]);

  const handleOpenCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setActiveSubcategoryId('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setSelectedCategoryId(null);
    setActiveSubcategoryId('all');
    setSearchQuery('');
  };

  return (
    <div className="pro-categories-page" id="categoriesPage">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pro-toast-banner">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top App Bar Header */}
      <div className="pro-appbar-header">
        <div className="container pro-appbar-inner">
          <div className="pro-appbar-left">
            {selectedCategoryId ? (
              <button className="pro-appbar-back-btn" onClick={handleBackToLanding} aria-label="Back to Categories">
                <ArrowLeft size={20} />
              </button>
            ) : (
              (onBackToHome || onNavigateHome) && (
                <button className="pro-appbar-back-btn" onClick={onBackToHome || onNavigateHome} aria-label="Back to Home">
                  <ArrowLeft size={20} />
                </button>
              )
            )}
            <div>
              <span className="pro-appbar-eyebrow">
                {selectedCategoryId ? 'CATEGORIES' : 'ALL AISLES'}
              </span>
              <h1 className="pro-appbar-title">
                {selectedCategoryId && currentCategory ? currentCategory.name : 'Explore All Categories'}
              </h1>
            </div>
          </div>

          <div className="pro-appbar-search-wrapper">
            <div className="pro-search-box">
              <Search size={16} className="pro-search-icon" />
              <input
                type="text"
                placeholder={selectedCategoryId ? `Search in ${currentCategory?.name}...` : 'Search 20+ departments & groceries...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="pro-clear-btn" onClick={() => setSearchQuery('')} aria-label="Clear Search">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container pro-page-content-wrapper">

        {/* =========================================================================
            VIEW 1: BLINKIT-STYLE 4-COLUMN CATEGORIES GRID & RICH SECTIONS
            ========================================================================= */}
        {!selectedCategoryId && (
          <div className="pro-landing-wrapper">

            {/* 1. Spotlight Hero Festival Banner */}
            <div className="pro-spotlight-hero-banner">
              <div className="spotlight-banner-content">
                <div className="spotlight-badge">
                  <Sparkles size={14} /> Mega Fresh Harvest Festival
                </div>
                <h2 className="spotlight-banner-title">Farm-Picked Quality at Direct Wholesale Prices</h2>
                <p className="spotlight-banner-desc">Get up to 45% discount on certified organic greens, fruits, cold-pressed oils & dairy.</p>
                <button className="spotlight-cta-btn" onClick={() => handleOpenCategory('fruits-veg')}>
                  Explore Fresh Produce <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 2. Fast Filter Chips Strip */}
            <div className="pro-quick-chips-strip">
              <button
                className={`pro-quick-chip ${quickFilter === 'all' ? 'active' : ''}`}
                onClick={() => setQuickFilter('all')}
              >
                All Departments ({CATEGORIES_DATA.length})
              </button>
              <button
                className={`pro-quick-chip ${quickFilter === 'farm' ? 'active' : ''}`}
                onClick={() => setQuickFilter('farm')}
              >
                🌿 Farm & Organic
              </button>
              <button
                className={`pro-quick-chip ${quickFilter === 'staples' ? 'active' : ''}`}
                onClick={() => setQuickFilter('staples')}
              >
                🌾 Daily Staples
              </button>
              <button
                className={`pro-quick-chip ${quickFilter === 'snacks' ? 'active' : ''}`}
                onClick={() => setQuickFilter('snacks')}
              >
                🥨 Snack Munchies
              </button>
              <button
                className={`pro-quick-chip ${quickFilter === 'beverages' ? 'active' : ''}`}
                onClick={() => setQuickFilter('beverages')}
              >
                🥤 Cold Drinks & Tea
              </button>
            </div>

            {/* 3. Blinkit-Style 4-Column Visual Category Grid */}
            <div className="blinkit-categories-grid">
              {displayedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="blinkit-category-card"
                  onClick={() => handleOpenCategory(cat.id)}
                >
                  <div className="blinkit-thumb-container" style={{ background: cat.bgLight || '#f1f5f9' }}>
                    <img
                      src={cat.thumbImage}
                      alt={cat.name}
                      className="blinkit-thumb-img"
                      loading="lazy"
                    />
                  </div>
                  <span className="blinkit-card-title">{cat.name}</span>
                </div>
              ))}
            </div>

            {/* 4. Value Combo Bundles Section */}
            <div className="pro-bundles-section">
              <div className="pro-section-title-row">
                <div>
                  <h3 className="pro-section-title">Value Combo Boxes</h3>
                  <span className="pro-section-sub">Pre-packaged family essentials for maximum savings</span>
                </div>
              </div>

              <div className="pro-bundles-grid">
                {CURATED_BUNDLES.map((b) => (
                  <div key={b.id} className="pro-bundle-card" style={{ background: b.bg, borderColor: `${b.color}30` }}>
                    <div className="bundle-tag-badge" style={{ background: b.color }}>
                      <Percent size={12} /> {b.tag}
                    </div>
                    <h4 className="bundle-card-title">{b.title}</h4>
                    <p className="bundle-items-text">{b.itemsText}</p>
                    <div className="bundle-price-footer">
                      <div className="bundle-prices">
                        <strong className="bundle-current-price" style={{ color: b.color }}>{b.price}</strong>
                        <span className="bundle-old-price">{b.oldPrice}</span>
                      </div>
                      <button
                        className="bundle-add-btn"
                        style={{ background: b.color }}
                        onClick={() => showToast(`Added ${b.title} combo to cart!`)}
                      >
                        + Quick Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. G Mart Quality Assurance Strip */}
            <div className="pro-assurance-grid">
              <div className="assurance-card">
                <div className="assurance-icon-box"><ShieldCheck size={22} color="#059669" /></div>
                <div className="assurance-text-group">
                  <strong>100% Quality Inspected</strong>
                  <span>Every item undergoes strict grading before packing</span>
                </div>
              </div>
              <div className="assurance-card">
                <div className="assurance-icon-box"><Truck size={22} color="#0284c7" /></div>
                <div className="assurance-text-group">
                  <strong>Express Farm Delivery</strong>
                  <span>Direct to your doorstep in temperature-controlled boxes</span>
                </div>
              </div>
              <div className="assurance-card">
                <div className="assurance-icon-box"><RotateCcw size={22} color="#7c3aed" /></div>
                <div className="assurance-text-group">
                  <strong>Instant Return Guarantee</strong>
                  <span>No questions asked return if you are not 100% satisfied</span>
                </div>
              </div>
              <div className="assurance-card">
                <div className="assurance-icon-box"><Clock size={22} color="#ea580c" /></div>
                <div className="assurance-text-group">
                  <strong>7 AM – 11 PM Support</strong>
                  <span>Dedicated customer care for seamless order tracking</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            VIEW 2: EXPANDED CATEGORY WITH RICH SMART TILES & PRODUCT GRID
            ========================================================================= */}
        {selectedCategoryId && currentCategory && (
          <div className="pro-cat-detail-wrapper">

            {/* Category Hero Banner */}
            <div className="pro-cat-hero-banner" style={{ background: currentCategory.gradient, borderColor: `${currentCategory.accentColor}30` }}>
              <div className="hero-badge-pill" style={{ background: '#ffffff', color: currentCategory.accentColor }}>
                <CheckCircle2 size={14} /> {currentCategory.badge}
              </div>
              <h2 className="pro-cat-hero-title">{currentCategory.name}</h2>
              <p className="pro-cat-hero-tagline">{currentCategory.tagline}</p>
            </div>

            {/* Subcategories Smart Tiles Filter (2x2 on mobile, multi-column on desktop) */}
            <div className="pro-subcategories-filter-zone">
              <div className="sub-filter-header-row">
                <span className="sub-filter-title">Filter by Sub-Department:</span>
                {activeSubcategoryId !== 'all' && (
                  <button className="sub-filter-reset-link" onClick={() => setActiveSubcategoryId('all')}>
                    Show All Subcategories
                  </button>
                )}
              </div>

              <div className="pro-smart-tiles-grid">
                {currentCategory.subcategories.map((sub) => {
                  const isActive = activeSubcategoryId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className={`pro-smart-tile ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveSubcategoryId(sub.id)}
                      style={{
                        borderColor: isActive ? currentCategory.accentColor : '#e2e8f0',
                        background: isActive ? currentCategory.accentColor : '#ffffff',
                        color: isActive ? '#ffffff' : '#0f172a'
                      }}
                    >
                      <div className="smart-tile-top">
                        <span className="smart-tile-name">{sub.name}</span>
                        <div
                          className="smart-tile-dot"
                          style={{ background: isActive ? '#ffffff' : '#cbd5e1' }}
                        />
                      </div>
                      {sub.badge && (
                        <span
                          className="smart-tile-badge"
                          style={{
                            color: isActive ? '#ffffff' : currentCategory.accentColor,
                            fontWeight: 800
                          }}
                        >
                          {sub.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product Section Header */}
            <div className="pro-products-header-strip">
              <div>
                <h3 className="pro-products-heading">
                  Popular in {activeSubcategoryId !== 'all' ? currentCategory.subcategories.find(s => s.id === activeSubcategoryId)?.name : currentCategory.name}
                </h3>
                <span className="pro-products-count-sub">
                  Showing {categoryProducts.length} items
                </span>
              </div>
            </div>

            {/* 3-Column Compact Products Grid on Mobile / 4-5 on Desktop */}
            {categoryProducts.length === 0 ? (
              <div className="pro-empty-category-view">
                <div className="empty-icon-box">📦</div>
                <h4>No products found in this filter</h4>
                <p>Try clearing your search query or choosing another sub-department.</p>
                <button
                  className="pro-reset-filter-btn"
                  onClick={() => {
                    setActiveSubcategoryId('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="pro-category-products-3col-grid">
                {categoryProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={() => onSelectProduct?.(p.id)}
                    showToast={showToast}
                    compact={true}
                  />
                ))}
              </div>
            )}

            {/* Quick Department Switcher 4-Column Visual Cards */}
            <div className="pro-other-departments-section">
              <div className="other-dept-header">
                <h4 className="other-dept-heading">Explore Other Departments</h4>
                <span className="other-dept-sub">Tap to browse another grocery aisle</span>
              </div>
              <div className="other-dept-grid-tiles">
                {CATEGORIES_DATA.filter((c) => c.id !== selectedCategoryId).slice(0, 12).map((c) => (
                  <div
                    key={c.id}
                    className="other-dept-tile-card"
                    onClick={() => handleOpenCategory(c.id)}
                  >
                    <div className="other-dept-thumb-box" style={{ background: c.bgLight || '#f1f5f9' }}>
                      <img src={c.thumbImage} alt={c.name} loading="lazy" />
                    </div>
                    <span className="other-dept-tile-title">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
