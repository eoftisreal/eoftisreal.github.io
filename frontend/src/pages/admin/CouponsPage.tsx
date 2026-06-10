import { fetchWithAuth } from "@/lib/apiClient";

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import { Plus, Trash2 } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || '/api';

type Coupon = {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  isActive: boolean;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const res = await fetchWithAuth(`${apiBase}/master/coupons`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) setCoupons(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${apiBase}/master/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ code, discountType, discountValue, minOrderValue })
      });
      if (res.ok) {
        setCode('');
        setDiscountValue(0);
        setMinOrderValue(0);
        fetchCoupons();
      } else {
        const body = await res.json();
        alert(body.message || 'Error creating coupon');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    try {
      const res = await fetchWithAuth(`${apiBase}/master/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) fetchCoupons();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Coupons Master</h1>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <div className="md:col-span-1 rounded-md bg-white p-6 border border-secondary-bg">
          <h2 className="font-bold text-lg mb-4">Add Coupon</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Coupon Code</label>
              <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SUMMER24" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Discount Type</label>
              <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 bg-white">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Value</label>
                <input type="number" min="0" required value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Min Order</label>
                <input type="number" min="0" value={minOrderValue} onChange={e => setMinOrderValue(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </div>
            </div>

            <button disabled={loading} className="w-full flex justify-center items-center gap-2 rounded-md bg-foreground hover:bg-black px-4 py-2 font-semibold text-white disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Coupon
            </button>
          </form>
        </div>

        <div className="md:col-span-2 rounded-md bg-white p-6 border border-secondary-bg">
          <h2 className="font-bold text-lg mb-4">Existing Coupons</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Min Order</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">No coupons found.</td></tr>
                ) : coupons.map(coupon => (
                  <tr key={coupon._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-foreground">{coupon.code}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-slate-500">₹{coupon.minOrderValue}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(coupon._id)} className="text-secondary-text hover:text-foreground p-1">
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
