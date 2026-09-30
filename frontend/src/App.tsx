import { Outlet, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAuthToken, setAuthToken } from '@/lib/storage';
import { Toaster } from 'react-hot-toast';
const HolographicBackground = lazy(() => import('@/components/HolographicBackground'));

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  useEffect(() => {
    const syncToken = async () => {
      const token = getAuthToken();
      if (!token) return;

      // Optimize: Only sync token in background to avoid blocking initial render
      // or unnecessary repeated calls if the token is already likely valid
      setTimeout(async () => {
        try {
          const res = await fetch(`${apiBase}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setAuthToken(data.accessToken);
          }
        } catch (error) {
          console.error('Failed to sync auth token:', error);
        }
      }, 2000);
    };

    syncToken();
  }, []);

  return (
    <div className="min-h-screen text-foreground antialiased relative">
      {isHomepage ? (
        <Suspense fallback={null}>
          <HolographicBackground blurOverlay={false} />
        </Suspense>
      ) : (
        <div
          className="fixed inset-0 w-full h-full z-[-1] pointer-events-none"
          style={{
            background:
              'radial-gradient(120% 100% at 50% 30%, #faf8f6 0%, #f4f2f0 45%, #ece6df 80%, #e2dad0 100%)',
          }}
        />
      )}
      <Toaster position="bottom-center" reverseOrder={true} />
      <Header />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
