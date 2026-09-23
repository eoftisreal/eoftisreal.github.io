import { getApiBaseUrl, fetchWithAuth } from './apiClient';

const apiBase = getApiBaseUrl();

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(`${apiBase}${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return res.json() as Promise<T>;
}

export type Product = {
  _id: string;
  title: string;
  description: string;
  artistName: string;
  productType?: string;
  category: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  isFeatured?: boolean;
  isCustomizable?: boolean;
  enableSizes?: boolean;
  sizes?: string[];
  enableColors?: boolean;
  colors?: string[];
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
  tags?: string[];
};
