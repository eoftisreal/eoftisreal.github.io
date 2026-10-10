import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuthToken, clearAuth } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';

const linkClass = 'text-sm font-medium text-secondary-text hover:text-foreground transition-colors tracking-wide';

export default function Header() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fetchCart = useCartStore(state => state.fetchCart);
  const clearLocalCart = useCartStore(state => state.clearLocalCart);
  const cartItemCount = useCartStore(state => state.items.reduce((total, item) => total + item.quantity, 0));

  const fetchWishlist = useWishlistStore(state => state.fetchWishlist);
  const clearLocalWishlist = useWishlistStore(state => state.clearLocalWishlist);
  const wishlistItemCount = useWishlistStore(state => state.items.length);

  useEffect(() => {
    // If the user navigates away from the checkout page (e.g., clicks a header link), clear any active direct checkout draft
    const handleBeforeUnload = () => {
       if (window.location.pathname !== '/checkout') {
          sessionStorage.removeItem('directCheckoutDraft');
       }
    };
    handleBeforeUnload(); // Check on mount
    window.addEventListener('popstate', handleBeforeUnload);
    return () => window.removeEventListener('popstate', handleBeforeUnload);
  }, [window.location.pathname]);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        try {
          const payload = parseJwt(token);
          setIsAdmin(payload.role === 'admin' || payload.role === 'master_admin');
        } catch (e) {
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };
    checkAuth();

    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  useEffect(() => {
    // Delay loading non-critical data
    const timer = setTimeout(() => {
      fetchCart();
      if (isAuthenticated) {
        fetchWishlist();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchCart, fetchWishlist, isAuthenticated]);

  const handleLogout = () => {
    clearLocalCart();
    clearLocalWishlist();
    clearAuth();
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/auth/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center flex-1">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-foreground focus:outline-none" title="Menu">
              <img src="/icons/menu.png" alt="Menu" className="h-10 w-10 object-contain" loading="eager" />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 md:gap-6 flex-1">
            <Link to="/products" className={linkClass}>Shop</Link>
            <Link to="/products?tag=Collections" className={linkClass}>Collections</Link>
            <Link to="/about" className={linkClass}>About</Link>
          </nav>

          <Link to="/" className="flex justify-center shrink-0 w-auto">
            <img
              src="/logo.png"
              alt="Kapda Kraft"
              className="h-8 md:h-10 w-auto object-contain mix-blend-multiply"
              loading="eager"
            />
          </Link>

          <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1">
            {isAdmin && (
              <Link to="/admin" className={`${linkClass} hidden sm:inline-block`} title="Admin">Admin</Link>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/account" className={`${linkClass} flex items-center`} title="Account">
                  <img src="/icons/user.png" alt="Account" className="h-8 w-8 md:h-10 md:w-10 object-contain" loading="eager" />
                </Link>
                <button onClick={handleLogout} className={`${linkClass} flex items-center`} title="Log Out">
                  <img src="/icons/logout.png" alt="Logout" className="h-8 w-8 md:h-10 md:w-10 object-contain" loading="eager" />
                </button>
              </>
            ) : (
              <Link to="/auth/login" className={`${linkClass} flex items-center`} title="Log In">
                <img src="/icons/login.png" alt="Login" className="h-8 w-8 md:h-10 md:w-10 object-contain" loading="eager" />
              </Link>
            )}
            <Link to="/account#wishlist" className={`${linkClass} flex items-center relative`} title="Wishlist">
              <img src="/icons/user.png" alt="Wishlist" className="h-8 w-8 md:h-10 md:w-10 object-contain opacity-70" loading="eager" />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] font-bold h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center">
                  {wishlistItemCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className={`${linkClass} flex items-center relative`} title="Cart">
              <img src="/icons/cart.png" alt="Cart" className="h-9 w-9 md:h-11 md:w-11 object-contain" loading="eager" />
              {cartItemCount > 0 && (
                <span className="absolute 0 -right-0 bg-foreground text-background text-[10px] font-bold h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col px-4 py-2">
              <Link to="/products" className="py-3 border-b border-border/50 text-sm font-medium text-secondary-text hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
              <Link to="/products?tag=Collections" className="py-3 border-b border-border/50 text-sm font-medium text-secondary-text hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Collections</Link>
              <Link to="/about" className="py-3 text-sm font-medium text-secondary-text hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
