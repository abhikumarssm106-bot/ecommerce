export interface Variant {
  name: string;
  priceOffset: number;
  weight: string;
}

export interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface Bundle {
  items: string[];
  discount: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  imageStyle?: string;
  weight: string;
  badge?: string;
  badgeClass?: string;
  stock: string;
  stockClass?: string;
  description: string;
  features: string[];
  usage: string;
  origin: string;
  storage: string;
  mfgDate: string;
  expDate: string;
  ingredients?: string;
  nutrition?: Record<string, string> | null;
  variants: Variant[];
  reviews: Review[];
  related: string[];
  bundle?: Bundle;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  productId: string;
  variantName: string;
  weight: string;
  variantId?: string;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  zip: string;
  address: string;
  payment: string;
}
