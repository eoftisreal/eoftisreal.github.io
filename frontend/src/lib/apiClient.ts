import { getAuthToken, getRefreshToken, setAuthToken, clearAuth } from './storage';

const apiBase = import.meta.env.VITE_API_URL || '/api';

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
        const refreshResponse = await fetch(`${apiBase}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAuthToken(data.accessToken);

          // Retry original request with new token
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          clearAuth();
          window.location.href = '/auth/login';
        }
      } catch (e) {
        clearAuth();
        window.location.href = '/auth/login';
      }
    } else {
      clearAuth();
      window.location.href = '/auth/login';
    }
  }

  return response;
}
