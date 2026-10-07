import { fetchWithAuth } from "@/lib/apiClient";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuthToken, getCartItems, setCartItems } from '@/lib/storage';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export type CartItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  customImage?: string;
  size?: string;
  color?: string;
  availableStock?: number;
};

type CartState = {
  items: CartItem[];
  fetchCart: () => Promise<void>;
  addItem: (product: Pick<CartItem, 'productId' | 'title' | 'unitPrice' | 'image' | 'customImage' | 'size' | 'color' | 'availableStock'>) => Promise<{ ok: boolean; message?: string }>;
  updateQuantity: (productId: string, size: string | undefined, color: string | undefined, quantity: number) => Promise<{ ok: boolean; message?: string }>;
  removeItem: (productId: string, size: string | undefined, color: string | undefined) => Promise<void>;
  syncLocalCartToBackend: () => Promise<void>;
  clearLocalCart: () => void;
};

async function getLatestProductStock(productId: string): Promise<number | undefined> {
  try {
    const res = await fetch(`${apiBase}/products/${productId}`);
    if (!res.ok) return undefined;
    const product = await res.json();
    if (typeof product.stock !== 'number') return undefined;
    return product.stock;
  } catch {
    return undefined;
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: getCartItems(),

      fetchCart: async () => {
        const token = getAuthToken();
        if (!token) {
          // If not logged in, just rely on what is persisted
          return;
        }

    try {
      const res = await fetchWithAuth(`${apiBase}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mappedItems = data.items.map((item: any) => {
          const product = item.productId;
          return {
            productId: product._id || product,
            title: product.title || 'Unknown Item',
            unitPrice: product.price || 0,
            quantity: item.quantity,
            image: product.images?.[0] || undefined,
            customImage: item.customImage || undefined,
            size: product.enableSizes ? item.size : undefined,
            color: product.enableColors ? item.color : undefined,
            availableStock: typeof product.stock === 'number' ? product.stock : undefined,
          };
        });
        set({ items: mappedItems });
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  },

  addItem: async (product) => {
    const stockLabel = (stock: number) => stock <= 0 ? 'Product is out of stock' : `Only ${stock} unit(s) available`;
    const token = getAuthToken();
    const currentItems = get().items;
    const existing = currentItems.find((item) =>
  item.productId === product.productId &&
  item.size === product.size &&
  item.color === product.color
    );
    const newQuantity = existing ? existing.quantity + 1 : 1;
    const latestStock = await getLatestProductStock(product.productId);
    const availableStock = latestStock ?? product.availableStock ?? existing?.availableStock;

    if (typeof availableStock === 'number' && newQuantity > availableStock) {
  return { ok: false, message: stockLabel(availableStock) };
    }

    const updatedItems = existing
  ? currentItems.map(item =>
      item.productId === product.productId && item.size === product.size && item.color === product.color
        ? { ...item, quantity: newQuantity, availableStock }
        : item
    )
  : [...currentItems, { ...product, quantity: 1, availableStock }];

    if (!token) {
  setCartItems(updatedItems); // keep fallback in sync just in case
  set({ items: updatedItems });
  return { ok: true };
    }

    set({ items: updatedItems });

    try {
  const res = await fetchWithAuth(`${apiBase}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.productId,
          quantity: newQuantity,
          customImage: product.customImage,
          size: product.size,
          color: product.color
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Revert on failure
        await get().fetchCart();
        return { ok: false, message: body.error?.message || body.message || 'Unable to update cart quantity' };
      }
      await get().fetchCart();
      return { ok: true };
    } catch (err) {
      console.error('Failed to add item to cart', err);
      await get().fetchCart(); // Revert on failure
      return { ok: false, message: 'Unable to update cart quantity' };
    }
  },

  updateQuantity: async (productId, size, color, quantity) => {
    const newQuantity = Math.max(1, quantity);
    const stockLabel = (stock: number) => stock <= 0 ? 'Product is out of stock' : `Only ${stock} unit(s) available`;
    const token = getAuthToken();
    const currentItems = get().items;
    const existing = currentItems.find((item) =>
      item.productId === productId && item.size === size && item.color === color
    );
    const isIncrease = !!existing && newQuantity > existing.quantity;
    let availableStock = existing?.availableStock;
    if (isIncrease) {
      const latestStock = await getLatestProductStock(productId);
      if (typeof latestStock === 'number') {
        availableStock = latestStock;
      }
      if (typeof availableStock === 'number' && newQuantity > availableStock) {
        return { ok: false, message: stockLabel(availableStock) };
      }
    }

    if (!token) {
      // local update
      const updated = currentItems.map(item =>
        item.productId === productId && item.size === size && item.color === color
          ? { ...item, quantity: newQuantity, availableStock }
          : item
      );
      setCartItems(updated);
      set({ items: updated });
      return { ok: true };
    }

    // Logged in: update optimistically
    const updated = currentItems.map(item =>
      item.productId === productId && item.size === size && item.color === color
        ? { ...item, quantity: newQuantity, availableStock }
        : item
    );
    set({ items: updated });

    try {
      const res = await fetchWithAuth(`${apiBase}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: newQuantity, size, color }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Revert on failure
        await get().fetchCart();
        return { ok: false, message: body.error?.message || body.message || 'Unable to update cart quantity' };
      }
      await get().fetchCart();
      return { ok: true };
    } catch (err) {
      console.error('Failed to update quantity', err);
      await get().fetchCart(); // Revert on failure
      return { ok: false, message: 'Unable to update cart quantity' };
    }
  },

  removeItem: async (productId, size, color) => {
    const token = getAuthToken();

    const isMatch = (item: CartItem) => item.productId === productId && item.size === size && item.color === color;

    if (!token) {
      // local update
      const currentItems = get().items;
      const updated = currentItems.filter(item => !isMatch(item));
      setCartItems(updated);
      set({ items: updated });
      return;
    }

    // Logged in: update optimistically
    const currentItems = get().items;
    const updated = currentItems.filter(item => !isMatch(item));
    set({ items: updated });

    try {
      const res = await fetchWithAuth(`${apiBase}/cart/items/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ size, color })
      });

      if (!res.ok) {
        // Revert on failure
        await get().fetchCart();
      }
    } catch (err) {
      console.error('Failed to remove item', err);
      await get().fetchCart(); // Revert on failure
    }
  },

  syncLocalCartToBackend: async () => {
    const token = getAuthToken();
    if (!token) return;

    // Discard local items upon login and fetch the user's saved backend cart
    setCartItems([]);
    await get().fetchCart();
  },

      clearLocalCart: () => {
        setCartItems([]);
        set({ items: [] });
      }
    }),
    {
      name: 'kapdakraft_zustand_cart',
    }
  )
);
