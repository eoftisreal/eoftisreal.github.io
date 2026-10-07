'use client';

import { useCartStore } from '@/store/cart';
import toast from 'react-hot-toast';

type Props = {
  productId: string;
  title: string;
  price: number;
  stock?: number;
  image?: string;
  customImage?: string;
  size?: string;
  color?: string;
};

export default function AddToCartButton({ productId, title, price, stock, image, customImage, size, color }: Props) {
  const { addItem } = useCartStore();
  const isOutOfStock = typeof stock === 'number' ? stock <= 0 : false;

  return (
    <button
      onClick={() => {
        if (isOutOfStock) return;
        addItem({ productId, title, unitPrice: price, image, customImage, size, color });
        toast.success(`${title} added to cart!`);
      }}
      disabled={isOutOfStock}
      className={`inline-block rounded-full px-6 py-3 font-semibold text-white transition-colors ${
        isOutOfStock
          ? 'cursor-not-allowed bg-slate-400'
          : 'cursor-pointer bg-foreground hover:bg-black'
      }`}
    >
      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
    </button>
  );
}
