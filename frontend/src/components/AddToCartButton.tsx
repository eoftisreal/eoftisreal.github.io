'use client';

import { useCartStore } from '@/store/cart';
import toast from 'react-hot-toast';
import { normalizeStock } from '@/lib/stock';

type Props = {
  productId: string;
  title: string;
  price: number;
  stock: number | string | null | undefined;
  image?: string;
  customImage?: string;
  size?: string;
  color?: string;
};

export default function AddToCartButton({ productId, title, price, stock, image, customImage, size, color }: Props) {
  const { addItem } = useCartStore();

  const availableStock = normalizeStock(stock);
  const isOutOfStock = availableStock === undefined || availableStock === 0;

  return (
    <button
      disabled={isOutOfStock}
      onClick={async () => {
        if (isOutOfStock) return;

        const result = await addItem({
          productId,
          title,
          unitPrice: price,
          image,
          customImage,
          size,
          color,
          availableStock,
        });

        if (result.ok) {
          toast.success(`${title} added to cart!`);
        } else {
          toast.error(result.message || 'Unable to add item to cart');
        }
      }}
      className={`inline-block rounded-full px-6 py-3 font-semibold text-white transition-colors ${
        isOutOfStock
          ? 'cursor-not-allowed bg-slate-400 opacity-50'
          : 'cursor-pointer bg-foreground hover:bg-black'
      }`}
    >
      {availableStock === undefined
        ? 'Stock unavailable'
        : isOutOfStock
          ? 'Out of Stock'
          : 'Add to Cart'}
    </button>
  );
}
