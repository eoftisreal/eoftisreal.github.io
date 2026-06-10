import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 bg-secondary-bg text-secondary-text border-t border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <img
            src="https://pub-8c7eefa9a8044a569bef9e3d0b743d59.r2.dev/web%20logo.png"
            alt="Kapda Kraft"
            className="h-10 object-contain mix-blend-multiply opacity-80"
          />
          <p className="text-sm">
            Curated collections designed for the modern aesthetic. Redefining minimal luxury.
          </p>
        </div>

        <div>
          <h4 className="font-heading font-bold text-foreground text-lg mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
            <li><Link to="/products?category=Collections" className="hover:text-foreground transition-colors">Collections</Link></li>
            <li><Link to="/products?category=New Arrivals" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-bold text-foreground text-lg mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            <li><Link to="/shipping" className="hover:text-foreground transition-colors">Shipping & Returns</Link></li>
            <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-bold text-foreground text-lg mb-4">Newsletter</h4>
          <p className="text-sm mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
          <form className="flex border border-border rounded-md overflow-hidden" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="w-full px-4 py-2 bg-white outline-none text-sm text-foreground" />
            <button type="submit" className="bg-foreground text-white px-4 py-2 text-xs tracking-widest uppercase font-medium hover:bg-black transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-border px-4 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center text-xs">
        <p>© {new Date().getFullYear()} Kapda Kraft. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
