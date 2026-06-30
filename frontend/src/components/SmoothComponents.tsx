/**
 * Smooth & Optimized UI Components
 * Copy these components to your frontend/src/components directory
 */

import React, { useState, useEffect, useRef } from 'react';

/* ============================================================
   SMOOTH LOADING SPINNER
   ============================================================ */

export const SmoothLoadingSpinner = ({
  size = 'md',
  // color = 'foreground',
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}) => {
  const sizeClass = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  }[size];

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClass} border-secondary-bg rounded-full animate-spin`}
        style={{
          borderTopColor: 'var(--foreground)',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
};

/* ============================================================
   SKELETON LOADER
   ============================================================ */

export const SkeletonLoader = ({
  variant = 'card',
  count = 1,
}: {
  variant?: 'card' | 'text' | 'avatar' | 'image';
  count?: number;
}) => {
  if (variant === 'card') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="aspect-square bg-secondary-bg rounded-lg" />
        <div className="h-4 bg-secondary-bg rounded w-3/4" />
        <div className="h-4 bg-secondary-bg rounded w-1/2" />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-4 bg-secondary-bg rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className="w-12 h-12 bg-secondary-bg rounded-full animate-pulse" />
    );
  }

  if (variant === 'image') {
    return (
      <div className="aspect-square bg-secondary-bg rounded-lg animate-pulse" />
    );
  }

  return null;
};

/* ============================================================
   SMOOTH FADE IN COMPONENT
   ============================================================ */

export const FadeInOnScroll = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  );
};

/* ============================================================
   SMOOTH MODAL DIALOG
   ============================================================ */

export const SmoothModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  if (!isOpen && !isExiting) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen && !isExiting ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className={`fixed inset-0 flex items-center justify-center transition-all duration-300 ${
          isOpen && !isExiting ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div
          className={`${sizeClass} w-full mx-4 bg-white rounded-lg shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-heading text-foreground">{title}</h2>
              <button
                onClick={handleClose}
                className="text-secondary-text hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </>
  );
};

/* ============================================================
   SMOOTH TOAST NOTIFICATION
   ============================================================ */

export const SmoothToast = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg border transition-all duration-300 ${bgColor} ${
        isExiting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className={`flex items-center gap-2 ${textColor}`}>
        <span className="font-bold text-lg">{icon}</span>
        <span>{message}</span>
      </div>
    </div>
  );
};

/* ============================================================
   SMOOTH BUTTON COMPONENT
   ============================================================ */

export const SmoothButton = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) => {
  const variantClass = {
    primary: 'bg-foreground text-white hover:bg-foreground/90',
    secondary: 'bg-secondary-bg text-foreground hover:bg-secondary-bg/80',
    ghost: 'bg-transparent text-foreground hover:bg-secondary-bg/20',
  }[variant];

  const sizeClass = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }[size];

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        relative rounded-lg font-medium transition-all duration-200
        active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClass} ${sizeClass} ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

/* ============================================================
   SMOOTH INPUT COMPONENT
   ============================================================ */

export const SmoothInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
>(({ label, error, className = '', ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <input
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full px-4 py-2 border rounded-lg transition-all duration-200
          ${
            isFocused
              ? 'border-foreground ring-2 ring-foreground/20'
              : 'border-border'
          }
          ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
          focus:outline-none
          ${className}
        `}
        {...props}
      />

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
});

SmoothInput.displayName = 'SmoothInput';

/* ============================================================
   SMOOTH ACCORDION
   ============================================================ */

export const SmoothAccordion = ({
  items,
}: {
  items: Array<{
    title: string;
    content: React.ReactNode;
  }>;
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2 border border-border rounded-lg overflow-hidden">
      {items.map((item, index) => (
        <div key={index} className="border-b border-border last:border-b-0">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-4 py-3 text-left font-medium text-foreground hover:bg-secondary-bg/20 transition-colors duration-200 flex justify-between items-center"
          >
            {item.title}
            <span
              className={`transition-transform duration-300 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{
              maxHeight: openIndex === index ? '1000px' : '0px',
            }}
          >
            <div className="px-4 py-3 bg-secondary-bg/10 border-t border-border/50">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   SMOOTH TABS
   ============================================================ */

export const SmoothTabs = ({
  tabs,
  defaultIndex = 0,
}: {
  tabs: Array<{
    label: string;
    content: React.ReactNode;
  }>;
  defaultIndex?: number;
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-4 border-b border-border overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`
              px-4 py-3 font-medium whitespace-nowrap transition-all duration-300
              ${
                activeIndex === index
                  ? 'text-foreground border-b-2 border-foreground -mb-1'
                  : 'text-secondary-text hover:text-foreground'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`transition-all duration-300 ${
              activeIndex === index
                ? 'opacity-100 animate-fade-in'
                : 'hidden opacity-0'
            }`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   SMOOTH DROPDOWN
   ============================================================ */

export const SmoothDropdown = ({
  trigger,
  items,
  align = 'left',
}: {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
  }>;
  align?: 'left' | 'right';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="transition-all duration-200"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full mt-2 bg-white border border-border rounded-lg
            shadow-lg transition-all duration-300 z-50
            ${align === 'right' ? 'right-0' : 'left-0'}
            min-w-max animate-fade-in
          `}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-secondary-bg/20 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   SMOOTH PROGRESS BAR
   ============================================================ */

export const SmoothProgressBar = ({
  progress = 0,
  animated = true,
}: {
  progress?: number;
  animated?: boolean;
}) => {
  return (
    <div className="w-full h-2 bg-secondary-bg rounded-full overflow-hidden">
      <div
        className={`h-full bg-foreground transition-all duration-500 ${
          animated ? 'animate-pulse' : ''
        }`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
};

/* ============================================================
   SMOOTH PAGE TRANSITION WRAPPER
   ============================================================ */

export const PageTransition = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};

export default {
  SmoothLoadingSpinner,
  SkeletonLoader,
  FadeInOnScroll,
  SmoothModal,
  SmoothToast,
  SmoothButton,
  SmoothInput,
  SmoothAccordion,
  SmoothTabs,
  SmoothDropdown,
  SmoothProgressBar,
  PageTransition,
};
