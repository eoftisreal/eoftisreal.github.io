import { fetchWithAuth } from "@/lib/apiClient";

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import { Plus, Trash2 } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || '/api';

type Brand = {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const res = await fetchWithAuth(`${apiBase}/master/brands`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) setBrands(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${apiBase}/master/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        setName('');
        setDescription('');
        fetchBrands();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this brand?')) return;
    try {
      const res = await fetchWithAuth(`${apiBase}/master/brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) fetchBrands();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Brands Master</h1>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <div className="md:col-span-1 rounded-md bg-white p-6 border border-secondary-bg">
          <h2 className="font-bold text-lg mb-4">Add Brand</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </div>
            <button disabled={loading} className="w-full flex justify-center items-center gap-2 rounded-md bg-foreground hover:bg-black px-4 py-2 font-semibold text-white disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Brand
            </button>
          </form>
        </div>

        <div className="md:col-span-2 rounded-md bg-white p-6 border border-secondary-bg">
          <h2 className="font-bold text-lg mb-4">Existing Brands</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brands.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-500">No brands found.</td></tr>
                ) : brands.map(brand => (
                  <tr key={brand._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{brand.name}</td>
                    <td className="px-4 py-3 text-slate-500">{brand.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(brand._id)} className="text-secondary-text hover:text-foreground p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
