import { create } from 'zustand';
import { apiGet, Product } from '@/lib/api';

type Category = {
  _id: string;
  name: string;
  description: string;
  image?: string;
};

type HomeState = {
  categories: Category[];
  featuredProducts: Product[];
  heroBannerUrl: string | null;
  lastFetched: number | null;
  isFetching: boolean;
  fetchData: () => Promise<void>;
};

const CACHE_DURATION_MS = 1000 * 60 * 5; // 5 minutes cache

export const useHomeStore = create<HomeState>((set, get) => ({
  categories: [],
  featuredProducts: [],
  heroBannerUrl: null,
  lastFetched: null,
  isFetching: false,

  fetchData: async () => {
    const now = Date.now();
    const { lastFetched, isFetching } = get();

    // Avoid refetching if currently fetching or if cache is still valid
    if (isFetching || (lastFetched && now - lastFetched < CACHE_DURATION_MS)) {
      return;
    }

    set({ isFetching: true });

    try {
      const [catsRes, prodsRes, settingsRes] = await Promise.all([
        apiGet<Category[]>('/products/categories'),
        apiGet<{products: Product[]}>('/products?isFeatured=true&limit=24'),
        fetch((import.meta.env.VITE_API_URL || '/api') + '/public/settings').then(res => res.ok ? res.json() : {})
      ]);

      const parsedSettings = settingsRes as { heroBannerUrl?: string };

      set({
        categories: catsRes || [],
        featuredProducts: prodsRes?.products || [],
        heroBannerUrl: parsedSettings?.heroBannerUrl || null,
        lastFetched: Date.now(),
        isFetching: false,
      });
    } catch (e) {
      console.error('Failed to fetch home data:', e);
      set({ isFetching: false });
    }
  },
}));
