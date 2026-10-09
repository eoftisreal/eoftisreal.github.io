'use client';

import { useState } from 'react';
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

  const availableStock = normalizeStock(product.stock) || 0;
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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

  const handleBuyAll = () => {
    // Check if total quantity exceeds stock
    let existingQuantity = 0;
    const existingItem = cartStore.items.find(item =>
      item.productId === product._id &&
      (!product.enableSizes || item.size === size) &&
      (!product.enableColors || item.color === color) &&
      item.customImage === customImage
    );
    if (existingItem) {
      existingQuantity = existingItem.quantity;
    }

    if (existingQuantity + selectedQuantity > availableStock) {
       toast.error(`Cannot add. Only ${availableStock} in stock total.`);
       return;
    }

    cartStore.addItem({
      productId: product._id,
      title: product.title,
      unitPrice: product.price,
      image: product.images?.[0],
      customImage,
      size: product.enableSizes ? size : undefined,
      color: product.enableColors ? color : undefined,
      availableStock,
    }).then(result => {
        if(!result.ok) {
           toast.error(result.message || 'Unable to add item to cart');
           return;
        }

        // Check if there was an existing item to properly calculate quantity
        const quantityToAdd = selectedQuantity;
        if (quantityToAdd > 1) {
           cartStore.fetchCart().then(() => {
               const latestStore = useCartStore.getState();
               const addedItem = latestStore.items.find(item =>
                 item.productId === product._id &&
                 (!product.enableSizes || item.size === size) &&
                 (!product.enableColors || item.color === color) &&
                 item.customImage === customImage
               );
               if (addedItem) {
                   // Calculate the target quantity: existing + selectedQuantity
                   // We already added 1 via addItem, so we need to add (selectedQuantity - 1)
                   const targetQuantity = existingQuantity + selectedQuantity;
                   latestStore.updateQuantity(addedItem.productId, addedItem.size, addedItem.color, targetQuantity).then(() => {
                       navigate('/checkout');
                   });
               } else {
                   navigate('/checkout');
               }
           });
        } else {
           navigate('/checkout');
        }
    });
  };

  const selectedItemTotal = product.price * selectedQuantity;
  const cartSubtotal = cartStore.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const combinedTotal = selectedItemTotal + cartSubtotal;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-background shadow-xl flex flex-col transform transition-transform"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-xl text-foreground">Ready to checkout?</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
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
                  disabled={selectedQuantity <= 1}
                  className="w-9 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <div className="w-10 text-center text-sm font-medium">
                  {selectedQuantity}
                </div>
                <button
                  onClick={() => handleUpdateSelectedQuantity(1)}
                  disabled={selectedQuantity >= availableStock}
                  className="w-9 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors"
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
                Also in your cart &middot; {cartStore.items.length} items
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
                            onClick={() => cartStore.updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <div className="w-8 text-center text-xs font-medium">
                            {item.quantity}
                          </div>
                          <button
                            onClick={() => cartStore.updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                            disabled={item.quantity >= (item.availableStock || 0)}
                            className="w-7 h-full flex items-center justify-center hover:bg-secondary-bg disabled:opacity-50 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => cartStore.removeItem(item.productId, item.size, item.color)}
                          className="text-secondary-text hover:text-red-500 transition-colors"
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
              className="w-full py-3.5 bg-foreground text-background rounded-full font-semibold hover:bg-black transition-colors flex justify-between px-6"
            >
              <span>Continue to checkout</span>
              <span>₹{selectedItemTotal}</span>
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleBuyOnlyThis}
                className="w-full py-3.5 bg-white border border-border text-foreground rounded-full font-semibold hover:bg-slate-50 transition-colors flex justify-between px-6"
              >
                <span>Buy this item only</span>
                <span>₹{selectedItemTotal}</span>
              </button>
              <button
                onClick={handleBuyAll}
                className="w-full py-3.5 bg-foreground text-background rounded-full font-semibold hover:bg-black transition-colors flex justify-between px-6"
              >
                <span>Buy all {cartStore.items.length + 1} items</span>
                <span>₹{combinedTotal}</span>
              </button>
            </div>
          )}
          <p className="text-center text-xs text-secondary-text mt-3">
            Delivery and taxes calculated at checkout
          </p>
        </div>
      </div>
    </>
  );
}
