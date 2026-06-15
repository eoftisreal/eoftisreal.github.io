import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiGet, Product } from '@/lib/api';
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
    async function loadData() {
      try {
        const token = getAuthToken();
        if (token) {
          const userRes = await apiGet<any>('/auth/me');
          setUser(userRes);

          try {
             const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/orders/my-orders`, {
                headers: { Authorization: `Bearer ${token}` }
             });
             if (ordersRes.ok) {
                 const ordersData = await ordersRes.json();
                 setOrders(ordersData.slice(0, 3)); // show only recent 3
             }
          } catch(e) { console.error('Failed to fetch orders'); }
        }

        if (wishlistItems.length > 0) {
          // Fetch products for wishlist items
          const promises = wishlistItems.map(id =>
             fetch(`${import.meta.env.VITE_API_URL || '/api'}/products/${id}`).then(res => res.ok ? res.json() : null)
          );
          const results = await Promise.all(promises);
          setProducts(results.filter(p => p !== null));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching account data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
             <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-border pb-2">Profile Details</h2>
             {user ? (
               <div className="space-y-2 text-sm text-secondary-text">
                 <p><span className="font-medium text-foreground">Name:</span> {user.name || 'Not provided'}</p>
                 <p><span className="font-medium text-foreground">Email:</span> {user.email}</p>
                 <p><span className="font-medium text-foreground">Role:</span> <span className="uppercase">{user.role}</span></p>
               </div>
             ) : (
               <p className="text-sm text-secondary-text">You are currently using a guest session.</p>
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
                       <p className="text-xs text-secondary-text mt-1">{new Date(order.createdAt).toLocaleDateString('en-GB')} • ₹{order.totalAmount}</p>
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
