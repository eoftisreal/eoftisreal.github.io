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

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });

  const handleSaveProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setIsEditingProfile(false);
      } else {
        const data = await res.json();
        alert(`Failed to update profile: ${data.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Failed to update profile', e);
      alert('An error occurred while updating profile.');
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const token = getAuthToken();
        if (token) {
          try {
            const userRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (isMounted) {
                // Ensure we get the actual user object from either { user: ... } or the object itself
                const actualUser = userData.user || userData;
                setUser(actualUser);
                setProfileForm({
                  name: actualUser.name || '',
                  phone: actualUser.phone || '',
                  address: {
                    line1: actualUser.address?.line1 || '',
                    line2: actualUser.address?.line2 || '',
                    city: actualUser.address?.city || '',
                    state: actualUser.address?.state || '',
                    postalCode: actualUser.address?.postalCode || '',
                    country: actualUser.address?.country || ''
                  }
                });
              }
            }
          } catch (e) { console.error('Failed to fetch user'); }

          try {
             const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
             });
             if (ordersRes.ok) {
                 const contentType = ordersRes.headers.get('content-type');
                 if (contentType && contentType.indexOf('application/json') !== -1) {
                     const ordersData = await ordersRes.json();
                     let recentOrders = ordersData.filter((o: any) => o.status !== 'delivered');
                     if (recentOrders.length === 0 && ordersData.length > 0) {
                       recentOrders = [ordersData[0]];
                     }
                     if (isMounted) setOrders(recentOrders.slice(0, 3));
                 } else {
                     console.error('Expected JSON, got', contentType);
                 }
             }
          } catch(e) { console.error('Failed to fetch orders', e); }
        }

        if (wishlistItems.length > 0 && isMounted) {
          // Fetch products for wishlist items
          const promises = wishlistItems.map(id =>
             fetch(`${import.meta.env.VITE_API_URL || '/api'}/products/${id}`).then(res => res.ok ? res.json() : null)
          );
          const results = await Promise.all(promises);
          if (isMounted) setProducts(results.filter(p => p !== null));
        } else {
          if (isMounted) setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching account data', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();

    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
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
               {!isEditingProfile && (
                 <button onClick={() => setIsEditingProfile(true)} className="text-xs text-secondary-text hover:text-foreground">EDIT</button>
               )}
             </div>
             {user && (
               isEditingProfile ? (
                 <div className="space-y-4 text-sm text-secondary-text">
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-foreground">Email / Username (Read-only)</label>
                     <p className="p-2 bg-gray-50 border border-border/50 text-gray-500 rounded">{user.email}</p>
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-foreground">Name</label>
                     <input
                       type="text"
                       value={profileForm.name}
                       onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                       className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                     />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-foreground">Phone</label>
                     <input
                       type="text"
                       value={profileForm.phone}
                       onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                       className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                     />
                   </div>

                   <div className="pt-2">
                     <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Address</h3>
                     <div className="space-y-3">
                       <input
                         type="text"
                         placeholder="Address Line 1"
                         value={profileForm.address.line1}
                         onChange={e => setProfileForm({ ...profileForm, address: { ...profileForm.address, line1: e.target.value } })}
                         className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                       />
                       <input
                         type="text"
                         placeholder="Address Line 2 (Optional)"
                         value={profileForm.address.line2}
                         onChange={e => setProfileForm({ ...profileForm, address: { ...profileForm.address, line2: e.target.value } })}
                         className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                       />
                       <div className="grid grid-cols-2 gap-3">
                         <input
                           type="text"
                           placeholder="City"
                           value={profileForm.address.city}
                           onChange={e => setProfileForm({ ...profileForm, address: { ...profileForm.address, city: e.target.value } })}
                           className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                         />
                         <input
                           type="text"
                           placeholder="State"
                           value={profileForm.address.state}
                           onChange={e => setProfileForm({ ...profileForm, address: { ...profileForm.address, state: e.target.value } })}
                           className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                         />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <input
                           type="text"
                           placeholder="Postal Code"
                           value={profileForm.address.postalCode}
                           onChange={e => setProfileForm({ ...profileForm, address: { ...profileForm.address, postalCode: e.target.value } })}
                           className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                         />
                         <input
                           type="text"
                           placeholder="Country"
                           value={profileForm.address.country}
                           onChange={e => setProfileForm({ ...profileForm, address: { ...profileForm.address, country: e.target.value } })}
                           className="w-full p-2 border border-border/50 focus:border-foreground outline-none rounded"
                         />
                       </div>
                     </div>
                   </div>

                   <div className="flex space-x-3 pt-2">
                     <button onClick={handleSaveProfile} className="flex-1 bg-foreground text-white py-2 text-xs uppercase tracking-wider hover:bg-black transition-colors">
                       Save
                     </button>
                     <button onClick={() => {
                        setIsEditingProfile(false);
                        // Reset form
                        setProfileForm({
                          name: user.name || '',
                          phone: user.phone || '',
                          address: {
                            line1: user.address?.line1 || '',
                            line2: user.address?.line2 || '',
                            city: user.address?.city || '',
                            state: user.address?.state || '',
                            postalCode: user.address?.postalCode || '',
                            country: user.address?.country || ''
                          }
                        });
                     }} className="flex-1 border border-border py-2 text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors">
                       Cancel
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-2 text-sm text-secondary-text">
                   <p><span className="font-medium text-foreground">Name:</span> {user.name || 'Not provided'}</p>
                   <p><span className="font-medium text-foreground">Email:</span> {user.email}</p>
                   {user.phone && <p><span className="font-medium text-foreground">Phone:</span> {user.phone}</p>}
                   {user.address && (user.address.line1 || user.address.city || user.address.country) && (
                     <div className="pt-2">
                       <span className="font-medium text-foreground block mb-1">Address:</span>
                       <p className="leading-relaxed">
                         {user.address.line1} {user.address.line2 && `, ${user.address.line2}`}<br/>
                         {user.address.city && user.address.city}{user.address.state && `, ${user.address.state}`} {user.address.postalCode}<br/>
                         {user.address.country}
                       </p>
                     </div>
                   )}
                 </div>
               )
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
                       <p className="font-medium text-foreground">Order #{order.orderNumber || (order._id && order._id.slice(-6).toUpperCase())}</p>
                       <p className="text-xs text-secondary-text mt-1">{new Date(order.createdAt).toLocaleDateString('en-GB')} • ₹{order.total || 0}</p>
                       <p className="text-xs mt-1">Status: <span className="font-medium uppercase tracking-wider">{order.status ? order.status.replace('_', ' ') : 'Unknown'}</span></p>
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
