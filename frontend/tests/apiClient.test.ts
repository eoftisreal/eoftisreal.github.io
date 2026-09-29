import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => { vi.resetModules(); localStorage.clear(); });
afterEach(() => vi.unstubAllGlobals());

it('coalesces concurrent refreshes, stores the rotated refresh token, and retries both requests', async () => {
  localStorage.setItem('kapdakraft_token', 'expired');
  localStorage.setItem('kapdakraft_refresh_token', 'old-refresh');
  let refreshes = 0;
  const fetch = vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      expect(JSON.parse(options?.body as string)).toEqual({ refreshToken: 'old-refresh' });
      return Response.json({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    }
    return new Headers(options?.headers).get('Authorization') === 'Bearer new-access'
      ? Response.json({ ok: true }) : Response.json({}, { status: 401 });
  });
  vi.stubGlobal('fetch', fetch);
  const { fetchWithAuth } = await import('../src/lib/apiClient');
  const results = await Promise.all([fetchWithAuth('/api/cart'), fetchWithAuth('/api/orders')]);
  expect(results.map(response => response.status)).toEqual([200, 200]);
  expect(refreshes).toBe(1);
  expect(localStorage.getItem('kapdakraft_refresh_token')).toBe('new-refresh');
  expect(localStorage.getItem('kapdakraft_token')).toBe('new-access');
});

it('does not erase the session after a temporary refresh outage', async () => {
  localStorage.setItem('kapdakraft_token', 'expired');
  localStorage.setItem('kapdakraft_refresh_token', 'old-refresh');
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json({}, { status: url.endsWith('/auth/refresh') ? 503 : 401 })));
  const { fetchWithAuth } = await import('../src/lib/apiClient');
  await expect(fetchWithAuth('/api/orders')).rejects.toThrow('temporarily unavailable');
  expect(localStorage.getItem('kapdakraft_refresh_token')).toBe('old-refresh');
});
