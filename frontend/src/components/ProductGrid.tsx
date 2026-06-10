import type { Product } from '@/lib/api';
import ProductCard from './ProductCard';

type ProductGridProps = {
  products: Product[];
};

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="col-span-full py-16 text-center text-secondary-text">No products found matching your criteria.</p>;
  }

  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
