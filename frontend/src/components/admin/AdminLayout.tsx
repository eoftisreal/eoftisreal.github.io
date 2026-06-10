import { fetchWithAuth } from "@/lib/apiClient";

import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { getAuthToken, setAuthToken } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function AdminLayout() {
  useEffect(() => {
    const syncToken = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetchWithAuth(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setAuthToken(data.accessToken);
        }
      } catch (error) {
        console.error('Failed to sync auth token:', error);
      }
    };

    syncToken();
  }, []);

  const token = getAuthToken();
  let isAdmin = false;

  if (token) {
    const payload = parseJwt(token);
    if (payload && (payload.role === 'admin' || payload.role === 'master_admin' || payload.isAdmin)) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-foreground">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
