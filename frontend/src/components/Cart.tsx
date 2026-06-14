"use client";

import { useCartStore } from "@/store/cart";
import { X, Minus, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-secondary-bg bg-white mt-8 mx-auto max-w-2xl">
        <div className="w-20 h-20 mb-6 bg-secondary-bg rounded-full flex items-center justify-center">
          <img
            src="/icons/cart.png"
            alt="Empty Cart"
            className="h-10 w-10 object-contain opacity-50"
          />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-2 text-foreground">
          Your cart is empty
        </h2>
        <p className="text-sm text-secondary-text mb-8 max-w-sm">
          Looks like you haven't added anything to your cart yet. Discover our
          curated collection and find something you love.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="bg-foreground text-white px-8 py-3 text-sm tracking-widest uppercase font-medium hover:bg-black transition-colors"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 mt-8">
      <h1 className="text-3xl font-black mb-8">Your Cart</h1>
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={`${item.productId}-${item.size || ''}-${item.color || ''}`} className="flex gap-6 py-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden bg-secondary-bg rounded border border-border flex items-center justify-center">
              {item.image || item.customImage ? (
                <img
                  src={item.customImage || item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-secondary-text">No Image</span>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {(item.size || item.color) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' | '}
                      {item.color && `Color: ${item.color}`}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-secondary-text">
                    ₹{item.unitPrice}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.size,
                          item.color,
                          Math.max(1, item.quantity - 1),
                        )
                      }
                      className="p-2 text-secondary-text hover:text-foreground hover:bg-secondary-bg transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                      }
                      className="p-2 text-secondary-text hover:text-foreground hover:bg-secondary-bg transition-colors"
                      title="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    className="p-2 text-secondary-text hover:text-foreground transition-colors"
                    title="Remove item"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="font-semibold text-right">
                  Total: ₹{(item.unitPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end pt-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex justify-between text-lg font-black pt-4 border-t border-border">
            <span>Subtotal</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <p className="text-sm text-secondary-text text-right">
            Taxes and shipping calculated at checkout
          </p>
          <Link
            to="/checkout"
            className="block w-full bg-foreground text-white text-center py-4 font-semibold tracking-widest uppercase hover:bg-black transition-colors"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
