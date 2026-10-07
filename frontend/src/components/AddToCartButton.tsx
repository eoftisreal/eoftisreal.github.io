'use client';

import { useCartStore } from '@/store/cart';
import toast from 'react-hot-toast';

type Props = {
  productId: string;
  title: string;
  price: number;
  stock?: number | string | null;
  image?: string;
  customImage?: string;
  size?: string;
  color?: string;
};

export default function AddToCartButton({ productId, title, price, stock, image, customImage, size, color }: Props) {
  const { addItem } = useCartStore();

  const isOutOfStock = Number(stock) <= 0;
  const availableStock = !Number.isNaN(Number(stock)) ? Number(stock) : undefined;

  return (
    <button
      onClick={() => {
        if (isOutOfStock) return;
        addItem({ productId, title, unitPrice: price, image, customImage, size, color, availableStock }).then((result) => {
          if (result.ok) {
            toast.success(`${title} added to cart!`);
            return;
          }
          toast.error(result.message || 'Unable to add item to cart');
        });
      }}
      disabled={isOutOfStock}
      className={`inline-block rounded-full px-6 py-3 font-semibold text-white transition-colors ${
        isOutOfStock
          ? 'cursor-not-allowed bg-slate-400 disabled:cursor-not-allowed disabled:opacity-50'
          : 'cursor-pointer bg-foreground hover:bg-black'
      }`}
    >
      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
    </button>
  );
}
