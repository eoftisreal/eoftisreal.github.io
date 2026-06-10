import { fetchWithAuth } from "@/lib/apiClient";

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = getAuthToken();
  const payload = token ? parseJwt(token) : null;
  const isMasterAdmin = payload?.role === 'master_admin';

  useEffect(() => {
    if (isMasterAdmin) {
      fetchAdmins();
    } else {
      setLoading(false);
      setError('Master Admin access required.');
    }
  }, [isMasterAdmin]);

  const fetchAdmins = async () => {
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/users?role=admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch admins');
      const data = await res.json();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to demote this admin to a regular user?')) return;
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'user' })
      });
      if (!res.ok) throw new Error('Failed to update role');
      setAdmins(admins.filter((a) => a._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-secondary-text">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Manage Admins</h1>
      <div className="overflow-hidden rounded-lg bg-white border border-secondary-bg">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700">
            <tr>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} className="border-b hover:bg-slate-50">
                <td className="px-6 py-4">{admin.email}</td>
                <td className="px-6 py-4">{admin.name || 'N/A'}</td>
                <td className="px-6 py-4">{admin.role}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => demoteAdmin(admin._id)} className="text-foreground hover:underline">Demote to User</button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">No admins found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
