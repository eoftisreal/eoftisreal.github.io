import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Product } from '@/lib/api';
import { useWishlistStore } from '@/store/wishlist';
import ProductGrid from '@/components/ProductGrid';
import { getAuthToken } from '@/lib/storage';

export default function AccountPage() {
  const { items: wishlistItems, fetchWishlist } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountData() {
      try {
        const token = getAuthToken();
        if (token) {
          try {
            const userRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (isMounted) setUser(userData);
            }
          } catch (e) { console.error('Failed to fetch user'); }

          try {
             const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
             });
             if (ordersRes.ok) {
                 const ordersData = await ordersRes.json();
                 let recentOrders = ordersData.filter((o: any) => o.status !== 'delivered');
                 if (recentOrders.length === 0 && ordersData.length > 0) {
                   recentOrders = [ordersData[0]];
                 }
                 if (isMounted) setOrders(recentOrders.slice(0, 3));
             }
          } catch(e) { console.error('Failed to fetch orders', e); }
        }
      } catch (error) {
        console.error('Error fetching account data', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAccountData();

    const onFocus = () => loadAccountData();
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadWishlistProducts() {
      if (wishlistItems.length > 0) {
        try {
          const promises = wishlistItems.map(id =>
             fetch(`${import.meta.env.VITE_API_URL || '/api'}/products/${id}`).then(res => res.ok ? res.json() : null)
          );
          const results = await Promise.all(promises);
          if (isMounted) setProducts(results.filter(p => p !== null));
        } catch (error) {
          console.error('Error fetching wishlist products', error);
        }
      } else {
        if (isMounted) setProducts([]);
      }
    }
    loadWishlistProducts();

    return () => {
      isMounted = false;
    };
  }, [wishlistItems]);

  if (loading) return <div className="py-10 text-center">Loading account...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider">Your Account</h1>
          {user && (
            <p className="text-secondary-text mt-2 text-sm">
              Welcome back, {user.name || user.email}!
            </p>
          )}
        </div>
        <Link to="/orders" className="text-sm border border-foreground bg-foreground text-white hover:bg-white hover:text-foreground px-4 py-2 transition-colors">
          VIEW ALL ORDERS
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
           <div className="border border-border p-6 bg-white">
                          <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
               <h2 className="text-sm font-bold uppercase tracking-widest">Profile Details</h2>
                              <button onClick={() => alert('Profile editing is currently available during checkout. Standalone profile editing coming soon.')} className="text-xs text-secondary-text hover:text-foreground">EDIT</button>
             </div>
             {user && (
               <div className="space-y-2 text-sm text-secondary-text">
                 <p><span className="font-medium text-foreground">Name:</span> {user.name || 'Not provided'}</p>
                 <p><span className="font-medium text-foreground">Email:</span> {user.email}</p>
               </div>
             )}
           </div>

           {user && (
             <div className="border border-border p-6 bg-white">
               <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-border pb-2">Recent Orders</h2>
               {orders.length === 0 ? (
                 <p className="text-sm text-secondary-text">No orders found.</p>
               ) : (
                 <div className="space-y-4">
                   {orders.map(order => (
                     <div key={order._id} className="text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                       <p className="font-medium text-foreground">Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}</p>
                       <p className="text-xs text-secondary-text mt-1">{new Date(order.createdAt).toLocaleDateString('en-GB')} • ₹{order.total}</p>
                       <p className="text-xs mt-1">Status: <span className="font-medium uppercase tracking-wider">{order.status}</span></p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
        </div>

        <div className="md:col-span-2 space-y-6" id="wishlist">
          <div className="border border-border p-6 bg-white">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
               <h2 className="text-sm font-bold uppercase tracking-widest">My Wishlist ({products.length})</h2>
            </div>

            {products.length === 0 ? (
               <p className="text-secondary-text text-sm py-4">Your wishlist is currently empty. Start saving items you love!</p>
            ) : (
               <ProductGrid products={products} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
