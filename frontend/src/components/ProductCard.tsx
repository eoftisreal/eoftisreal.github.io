import { Link } from 'react-router-dom';
import type { Product } from '@/lib/api';
import WishlistButton from './WishlistButton';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import toast from 'react-hot-toast';

// Helper function to generate a consistent color based on string content
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page
    e.stopPropagation();
    if (product.stock <= 0) return;

    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    const color = product.colors && product.colors.length > 0 ? product.colors[0] : undefined;

    const result = await addItem({
      productId: product._id,
      title: product.title,
      unitPrice: product.price,
      image: product.images?.[0],
      size,
      color,
      availableStock: product.stock
    });

    if (result.ok) {
      toast.success(`${product.title} added to cart!`);
      return;
    }
    toast.error(result.message || 'Unable to add item to cart');
  };

  const generateSrcSet = (variant: any) => {
    if (!variant || Object.keys(variant).length === 0) return undefined;

    const candidates: { url: string; width: number }[] = [];

    if (variant.thumbnail && typeof variant.thumbnailWidth === 'number' && variant.thumbnailWidth > 0) {
      candidates.push({ url: variant.thumbnail, width: variant.thumbnailWidth });
    }

    if (variant.card && typeof variant.cardWidth === 'number' && variant.cardWidth > 0) {
      candidates.push({ url: variant.card, width: variant.cardWidth });
    }

    if (variant.product && typeof variant.productWidth === 'number' && variant.productWidth > 0) {
      candidates.push({ url: variant.product, width: variant.productWidth });
    }

    if (candidates.length === 0) return undefined;

    // Deduplicate by width
    const uniqueWidths = new Map<number, string>();
    candidates.forEach(c => uniqueWidths.set(c.width, c.url));

    // Sort ascending by width
    const sortedWidths = Array.from(uniqueWidths.entries()).sort((a, b) => a[0] - b[0]);

    return sortedWidths.map(([width, url]) => `${url} ${width}w`).join(', ');
  };

  return (
    <Link to={`/products/${product._id}`} className="group flex flex-col overflow-hidden rounded-md border border-secondary-bg bg-white transition hover:border-border">
      <div className="relative aspect-square bg-secondary-bg overflow-hidden">
        <div className="absolute top-2 right-2 z-20">
          <WishlistButton productId={product._id} />
        </div>
        <img loading="lazy" decoding="async"
          src={product.imageVariants?.[0]?.card || product.images?.[0] || 'https://placehold.co/600x600?text=No+Image'}
          srcSet={generateSrcSet(product.imageVariants?.[0])}
          sizes="(max-width: 1024px) 50vw, 25vw"
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
        <div className="flex flex-col items-start gap-1 flex-grow">
          <h3 className="line-clamp-2 text-sm font-medium text-foreground/90 tracking-normal capitalize">{product.title}</h3>
          {product.productType && (
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white tracking-wider uppercase shadow-sm mt-1"
              style={{ backgroundColor: stringToColor(product.productType) }}
            >
              {product.productType}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium text-foreground">₹{product.price}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? <span className="text-xs text-secondary-text line-through">₹{product.compareAtPrice}</span> : null}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`p-1.5 md:p-2 rounded-full text-white transition-opacity ${
              product.stock <= 0
                ? 'cursor-not-allowed bg-slate-400'
                : 'hover:opacity-90'
            }`}
            style={product.stock <= 0 ? undefined : { backgroundColor: '#e04136' }}
            aria-label="Add to cart"
            title={product.stock <= 0 ? 'Out of stock' : 'Add to cart'}
          >
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
