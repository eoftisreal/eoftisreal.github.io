import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, clearAuth } from './storage';

export const getApiBaseUrl = (): string => import.meta.env.VITE_API_URL || '/api';
const apiBase = getApiBaseUrl();
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(expiredToken: string | null): Promise<string | null> {
  const refresh = async () => {
    // Another request (or tab holding the Web Lock) may already have refreshed.
    const currentToken = getAuthToken();
    if (currentToken && currentToken !== expiredToken) return currentToken;
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    const response = await fetch(`${apiBase}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        return null;
      }
      throw new Error('Session refresh is temporarily unavailable');
    }
    const data = await response.json();
    if (!data.accessToken || !data.refreshToken) throw new Error('Invalid session refresh response');
    // The server rotates refresh tokens. Persist both before notifying listeners.
    setRefreshToken(data.refreshToken);
    setAuthToken(data.accessToken);
    return data.accessToken as string;
  };
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('kapdakraft-auth-refresh', refresh);
  }
  return refresh();
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response = await fetch(url, { ...options, headers });
  if (response.status !== 401) return response;

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken(token).finally(() => { refreshInFlight = null; });
  }
  const accessToken = await refreshInFlight;
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
    response = await fetch(url, { ...options, headers });
  } else {
    clearAuth();
    window.location.href = '/auth/login';
  }
  return response;
}
