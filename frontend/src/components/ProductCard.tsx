import { Link } from 'react-router-dom';
import type { Product } from '@/lib/api';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product._id}`} className="group flex flex-col overflow-hidden rounded-md border border-secondary-bg bg-white transition hover:border-border">
      <div className="relative aspect-square bg-secondary-bg overflow-hidden">
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
      <div className="space-y-1 p-4 flex flex-col flex-grow">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">{product.title}</h3>
        <p className="text-xs text-secondary-text mb-2 flex-grow">{product.artistName}</p>
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-sm font-medium text-foreground">₹{product.price}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? <span className="text-xs text-secondary-text line-through">₹{product.compareAtPrice}</span> : null}
        </div>
      </div>
    </Link>
  );
}
