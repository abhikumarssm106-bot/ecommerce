import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from '../types';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  recentlyViewed: string[];
  countdownEnd: number;
  addToCart: (
    productId: string,
    name: string,
    price: number,
    image: string,
    qty: number,
    variantName: string,
    weight: string,
    variantId?: string
  ) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => void;
  addToRecentlyViewed: (productId: string) => void;
  fetchDbCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [countdownEnd, setCountdownEnd] = useState<number>(0);

  // Initialize static states from Local Storage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('gmart_wishlist');
    const savedRecently = localStorage.getItem('gmart_recently_viewed');
    const savedTimer = localStorage.getItem('gmart_countdown_end');

    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedRecently) setRecentlyViewed(JSON.parse(savedRecently));

    if (savedTimer) {
      setCountdownEnd(parseInt(savedTimer, 10));
    } else {
      const now = new Date().getTime();
      const twoDaysFourHours = (2 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000);
      const timerVal = now + twoDaysFourHours;
      localStorage.setItem('gmart_countdown_end', timerVal.toString());
      setCountdownEnd(timerVal);
    }
  }, []);

  // Fetch Cart from Database
  const fetchDbCart = async () => {
    try {
      const { data } = await api.get('/cart');
      const dbItems = (data.data.items || []).map((item: any) => ({
        id: item.itemId, // Use database item id for updates/deletes
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.imageUrl,
        qty: item.quantity,
        variantName: item.variantName,
        weight: item.variantName,
        variantId: item.variantId,
      }));
      setCart(dbItems);
    } catch (err) {
      console.error('Failed to fetch cart from DB:', err);
    }
  };

  // Sync guest cart to DB upon user login
  const syncLocalCartToDb = async () => {
    const savedCart = localStorage.getItem('gmart_cart');
    if (savedCart) {
      try {
        const localItems: CartItem[] = JSON.parse(savedCart);
        for (const item of localItems) {
          if (item.variantId) {
            await api.post('/cart/items', {
              variantId: item.variantId,
              quantity: item.qty,
            });
          }
        }
      } catch (err) {
        console.error('Failed to sync local cart to DB:', err);
      } finally {
        localStorage.removeItem('gmart_cart');
      }
    }
    await fetchDbCart();
  };

  // Sync context cart based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      syncLocalCartToDb();
    } else {
      const savedCart = localStorage.getItem('gmart_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    }
  }, [isAuthenticated]);

  // Save Cart helper for guests
  const saveLocalCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('gmart_cart', JSON.stringify(newCart));
  };

  // Add Item to Cart
  const addToCart = async (
    productId: string,
    name: string,
    price: number,
    image: string,
    qty: number,
    variantName: string,
    weight: string,
    variantId?: string
  ) => {
    if (isAuthenticated && variantId) {
      try {
        await api.post('/cart/items', { variantId, quantity: qty });
        await fetchDbCart();
      } catch (err) {
        console.error('Failed to add item to DB cart:', err);
      }
    } else {
      const newCart = [...cart];
      const itemId = `${productId}-${variantName}`;
      const existingItemIndex = newCart.findIndex((item) => item.id === itemId);

      if (existingItemIndex > -1) {
        newCart[existingItemIndex].qty += qty;
      } else {
        newCart.push({
          id: itemId,
          productId,
          name,
          price,
          image,
          qty,
          variantName,
          weight,
          variantId,
        });
      }
      saveLocalCart(newCart);
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (id: string) => {
    if (isAuthenticated) {
      try {
        await api.delete(`/cart/items/${id}`);
        await fetchDbCart();
      } catch (err) {
        console.error('Failed to remove item from DB cart:', err);
      }
    } else {
      const newCart = cart.filter((item) => item.id !== id);
      saveLocalCart(newCart);
    }
  };

  // Update Item Quantity
  const updateQty = async (id: string, qty: number) => {
    const validQty = Math.max(1, qty);
    if (isAuthenticated) {
      try {
        await api.put(`/cart/items/${id}`, { quantity: validQty });
        await fetchDbCart();
      } catch (err) {
        console.error('Failed to update qty in DB cart:', err);
      }
    } else {
      const newCart = cart.map((item) => {
        if (item.id === id) {
          return { ...item, qty: validQty };
        }
        return item;
      });
      saveLocalCart(newCart);
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart');
        setCart([]);
      } catch (err) {
        console.error('Failed to clear DB cart:', err);
      }
    } else {
      saveLocalCart([]);
    }
  };

  // Toggle Wishlist (stored locally)
  const toggleWishlist = (productId: string) => {
    const newWishlist = [...wishlist];
    const index = newWishlist.indexOf(productId);
    if (index > -1) {
      newWishlist.splice(index, 1);
    } else {
      newWishlist.push(productId);
    }
    setWishlist(newWishlist);
    localStorage.setItem('gmart_wishlist', JSON.stringify(newWishlist));
  };

  // Add to Recently Viewed (stored locally)
  const addToRecentlyViewed = (productId: string) => {
    if (!productId) return;
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, 10);
      localStorage.setItem('gmart_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        recentlyViewed,
        countdownEnd,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleWishlist,
        addToRecentlyViewed,
        fetchDbCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
