'use client';

import { useEffect, useState, Suspense } from 'react';
import { apiGet, Product } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import { useSearchParams } from 'react-router-dom';

type ProductResponse = {
  products: Product[];
  page: number;
  totalPages: number;
};

function ProductListingContent() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const sortParam = searchParams.get('sort');
  const inStockParam = searchParams.get('inStock');
  const productTypeParam = searchParams.get('productType');
  const tagParam = searchParams.get('tag');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const pageParam = searchParams.get('page');

  const [data, setData] = useState<ProductResponse>({ products: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [brands, setBrands] = useState<{_id: string, name: string}[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Local state for the price range sliders
  const [minPrice, setMinPrice] = useState(minPriceParam || '');
  const [maxPrice, setMaxPrice] = useState(maxPriceParam || '');

  useEffect(() => {
    async function fetchFilters() {
      try {
        const [cats, brs, pTypes, tgs] = await Promise.all([
          apiGet<{_id: string, name: string}[]>('/products/categories'),
          apiGet<{_id: string, name: string}[]>('/products/brands'),
          apiGet<string[]>('/products/product-types'),
          apiGet<string[]>('/products/tags')
        ]);
        setCategories(cats);
        setBrands(brs);
        setProductTypes(pTypes);
        setTags(tgs);
      } catch (e) {
        console.error('Failed to load filters', e);
      }
    }
    fetchFilters();
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      setLoading(true);
      const query = new URLSearchParams();
      if (q) query.set('q', q);
      if (category) query.set('category', category);
      if (brand) query.set('brand', brand);
      if (sortParam) query.set('sort', sortParam);
      if (inStockParam) query.set('inStock', inStockParam);
      if (productTypeParam) query.set('productType', productTypeParam);
      if (tagParam) query.set('tag', tagParam);
      if (minPriceParam) query.set('minPrice', minPriceParam);
      if (maxPriceParam) query.set('maxPrice', maxPriceParam);
      if (pageParam) query.set('page', pageParam);

      try {
        const res = await apiGet<ProductResponse>(`/products?${query.toString()}`);
        if (active) setData(res);
      } catch {
        if (active) setData({ products: [], page: 1, totalPages: 1 });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, [q, category, brand, sortParam, inStockParam, productTypeParam, tagParam, minPriceParam, maxPriceParam, pageParam]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Explore Products</h1>
      <form className="grid gap-3 rounded-md bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input name="q" defaultValue={q || ''} placeholder="Search artwork" className="rounded-lg border px-3 py-2" />

        <select name="sort" defaultValue={sortParam || ''} className="rounded-lg border px-3 py-2">
          <option value="">Sort By</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
          <option value="best_selling">Best Selling</option>
          <option value="most_popular">Most Popular</option>
        </select>

        <select name="category" defaultValue={category || ''} className="rounded-lg border px-3 py-2">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>

        <select name="brand" defaultValue={brand || ''} className="rounded-lg border px-3 py-2">
          <option value="">All Brands</option>
          {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>

        <select name="productType" defaultValue={productTypeParam || ''} className="rounded-lg border px-3 py-2">
          <option value="">All Product Types</option>
          {productTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
        </select>

        <select name="tag" defaultValue={tagParam || ''} className="rounded-lg border px-3 py-2">
          <option value="">All Collections / Tags</option>
          {tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select name="inStock" defaultValue={inStockParam || ''} className="rounded-lg border px-3 py-2">
          <option value="">Availability</option>
          <option value="true">In Stock</option>
          <option value="false">Out of Stock</option>
        </select>

        <div className="flex gap-2 items-center">
          <input name="minPrice" type="number" placeholder="Min ₹" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
          <span>-</span>
          <input name="maxPrice" type="number" placeholder="Max ₹" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>

        <button className="rounded-lg bg-foreground hover:bg-black px-4 py-2 font-semibold text-white lg:col-span-4">Apply Filters</button>
      </form>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <ProductGrid products={data.products} />
          <p className="text-sm text-slate-500">Page {data.page} of {data.totalPages}</p>
        </>
      )}
    </div>
  );
}

export default function ProductListing() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ProductListingContent />
    </Suspense>
  );
}
