import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CheckoutForm from '../src/components/CheckoutForm';

const mocks = vi.hoisted(() => ({ fetchCart: vi.fn(), clear: vi.fn(), checkout: vi.fn() }));
vi.mock('@/lib/storage', () => ({ getAuthToken: () => 'test-token' }));
vi.mock('@/lib/apiClient', () => ({ fetchWithAuth: (...args: unknown[]) => mocks.checkout(...args) }));
vi.mock('@/store/cart', () => ({
  useCartStore: Object.assign(() => ({ items: [{ productId: 'p1', title: 'Shirt', unitPrice: 100, quantity: 1 }], fetchCart: mocks.fetchCart }), {
    getState: () => ({ clearLocalCart: mocks.clear }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/auth/me') ? {
    user: { name: 'Test Customer', phone: '+91 9999999999', address: { line1: 'Test Road', city: 'Patna', state: 'Bihar', postalCode: '800001', country: 'India' } },
  } : { enableEmailDelivery: true, enableTax: false, enableDeliveryCharge: false })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openPaymentStep() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/checkout']}><Routes>
    <Route path="/checkout" element={<CheckoutForm />} />
    <Route path="/" element={<div>Store home</div>} />
  </Routes></MemoryRouter></QueryClientProvider>);
  await screen.findByDisplayValue('Test Customer');
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Next', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Next', exact: true }));
  return screen.getByRole('button', { name: 'Place Order', exact: true });
}

describe('payment opens in a new tab', () => {
  it('opens synchronously before the order request and navigates the same tab to payment', async () => {
    const popup = { closed: false, location: { href: '/order-processing' } };
    const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    mocks.checkout.mockImplementation(async () => {
      expect(open).toHaveBeenCalledWith('/order-processing', '_blank');
      return Response.json({ order: { _id: 'order123' } }, { status: 201 });
    });
    fireEvent.click(await openPaymentStep());
    await screen.findByText('Store home');
    expect(popup.location.href).toBe('/orders/order123');
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledOnce();
  });
  it('keeps a usable new-tab payment link visible when popup opening is blocked', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    mocks.checkout.mockResolvedValue(Response.json({ order: { _id: 'order123' } }));
    fireEvent.click(await openPaymentStep());
    const link = await screen.findByRole('link', { name: /view your order and pay/i });
    expect(link.getAttribute('href')).toBe('/orders/order123');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(screen.queryByText('Store home')).toBeNull();
    expect((screen.getByRole('button', { name: 'Place Order' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('prevents rapid duplicate submissions while the order is being created', async () => {
    const popup = { closed: false, location: { href: '' } };
    const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    let finish!: (response: Response) => void;
    mocks.checkout.mockImplementation(() => new Promise<Response>(resolve => { finish = resolve; }));
    const button = await openPaymentStep();
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(mocks.checkout).toHaveBeenCalledOnce());
    expect(open).toHaveBeenCalledOnce();
    finish(Response.json({ order: { _id: 'order123' } }));
    await screen.findByText('Store home');
  });
  it('keeps checkout and cart when order creation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const popup = { closed: false, location: { href: '' } };
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    mocks.checkout.mockResolvedValue(Response.json({ message: 'Unavailable' }, { status: 503 }));
    fireEvent.click(await openPaymentStep());
    await screen.findByText('An error occurred while placing the order.');
    expect(popup.location.href).toMatch(/^\/order-processing\?error=/);
    expect(mocks.clear).not.toHaveBeenCalled();
    expect(screen.queryByText('Store home')).toBeNull();
  });
});
