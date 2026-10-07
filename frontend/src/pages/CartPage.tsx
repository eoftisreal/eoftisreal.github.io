import Cart from '@/components/Cart';
import SEO from '@/components/SEO';

export default function CartPage() {
  return (
    <>
      <SEO
        title="Your Cart"
        description="Review items in your cart and continue to checkout."
        url="https://kapdakraft.live/cart"
        canonical="https://kapdakraft.live/cart"
      />
      <Cart />
    </>
  );
}
