import { fetchWithAuth } from "@/lib/apiClient";

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = getAuthToken();
  const payload = token ? parseJwt(token) : null;
  const isMasterAdmin = payload?.role === 'master_admin';

  useEffect(() => {
    if (isMasterAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
      setError('Master Admin access required.');
    }
  }, [isMasterAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/users?role=user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users.filter((u) => u._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const promoteUser = async (id: string) => {
    if (!confirm('Are you sure you want to promote this user to admin?')) return;
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'admin' })
      });
      if (!res.ok) throw new Error('Failed to promote user');
      setUsers(users.filter((u) => u._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-secondary-text">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Manage Users</h1>
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
            {users.map((user) => (
              <tr key={user._id} className="border-b hover:bg-slate-50">
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.name || 'N/A'}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => promoteUser(user._id)} className="text-foreground hover:underline">Make Admin</button>
                  <button onClick={() => deleteUser(user._id)} className="text-secondary-text hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
