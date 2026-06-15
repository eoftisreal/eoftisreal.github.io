import { useWishlistStore } from '@/store/wishlist';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WishlistButton({ productId, className = '' }: { productId: string, className?: string }) {
  const { items, add, remove } = useWishlistStore();
  const isWishlisted = items.includes(productId);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if wrapped in a Link
    if (isWishlisted) {
      await remove(productId);
      toast.success('Removed from wishlist');
    } else {
      await add(productId);
      toast.success('Added to wishlist');
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      className={`p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition flex items-center justify-center ${className}`}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={20}
        className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-foreground hover:text-red-500'}`}
      />
    </button>
  );
}
