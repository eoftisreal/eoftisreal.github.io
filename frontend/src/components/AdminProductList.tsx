import { getAuthToken } from '@/lib/storage';
import { Trash2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/lib/api';
import { fetchWithAuth } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const apiBase = import.meta.env.VITE_API_URL || '/api';

interface AdminProductListProps {
  refreshKey?: number;
}

export default function AdminProductList({ refreshKey = 0 }: AdminProductListProps) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: loading, refetch: fetchProducts } = useQuery<Product[]>({
    queryKey: ['adminProducts', refreshKey],
    queryFn: async () => {
      const res = await fetchWithAuth(`${apiBase}/products?limit=100`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return data.products || [];
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string, isFeatured: boolean }) => {
      const res = await fetchWithAuth(`${apiBase}/products/${id}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ isFeatured })
      });
      if (!res.ok) throw new Error('Failed to toggle featured');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
    onError: () => {
      alert('Failed to update product featured status.');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${apiBase}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
    onError: () => {
      alert('Failed to delete product.');
    }
  });

  function toggleFeatured(id: string, currentStatus: boolean) {
    toggleFeaturedMutation.mutate({ id, isFeatured: !currentStatus });
  }

  function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    deleteProductMutation.mutate(id);
  }

  if (loading) {
    return <div className="rounded-md bg-white p-6 space-y-4"><p>Loading products...</p></div>;
  }

  return (
    <div className="rounded-md bg-white p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="font-bold text-xl">Existing Products</h2>
        <button onClick={() => fetchProducts()} className="text-sm text-foreground hover:underline">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium text-center">Featured</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">No products found.</td></tr>
            ) : products.map(product => (
              <tr key={product._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{product.title}</td>
                <td className="px-4 py-3 text-slate-500">{product.category}</td>
                <td className="px-4 py-3 text-slate-500">₹{product.price}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleFeatured(product._id, !!product.isFeatured)} className={`p-1 ${product.isFeatured ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-300 hover:text-slate-400'}`} title="Toggle Featured">
                    <Star className="w-5 h-5" fill={product.isFeatured ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/products/${product._id}`} className="text-foreground hover:underline p-1 mr-2 text-sm font-medium">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(product._id)} className="text-secondary-text hover:text-foreground p-1" title="Delete Product">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
