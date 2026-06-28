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
  heroBannerUrls: string[];
  lastFetched: number | null;
  isFetching: boolean;
  fetchData: () => Promise<void>;
};

const CACHE_DURATION_MS = 1000 * 60 * 5; // 5 minutes cache

export const useHomeStore = create<HomeState>((set, get) => ({
  categories: [],
  featuredProducts: [],
  heroBannerUrls: [],
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

      const parsedSettings = settingsRes as { heroBannerUrl?: string, heroBannerUrls?: string[] };

      let resolvedBannerUrls: string[] = [];
      if (parsedSettings?.heroBannerUrls && parsedSettings.heroBannerUrls.length > 0) {
        resolvedBannerUrls = parsedSettings.heroBannerUrls.filter(Boolean);
      } else if (parsedSettings?.heroBannerUrl) {
        resolvedBannerUrls = [parsedSettings.heroBannerUrl];
      }

      set({
        categories: catsRes || [],
        featuredProducts: prodsRes?.products || [],
        heroBannerUrls: resolvedBannerUrls,
        lastFetched: Date.now(),
        isFetching: false,
      });
    } catch (e) {
      console.error('Failed to fetch home data:', e);
      set({ isFetching: false });
    }
  },
}));
