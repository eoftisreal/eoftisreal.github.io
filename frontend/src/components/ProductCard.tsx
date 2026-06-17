import { Link } from 'react-router-dom';
import type { Product } from '@/lib/api';
import WishlistButton from './WishlistButton';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import toast from 'react-hot-toast';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page
    e.stopPropagation();

    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    const color = product.colors && product.colors.length > 0 ? product.colors[0] : undefined;

    addItem({
      productId: product._id,
      title: product.title,
      unitPrice: product.price,
      image: product.images?.[0],
      size,
      color
    });

    toast.success(`${product.title} added to cart!`);
  };

  return (
    <Link to={`/products/${product._id}`} className="group flex flex-col overflow-hidden rounded-md border border-secondary-bg bg-white transition hover:border-border">
      <div className="relative aspect-square bg-secondary-bg overflow-hidden">
        <div className="absolute top-2 right-2 z-20">
          <WishlistButton productId={product._id} />
        </div>
        <img
          src={product.images?.[0] || 'https://placehold.co/600x600?text=No+Image'}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.compareAtPrice && product.compareAtPrice > product.price ? (
          <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] font-medium text-foreground z-10 border border-secondary-bg">Sale</span>
        ) : null}
        {product.tags && product.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 z-10">
            {product.tags.map((tag, idx) => (
              <span key={idx} className="bg-white/90 text-foreground text-[10px] px-2 py-1 border border-secondary-bg uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2 p-4 flex flex-col flex-grow bg-secondary-bg/20">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground/90 tracking-normal capitalize">{product.title}</h3>
        {product.artistName && <p className="text-xs text-secondary-text flex-grow">{product.artistName}</p>}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium text-foreground">₹{product.price}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? <span className="text-xs text-secondary-text line-through">₹{product.compareAtPrice}</span> : null}
          </div>
          <button
            onClick={handleAddToCart}
            className="p-2 rounded-full text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#b01237' }}
            aria-label="Add to cart"
            title="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
