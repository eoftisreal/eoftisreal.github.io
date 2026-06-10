export type CartItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  image?: string;
};

export const CART_KEY = 'kapdakraft_cart';
export const TOKEN_KEY = 'kapdakraft_token';
export const REFRESH_TOKEN_KEY = 'kapdakraft_refresh_token';

function hasWindow() {
  return typeof window !== 'undefined';
}

export function getStoredValue<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setStoredValue<T>(key: string, value: T) {
  if (!hasWindow()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function getCartItems() {
  return getStoredValue<CartItem[]>(CART_KEY, []);
}

export function setCartItems(items: CartItem[]) {
  setStoredValue(CART_KEY, items);
}

export function addCartItem(product: Pick<CartItem, 'productId' | 'title' | 'unitPrice' | 'image'>) {
  const cart = getCartItems();
  const existing = cart.find((item) => item.productId === product.productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  setCartItems(cart);
}

export function getAuthToken() {
  if (!hasWindow()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (!hasWindow()) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event('auth-change'));
}

export function getRefreshToken() {
  if (!hasWindow()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  if (!hasWindow()) {
    return;
  }

  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearAuth() {
  if (!hasWindow()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event('auth-change'));
}
