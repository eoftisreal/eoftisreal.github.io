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
  const { items, fetchCart, clearLocalCart } = useCartStore();
  const { items: wishlistItems, fetchWishlist, clearLocalWishlist } = useWishlistStore();
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  const wishlistItemCount = wishlistItems.length;

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        const payload = parseJwt(token);
        if (payload && (payload.role === 'admin' || payload.role === 'master_admin' || payload.isAdmin)) {
          setIsAdmin(true);
        } else {
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
    fetchCart();
    fetchWishlist();
  }, [fetchCart, fetchWishlist, isAuthenticated]);

  const handleLogout = () => {
    clearAuth();
    clearLocalCart();
    clearLocalWishlist();
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <>
      <div className="bg-foreground text-white text-[11px] font-medium tracking-widest uppercase py-2 overflow-hidden flex whitespace-nowrap group">
        <div className="animate-marquee group-hover:[animation-play-state:paused] flex min-w-full shrink-0 items-center justify-around gap-8">
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-4">
          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center flex-1">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-foreground focus:outline-none" title="Menu">
              <img src="/icons/menu.png" alt="Menu" className="h-10 w-10 object-contain" loading="eager" fetchPriority="high" />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 md:gap-6 flex-1">
            <Link to="/products" className={linkClass}>Shop</Link>
            <Link to="/products?category=Collections" className={linkClass}>Collections</Link>
            <Link to="/about" className={linkClass}>About</Link>
          </nav>

          <Link to="/" className="flex justify-center shrink-0 w-auto">
            <img
              src="/logo.png"
              alt="Kapda Kraft"
              className="h-8 md:h-10 w-auto object-contain mix-blend-multiply"
              loading="eager" fetchPriority="high"
        />
          </Link>

          <nav className="flex items-center justify-end gap-4 md:gap-6 flex-1">
            {isAdmin && (
              <Link to="/admin" className={`${linkClass} hidden sm:inline-block`} title="Admin">Admin</Link>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/account" className={`${linkClass} flex items-center`} title="Account">
                  <img src="/icons/user.png" alt="Account" className="h-9 w-9 md:h-11 md:w-11 object-contain" loading="eager" fetchPriority="high" />
                </Link>
                <button onClick={handleLogout} className={`${linkClass} hidden sm:flex items-center`} title="Logout">
                  <img src="/icons/logout.png" alt="Logout" className="h-9 w-9 md:h-11 md:w-11 object-contain" loading="eager" fetchPriority="high" />
                </button>
              </>
            ) : (
              <Link to="/auth/login" className={`${linkClass} flex items-center`} title="Log In">
                <img src="/icons/login.png" alt="Log In" className="h-9 w-9 md:h-11 md:w-11 object-contain" loading="eager" fetchPriority="high" />
              </Link>
            )}
            <Link to="/account#wishlist" className={`${linkClass} flex items-center relative`} title="Wishlist">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart h-[22px] w-[22px] md:h-7 md:w-7"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-foreground text-white text-[10px] font-bold h-4 min-w-[16px] flex items-center justify-center rounded-full px-1">
                  {wishlistItemCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className={`${linkClass} flex items-center relative`} title="Cart">
              <img src="/icons/cart.png" alt="Cart" className="h-9 w-9 md:h-11 md:w-11 object-contain" loading="eager" fetchPriority="high" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-foreground text-white text-[10px] font-bold h-4 min-w-[16px] flex items-center justify-center rounded-full px-1">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col px-4 py-2">
              <Link to="/products" className="py-3 border-b border-border/50 text-sm font-medium text-secondary-text hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
              <Link to="/products?category=Collections" className="py-3 border-b border-border/50 text-sm font-medium text-secondary-text hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Collections</Link>
              <Link to="/about" className="py-3 text-sm font-medium text-secondary-text hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
