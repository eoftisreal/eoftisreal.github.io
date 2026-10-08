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
  const isUnavailable = availableStock === undefined || availableStock <= 0;

  return (
    <button
      type="button"
      disabled={isUnavailable}
      onClick={async () => {
        if (isUnavailable) return;

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

        if (!result.ok) {
          toast.error(result.message || 'Unable to add item');
          return;
        }

        toast.success(`${title} added to cart!`);
      }}
      className={`inline-block rounded-full px-6 py-3 font-semibold text-white ${
        isUnavailable
          ? 'bg-slate-400 opacity-40 cursor-not-allowed'
          : 'bg-foreground hover:bg-black transition-colors'
      }`}
      style={
        isUnavailable
          ? {
              animation: 'none',
              transition: 'none',
              transform: 'none',
            }
          : undefined
      }
    >
      {availableStock === undefined
        ? 'Stock unavailable'
        : isUnavailable
          ? 'Out of Stock'
          : 'Add to Cart'}
    </button>
  );
}
