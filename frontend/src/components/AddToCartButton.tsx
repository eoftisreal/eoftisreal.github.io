'use client';

import { useCartStore } from '@/store/cart';
import toast from 'react-hot-toast';

type Props = {
  productId: string;
  title: string;
  price: number;
  image?: string;
  customImage?: string;
};

export default function AddToCartButton({ productId, title, price, image, customImage }: Props) {
  const { addItem } = useCartStore();

  return (
    <button
      onClick={() => {
        addItem({ productId, title, unitPrice: price, image, customImage });
        toast.success(`${title} added to cart!`);
      }}
      className="inline-block rounded-full bg-foreground px-6 py-3 font-semibold text-white cursor-pointer hover:bg-black transition-colors"
    >
      Add to Cart
    </button>
  );
}
