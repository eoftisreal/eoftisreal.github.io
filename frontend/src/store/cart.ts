import { fetchWithAuth } from "@/lib/apiClient";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuthToken, getCartItems, setCartItems } from '@/lib/storage';
import {
  normalizeStock as normalizeStockValue,
  productQuantity,
} from '@/lib/stock';

const apiBase = import.meta.env.VITE_API_URL || '/api';

let mutationQueue: Promise<unknown> = Promise.resolve();

function serializeCartMutation<T>(
  action: () => Promise<T>
): Promise<T> {
  const result = mutationQueue.then(action, action);

  mutationQueue = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}

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
  removeItem: (productId: string, size: string | undefined, color: string | undefined) => Promise<{ ok: boolean; message?: string }>;
  syncLocalCartToBackend: () => Promise<void>;
  clearLocalCart: () => void;
};

async function getLatestProductStock(
  productId: string
): Promise<number | undefined> {
  try {
    const res = await fetch(
      `${apiBase}/products/${productId}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return undefined;

    const product = await res.json();

    if (product.isActive === false) return 0;

    return normalizeStockValue(product.stock);
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
            size: item.size,
            color: item.color,
            availableStock: normalizeStockValue(product.stock),
          };
        });
        set({ items: mappedItems });
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  },

  addItem: (product) => serializeCartMutation(async () => {
    const availableStock = await getLatestProductStock(product.productId);

    if (availableStock === undefined) {
      return {
        ok: false,
        message: 'Unable to verify stock. Please try again.',
      };
    }

    if (availableStock <= 0) {
      return {
        ok: false,
        message: 'Product is out of stock',
      };
    }

    const currentItems = get().items;

    if (
      productQuantity(currentItems, product.productId) + 1 >
      availableStock
    ) {
      return {
        ok: false,
        message: `Only ${availableStock} unit(s) available`,
      };
    }

    const token = getAuthToken();

    const existing = currentItems.find((item) =>
      item.productId === product.productId &&
      item.size === product.size &&
      item.color === product.color
    );
    const newQuantity = existing ? existing.quantity + 1 : 1;

    const updatedItems = existing
      ? currentItems.map(item =>
          item.productId === product.productId && item.size === product.size && item.color === product.color
            ? { ...item, quantity: newQuantity, availableStock }
            : item
        )
      : [...currentItems, { ...product, quantity: 1, availableStock }];

    if (!token) {
      setCartItems(updatedItems);
      set({ items: updatedItems });
      return { ok: true };
    }

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
        return {
          ok: false,
          message:
            body.error?.message ||
            body.message ||
            'Unable to add item'
        };
      }

      await get().fetchCart();
      return { ok: true };
    } catch (err) {
      console.error('Failed to add item to cart', err);
      return { ok: false, message: 'Unable to update cart quantity' };
    }
  }),

  updateQuantity: (productId, size, color, quantity) =>
    serializeCartMutation(async () => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return { ok: false, message: 'Invalid quantity' };
    }
    const token = getAuthToken();
    const currentItems = get().items;
    const existing = currentItems.find((item) =>
      item.productId === productId && item.size === size && item.color === color
    );

    if (!existing) {
      return {
        ok: false,
        message: 'Item is no longer in the cart',
      };
    }

    const isIncrease = quantity > existing.quantity;
    let availableStock = normalizeStockValue(existing.availableStock);

    if (isIncrease) {
      availableStock = await getLatestProductStock(productId);

      if (availableStock === undefined) {
        return {
          ok: false,
          message: 'Unable to verify stock. Please try again.',
        };
      }

      const requestedTotal =
        productQuantity(currentItems, productId) -
        existing.quantity +
        quantity;

      if (requestedTotal > availableStock) {
        return {
          ok: false,
          message:
            availableStock === 0
              ? 'Product is out of stock'
              : `Only ${availableStock} unit(s) available`,
        };
      }
    }

    if (!token) {
      // local update
      const updated = currentItems.map(item =>
        item.productId === productId && item.size === size && item.color === color
          ? { ...item, quantity: quantity, availableStock }
          : item
      );
      setCartItems(updated);
      set({ items: updated });
      return { ok: true };
    }

    // Logged in: update optimistically
    const updated = currentItems.map(item =>
      item.productId === productId && item.size === size && item.color === color
        ? { ...item, quantity: quantity, availableStock }
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
        body: JSON.stringify({ productId, quantity: quantity, size, color }),
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
  }),

  removeItem: (productId, size, color) =>
    serializeCartMutation(async () => {
    const token = getAuthToken();

    const currentItems = get().items;
    const isMatch = (item: CartItem) => item.productId === productId && item.size === size && item.color === color;

    if (!token) {
      // local update
      const updated = currentItems.filter(item => !isMatch(item));
      setCartItems(updated);
      set({ items: updated });
      return { ok: true };
    }

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
        const body = await res.json().catch(() => ({}));
        return {
          ok: false,
          message: body.error?.message || body.message || 'Unable to remove item'
        };
      }

      const updated = currentItems.filter(item => !isMatch(item));
      set({ items: updated });

      return { ok: true };
    } catch (err) {
      console.error('Failed to remove item', err);
      return { ok: false, message: 'Unable to remove item' };
    }
  }),

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
