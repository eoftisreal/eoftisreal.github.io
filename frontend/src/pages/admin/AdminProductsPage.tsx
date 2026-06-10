
import ProductForm from '@/components/ProductForm';
import AdminProductList from '@/components/AdminProductList';

import { useState } from 'react';

export default function AdminProductsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProductAdded = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Manage Products</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div>
          <ProductForm onSuccess={handleProductAdded} />
        </div>
        <div>
          <AdminProductList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
