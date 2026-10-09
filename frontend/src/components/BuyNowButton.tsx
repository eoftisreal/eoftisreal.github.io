'use client';

import { normalizeStock } from '@/lib/stock';
import { useState } from 'react';
import BuyNowDrawer from './BuyNowDrawer';
import { Product } from '@/lib/api';

type Props = {
  product: Product;
  customImage?: string;
  size?: string;
  color?: string;
  className?: string;
};

export default function BuyNowButton({ product, customImage, size, color, className = '' }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const availableStock = normalizeStock(product.stock);
  const isUnavailable = availableStock === undefined || availableStock <= 0;

  return (
    <>
      <button
        type="button"
        disabled={isUnavailable}
        onClick={() => {
          if (isUnavailable) return;
          setIsDrawerOpen(true);
        }}
        className={`inline-block rounded-full px-6 py-3 font-semibold ${
          isUnavailable
            ? 'bg-slate-200 text-slate-400 opacity-40 cursor-not-allowed'
            : 'bg-foreground text-background hover:bg-black transition-colors'
        } ${className}`}
      >
        Buy Now
      </button>

      {isDrawerOpen && (
        <BuyNowDrawer
          product={product}
          customImage={customImage}
          size={size}
          color={color}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </>
  );
}
