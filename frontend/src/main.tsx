import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
if (import.meta.env.DEV) {
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(console.log);
    onINP(console.log);
    onFCP(console.log);
    onLCP(console.log);
    onTTFB(console.log);
  });
}


import { lazy, Suspense } from 'react';
import App from './App';
import ScrollToTop from './components/ScrollToTop';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught an error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center text-slate-500 gap-4">
          <p>Failed to load the page. A new version of the site might be available.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-foreground text-white rounded">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function lazyRetry<T extends { default: React.ComponentType<any> }>(factory: () => Promise<T>) {
  return lazy(() =>
    factory().catch(() => {
      const key = 'chunk-reload-attempted';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      return factory();
    })
  );
}

const HomePage = lazyRetry(() => import('./pages/HomePage'));
const ProductsPage = lazyRetry(() => import('./pages/ProductsPage'));
const ProductPage = lazyRetry(() => import('./pages/ProductPage'));
const CartPage = lazyRetry(() => import('./pages/CartPage'));
const CheckoutPage = lazyRetry(() => import('./pages/CheckoutPage'));
const OrdersPage = lazyRetry(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazyRetry(() => import('./pages/OrderDetailPage'));
const OrderProcessingPage = lazyRetry(() => import('./pages/OrderProcessingPage'));
const LoginPage = lazyRetry(() => import('./pages/auth/LoginPage'));
const SignupPage = lazyRetry(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazyRetry(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyRetry(() => import('./pages/auth/ResetPasswordPage'));
const MagicLinkPage = lazyRetry(() => import('./pages/auth/MagicLinkPage'));
const VerifyEmailPage = lazyRetry(() => import('./pages/auth/VerifyEmailPage'));
const CallbackPage = lazyRetry(() => import('./pages/auth/CallbackPage'));
const AdminLayout = lazyRetry(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazyRetry(() => import('./pages/admin/AdminDashboard'));
const AdminProductsPage = lazyRetry(() => import('./pages/admin/AdminProductsPage'));
const AdminProductEditPage = lazyRetry(() => import('./pages/admin/AdminProductEditPage'));
const CategoriesPage = lazyRetry(() => import('./pages/admin/CategoriesPage'));
const BrandsPage = lazyRetry(() => import('./pages/admin/BrandsPage'));
const CouponsPage = lazyRetry(() => import('./pages/admin/CouponsPage'));
const UsersPage = lazyRetry(() => import('./pages/admin/UsersPage'));
const AdminsPage = lazyRetry(() => import('./pages/admin/AdminsPage'));
const SettingsPage = lazyRetry(() => import('./pages/admin/SettingsPage'));
const AccountPage = lazyRetry(() => import('./pages/AccountPage'));
const AboutPage = lazyRetry(() => import('./pages/AboutPage'));
const ContactPage = lazyRetry(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazyRetry(() => import('./pages/PrivacyPolicyPage'));
const AdminOrdersPage = lazyRetry(() => import('./pages/admin/OrdersPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>}>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<PrivacyPolicyPage />} />
          <Route path="shipping" element={<PrivacyPolicyPage />} />

          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />

          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="order-processing" element={<OrderProcessingPage />} />
          <Route path="account" element={<AccountPage />} />

          <Route path="auth/login" element={<LoginPage />} />
          <Route path="auth/signup" element={<SignupPage />} />
          <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="auth/magic-link" element={<MagicLinkPage />} />
          <Route path="auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="auth/callback" element={<CallbackPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/:id" element={<AdminProductEditPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
