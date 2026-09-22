const cache = new Map<string, { data: any; time: number }>();
const TTL = 30 * 1000; // 30 seconds

export async function cachedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const requestOptions: RequestInit = { cache: 'no-store', ...options };

  // Do not cache highly dynamic routes or non-GET requests
  const isDynamicRoute =
    url.includes('/orders') ||
    url.includes('/cart') ||
    url.includes('/auth') ||
    url.includes('/admin') ||
    url.includes('/products') ||
    url.includes('/public/settings') ||
    url.includes('/wishlist');

  if (method !== 'GET' || isDynamicRoute) {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return response.json();
  }

  const key = url;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.time < TTL) {
    return cached.data;
  }

  const response = await fetch(url, requestOptions);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  const data = await response.json();
  cache.set(key, { data, time: Date.now() });
  return data;
}
