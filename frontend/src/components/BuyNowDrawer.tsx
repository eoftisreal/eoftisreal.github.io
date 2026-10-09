'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { Product } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { normalizeStock } from '@/lib/stock';
import toast from 'react-hot-toast';

type Props = {
  product: Product;
  customImage?: string;
  size?: string;
  color?: string;
  onClose: () => void;
};

export default function BuyNowDrawer({ product, customImage, size, color, onClose }: Props) {
  const navigate = useNavigate();
  const cartStore = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  const availableStock = normalizeStock(product.stock) || 0;
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus management
    const focusable = drawerRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable && focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleUpdateSelectedQuantity = (delta: number) => {
    const newQuantity = selectedQuantity + delta;
    if (newQuantity < 1) return;
    if (newQuantity > availableStock) {
      toast.error(`Only ${availableStock} in stock`);
      return;
    }
    setSelectedQuantity(newQuantity);
  };

  const handleBuyOnlyThis = () => {
    const draftItem = {
      productId: product._id,
      title: product.title,
      quantity: selectedQuantity,
      unitPrice: product.price,
      image: product.images?.[0],
      customImage,
      size: product.enableSizes ? size : undefined,
      color: product.enableColors ? color : undefined,
      product: product // Keep full product info for checkout summary
    };
    sessionStorage.setItem('directCheckoutDraft', JSON.stringify([draftItem]));
    navigate('/checkout');
  };

  const handleBuyAll = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Check if total quantity exceeds stock across ALL variants of this product in cart
    let existingTotalQuantity = 0;
    cartStore.items.forEach(item => {
      if (item.productId === product._id) {
        existingTotalQuantity += item.quantity;
      }
    });

    if (existingTotalQuantity + selectedQuantity > availableStock) {
       toast.error(`Cannot add. Only ${availableStock} in stock total for this product.`);
       setIsProcessing(false);
       return;
    }

    // Check if exact variant exists
    const existingItem = cartStore.items.find(item =>
      item.productId === product._id &&
      (!product.enableSizes || item.size === size) &&
      (!product.enableColors || item.color === color) &&
      item.customImage === customImage
    );
    const existingVariantQuantity = existingItem ? existingItem.quantity : 0;

    const result = await cartStore.addItem({
      productId: product._id,
      title: product.title,
      unitPrice: product.price,
      image: product.images?.[0],
      customImage,
      size: product.enableSizes ? size : undefined,
      color: product.enableColors ? color : undefined,
      availableStock,
    });

    if (!result.ok) {
       toast.error(result.message || 'Unable to add item to cart');
       setIsProcessing(false);
       return;
    }

    const quantityToAdd = selectedQuantity;
    if (quantityToAdd > 1) {
       await cartStore.fetchCart();
       const latestStore = useCartStore.getState();
       const addedItem = latestStore.items.find(item =>
         item.productId === product._id &&
         (!product.enableSizes || item.size === size) &&
         (!product.enableColors || item.color === color) &&
         item.customImage === customImage
       );
       if (addedItem) {
           const targetQuantity = existingVariantQuantity + selectedQuantity;
           const updateResult = await latestStore.updateQuantity(addedItem.productId, addedItem.size, addedItem.color, targetQuantity);
           if (!updateResult.ok) {
               toast.error(updateResult.message || 'Unable to update cart quantity');
               setIsProcessing(false);
               return;
           }
       }
    }

    navigate('/checkout');
  };

  const selectedItemTotal = product.price * selectedQuantity;
  const cartSubtotal = cartStore.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const combinedTotal = selectedItemTotal + cartSubtotal;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-now-title"
    >
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        className="relative z-50 w-full md:w-[450px] bg-background shadow-xl flex flex-col h-full transform transition-transform duration-300"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-white">
          <h2 id="buy-now-title" className="font-heading font-bold text-xl text-foreground">Ready to checkout?</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Selected Product */}
          <div className="bg-white p-4 rounded-xl border border-foreground ring-1 ring-foreground/20">
            <div className="flex gap-4">
              <div className="w-20 h-20 shrink-0 bg-secondary-bg rounded-lg overflow-hidden">
                {customImage ? (
                  <img src={customImage} alt="Custom" className="w-full h-full object-cover" />
                ) : product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                <div className="mt-1 text-sm text-secondary-text">
                  {product.enableSizes && size && <span className="mr-3">Size: {size}</span>}
                  {product.enableColors && color && <span>Color: {color}</span>}
                </div>
                <div className="mt-2 font-semibold text-foreground">
                  ₹{product.price}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center border border-border rounded-lg overflow-hidden h-9">
                <button
                  onClick={() => handleUpdateSelectedQuantity(-1)}
                  disabled={selectedQuantity <= 1 || isProcessing}
                  className="w-9 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground inset-ring"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <div className="w-10 text-center text-sm font-medium" aria-live="polite">
                  {selectedQuantity}
                </div>
                <button
                  onClick={() => handleUpdateSelectedQuantity(1)}
                  disabled={selectedQuantity >= availableStock || isProcessing}
                  className="w-9 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground inset-ring"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Existing Cart */}
          {cartStore.items.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-4">
                Also in your cart &middot; {cartStore.items.reduce((total, item) => total + item.quantity, 0)} items
              </h3>
              <div className="space-y-4">
                {cartStore.items.map(item => (
                  <div key={`${item.productId}-${item.size || ''}-${item.color || ''}`} className="flex gap-4">
                    <div className="w-16 h-16 shrink-0 bg-secondary-bg rounded-lg overflow-hidden">
                      {item.customImage ? (
                        <img src={item.customImage} alt="Custom" className="w-full h-full object-cover" />
                      ) : item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-foreground truncate">{item.title}</h4>
                        <div className="text-xs text-secondary-text mt-0.5">
                          {item.size && <span className="mr-2">Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded-md overflow-hidden h-7">
                          <button
                            onClick={async () => {
                              const res = await cartStore.updateQuantity(item.productId, item.size, item.color, item.quantity - 1);
                              if (!res.ok) toast.error(res.message || 'Error updating quantity');
                            }}
                            disabled={item.quantity <= 1 || isProcessing}
                            className="w-7 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground inset-ring"
                            aria-label="Decrease cart item quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <div className="w-8 text-center text-xs font-medium">
                            {item.quantity}
                          </div>
                          <button
                            onClick={async () => {
                              const res = await cartStore.updateQuantity(item.productId, item.size, item.color, item.quantity + 1);
                              if (!res.ok) toast.error(res.message || 'Error updating quantity');
                            }}
                            disabled={item.quantity >= (item.availableStock || 0) || isProcessing}
                            className="w-7 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground inset-ring"
                            aria-label="Increase cart item quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            const res = await cartStore.removeItem(item.productId, item.size, item.color);
                            if (!res.ok) toast.error(res.message || 'Error removing item');
                          }}
                          disabled={isProcessing}
                          className="text-secondary-text hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="font-medium text-sm text-foreground">
                      ₹{item.unitPrice * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {cartStore.items.length === 0 ? (
            <button
              onClick={handleBuyOnlyThis}
              disabled={isProcessing}
              className="w-full py-3.5 bg-foreground text-background rounded-full font-semibold hover:bg-black transition-colors flex justify-between px-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70"
            >
              <span>Continue to checkout</span>
              <span>₹{selectedItemTotal}</span>
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleBuyOnlyThis}
                disabled={isProcessing}
                className="w-full py-3.5 bg-white border border-border text-foreground rounded-full font-semibold hover:bg-slate-50 transition-colors flex justify-between px-6 focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-70"
              >
                <span>Buy this item only</span>
                <span>₹{selectedItemTotal}</span>
              </button>
              <button
                onClick={handleBuyAll}
                disabled={isProcessing}
                className="w-full py-3.5 bg-foreground text-background rounded-full font-semibold hover:bg-black transition-colors flex justify-between px-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70"
              >
                <span>{isProcessing ? 'Processing...' : `Buy all ${cartStore.items.reduce((total, item) => total + item.quantity, 0) + selectedQuantity} items`}</span>
                <span>₹{combinedTotal}</span>
              </button>
            </div>
          )}
          <p className="text-center text-xs text-secondary-text mt-3">
            Delivery and taxes calculated at checkout
          </p>
        </div>
      </div>
    </div>
  );
}
