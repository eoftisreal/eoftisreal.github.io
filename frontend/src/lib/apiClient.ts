import { getAuthToken, getRefreshToken, setAuthToken, clearAuth } from './storage';

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return '/api';
  }
  return 'http://localhost:3000/api';
};

const apiBase = getApiBaseUrl();

let refreshPromise: Promise<string | null> | null = null;

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        // Deduplicate concurrent refresh requests
        if (!refreshPromise) {
          refreshPromise = fetch(`${apiBase}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          }).then(async (refreshResponse) => {
            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              setAuthToken(data.accessToken);
              return data.accessToken;
            } else {
              clearAuth();
              return null;
            }
          }).catch(() => {
            clearAuth();
            return null;
          }).finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;

        if (newToken) {
          // Retry original request with new token
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          window.location.href = '/auth/login';
        }
      } catch (e) {
        window.location.href = '/auth/login';
      }
    } else {
      clearAuth();
      window.location.href = '/auth/login';
    }
  }

  return response;
}
