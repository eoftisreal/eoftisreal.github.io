'use client';

import { FormEvent, useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const apiBase = import.meta.env.VITE_API_URL || '/api';

interface ProductFormProps {
  onSuccess?: () => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artistName, setArtistName] = useState('');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState(0);

  const [isFeatured, setIsFeatured] = useState(false);
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [enableSizes, setEnableSizes] = useState(false);
  const [sizes, setSizes] = useState('');
  const [enableColors, setEnableColors] = useState(false);
  const [colors, setColors] = useState('');
  const [minDeliveryDays, setMinDeliveryDays] = useState('');
  const [maxDeliveryDays, setMaxDeliveryDays] = useState('');

  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [brands, setBrands] = useState<{_id: string, name: string}[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tags, setTags] = useState('');

  useEffect(() => {
    async function fetchOptions() {
      try {
        const token = getAuthToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const [catsRes, brsRes, tagsRes] = await Promise.all([
          fetch(`${apiBase}/master/categories`, { headers }),
          fetch(`${apiBase}/master/brands`, { headers }),
          fetch(`${apiBase}/products/tags`)
        ]);

        if (catsRes.ok) setCategories(await catsRes.json());
        if (brsRes.ok) setBrands(await brsRes.json());
        if (tagsRes.ok) setAvailableTags(await tagsRes.json());
      } catch (e) {
        console.error('Error fetching categories/brands/tags', e);
      }
    }
    fetchOptions();
  }, []);
  const [stock, setStock] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [r2ImageKeys, setR2ImageKeys] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  async function handleImageUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploadingImage(true);
    const token = getAuthToken();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'admin/product-images');

      const res = await fetch(`${apiBase}/admin/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });

      const body = await res.json();
      if (res.ok) {
        setImages(prev => [...prev, body.url]);
        setR2ImageKeys(prev => [...prev, body.key || '']);
        setFile(null);
        setMessage(''); // Clear any previous error messages on success
      } else {
        setMessage(body.message || 'Image upload failed');
        // Do NOT setFile(null) so they can try again or see why it failed
      }
    } catch (e: any) {
      setMessage(e.message || 'Image upload failed due to network error');
    } finally {
      setUploadingImage(false);
    }
  }

  function handleAddImageUrl() {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setR2ImageKeys(prev => [...prev, '']);
      setNewImageUrl('');
    }
  }

  function handleRemoveImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
    setR2ImageKeys(prev => prev.filter((_, i) => i !== index));
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      const payload = {
        title,
        description,
        artistName,
        productType,
        category,
        brand: brand || undefined,
        price,
        compareAtPrice: compareAtPrice || undefined,
        stock,
        images,
        r2ImageKeys,
        tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        isFeatured,
        isCustomizable,
        enableSizes,
        sizes: sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        enableColors,
        colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        minDeliveryDays: minDeliveryDays ? Number(minDeliveryDays) : undefined,
        maxDeliveryDays: maxDeliveryDays ? Number(maxDeliveryDays) : undefined,
      };

      const response = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (response.ok) {
        setMessage('Product created successfully!');
        setTitle('');
        setDescription('');
        setArtistName('');
        setCategory('');
        setBrand('');
        setPrice(0);
        setCompareAtPrice(0);
        setStock(0);
        setIsFeatured(false);
        setImages([]);
        setR2ImageKeys([]);
        if (onSuccess) onSuccess();
      } else {
        setMessage(body.message || 'Failed to create product');
      }
    } catch {
      setMessage('Failed to create product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md bg-white p-6 space-y-6">
      <h2 className="font-bold text-xl border-b pb-2">Add New Product</h2>

      {/* Product Images Section */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold">1. Product Images</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded border aspect-square overflow-hidden bg-slate-50">
              <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 bg-foreground text-white rounded p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-4 p-4 bg-slate-50 rounded">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Add Image URL (Cloudflare R2, etc)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                className="flex-1 rounded border px-3 py-1.5 text-sm"
                placeholder="https://..."
              />
              <button type="button" onClick={handleAddImageUrl} className="rounded bg-slate-800 text-white px-3 py-1.5 text-sm">Add</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Or Upload File</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="text-sm text-slate-500 w-full file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-foreground/10 file:text-foreground"
              />
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={!file || uploadingImage}
                className="rounded bg-foreground hover:bg-black px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploadingImage ? '...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Section */}
      <form onSubmit={submitProduct} className="space-y-4">
        <h3 className="font-semibold">2. Product Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <div className="bg-white rounded overflow-hidden prose-sm">
            <ReactQuill theme="snow" value={description} onChange={setDescription} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Artist Name</label>
          <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Product Type</label>
          <input type="text" value={productType} onChange={e => setProductType(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g. Original, Print, Sculpture" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
              <option value="">Select a category</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand (Optional)</label>
            <select value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
              <option value="">None / Unknown</option>
              {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags (comma separated, e.g. "20% OFF, Bestseller")</label>
          <input type="text" list="tagSuggestions" value={tags} onChange={e => setTags(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g. 20% OFF, New Arrival" />
          <datalist id="tagSuggestions">
            {availableTags.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
            <input type="number" required min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Compare At Price (₹)</label>
            <input type="number" min="0" value={compareAtPrice} onChange={e => setCompareAtPrice(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" min="0" value={stock} onChange={e => setStock(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Delivery Days</label>
            <input type="number" min="1" value={minDeliveryDays} onChange={e => setMinDeliveryDays(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g. 3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Delivery Days</label>
            <input type="number" min="1" value={maxDeliveryDays} onChange={e => setMaxDeliveryDays(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g. 5" />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="enableSizes" checked={enableSizes} onChange={e => setEnableSizes(e.target.checked)} className="rounded border-gray-300 text-foreground focus:ring-foreground" />
            <label htmlFor="enableSizes" className="text-sm font-medium text-gray-700">Enable Size Selector</label>
          </div>
          {enableSizes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated)</label>
              <input value={sizes} onChange={e => setSizes(e.target.value)} placeholder="S, M, L, XL" className="w-full rounded border px-3 py-2 text-sm" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="enableColors" checked={enableColors} onChange={e => setEnableColors(e.target.checked)} className="rounded border-gray-300 text-foreground focus:ring-foreground" />
            <label htmlFor="enableColors" className="text-sm font-medium text-gray-700">Enable Color Selector</label>
          </div>
          {enableColors && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colors (comma separated)</label>
              <input value={colors} onChange={e => setColors(e.target.value)} placeholder="Red, Blue, Green" className="w-full rounded border px-3 py-2 text-sm" />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 pt-4 border-t">
            <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded border-gray-300 text-foreground focus:ring-foreground" />
            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Showcase on Home Page (Featured)</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isCustomizable" checked={isCustomizable} onChange={e => setIsCustomizable(e.target.checked)} className="rounded border-gray-300 text-foreground focus:ring-foreground" />
            <label htmlFor="isCustomizable" className="text-sm font-medium text-gray-700">Custom Product (Requires user image upload)</label>
          </div>
        </div>

        <button disabled={loading} className="w-full rounded bg-foreground hover:bg-black px-4 py-2 font-semibold text-white disabled:opacity-50 mt-4">
          {loading ? 'Creating Product...' : 'Create Product'}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-center font-medium">{message}</p>}
    </div>
  );
}
