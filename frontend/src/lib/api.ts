const apiBase = import.meta.env.VITE_API_URL || '/api';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

export type Product = {
  _id: string;
  title: string;
  description: string;
  artistName: string;
  category: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  isFeatured?: boolean;
  isCustomizable?: boolean;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
  tags?: string[];
};
