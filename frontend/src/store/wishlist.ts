import { create } from 'zustand';
import { getAuthToken } from '@/lib/storage';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

export interface WishlistStore {
  items: string[];
  fetchWishlist: () => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clearLocalWishlist: () => void;
}

const LOCAL_STORAGE_KEY = 'local_wishlist';

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  fetchWishlist: async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const localItems = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        if (localItems.length > 0) {
          const syncedItems = await apiPost<{ _id: string }[]>('/wishlist/sync', { productIds: localItems });
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          set({ items: syncedItems.map((item: any) => item._id) });
        } else {
          const token = getAuthToken();
          const headers: Record<string, string> = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          const response = await fetch(`${apiBase}/wishlist`, { headers, cache: 'no-store' });
          if (!response.ok) {
             throw new Error(`API request failed: ${response.status}`);
          }
          const fetchedItems: { _id: string }[] = await response.json();
          set({ items: fetchedItems.map((item: any) => item._id) });
        }
      } catch (error) {
        console.error('Failed to fetch wishlist', error);
      }
    } else {
      const localItems = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      set({ items: localItems });
    }
  },
  add: async (productId: string) => {
    const token = getAuthToken();
    if (token) {
      try {
        const result = await apiPost<{ _id: string }[]>('/wishlist/add', { productId });
        set({ items: result.map((item: any) => item._id) });
      } catch (error) {
        console.error('Failed to add to wishlist', error);
      }
    } else {
      const currentItems = get().items;
      if (!currentItems.includes(productId)) {
        const newItems = [...currentItems, productId];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
        set({ items: newItems });
      }
    }
  },
  remove: async (productId: string) => {
    const token = getAuthToken();
    if (token) {
      try {
        const result = await apiPost<{ _id: string }[]>('/wishlist/remove', { productId });
        set({ items: result.map((item: any) => item._id) });
      } catch (error) {
        console.error('Failed to remove from wishlist', error);
      }
    } else {
      const currentItems = get().items;
      const newItems = currentItems.filter(id => id !== productId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
      set({ items: newItems });
    }
  },
  clearLocalWishlist: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ items: [] });
  }
}));
