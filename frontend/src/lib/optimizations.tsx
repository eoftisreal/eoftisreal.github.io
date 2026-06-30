/**
 * Optimization Utilities for Frontend
 * Add these to your src/lib/optimizations.ts or split into separate files
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import axios, { AxiosInstance } from 'axios';

/* ============================================================
   IMAGE OPTIMIZATION UTILITIES
   ============================================================ */

export interface LazyImageProps {
  ref: React.RefObject<HTMLImageElement>;
  isLoaded: boolean;
}

/**
 * Hook for lazy loading images with Intersection Observer
 * @param threshold - Visibility threshold before loading (0-1)
 * @example
 * const [imageRef, isLoaded] = useLazyImage(0.1);
 * <img ref={imageRef} src={isLoaded ? actualSrc : placeholder} />
 */
export const useLazyImage = (threshold = 0.1): [React.RefObject<HTMLImageElement>, boolean] => {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isLoaded];
};

/**
 * Component for optimized image with WebP support and lazy loading
 */
export const OptimizedImage = ({
  src,
  alt,
  webpSrc,
  width,
  height,
  className = '',
  ...props
}: {
  src: string;
  alt: string;
  webpSrc?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  [key: string]: any;
}) => {
  const [imageRef, isLoaded] = useLazyImage(0.1);

  return (
    <picture>
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <source srcSet={src} />
      <img
        ref={imageRef as React.RefObject<HTMLImageElement>}
        src={isLoaded ? src : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3C/svg%3E'}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        loading="lazy"
        {...props}
      />
    </picture>
  );
};

/* ============================================================
   API CACHING UTILITIES
   ============================================================ */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple in-memory cache for API responses
 * @param cacheTime - How long to keep items in cache (milliseconds)
 */
class CacheStorage<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private cacheTime: number;

  constructor(cacheTime = 5 * 60 * 1000) {
    // Default 5 minutes
    this.cacheTime = cacheTime;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.cacheTime) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const apiCache = new CacheStorage(5 * 60 * 1000); // 5 min cache

/**
 * Hook for debounced API calls
 * Useful for search, filter operations to reduce API calls
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttled functions
 * Useful for scroll, resize events
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRunRef = useRef<number>(Date.now());

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastRunRef.current >= delay) {
        callback(...args);
        lastRunRef.current = now;
      }
    },
    [callback, delay]
  ) as T;
};

/* ============================================================
   PERFORMANCE MONITORING
   ============================================================ */

/**
 * Hook to measure Core Web Vitals
 */
export const useWebVitals = () => {
  useEffect(() => {
    if ('web-vitals' in window) {
      // Dynamically import web-vitals only if needed
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS((metric: any) => console.log('CLS:', metric));
        onINP((metric: any) => console.log('FID:', metric));
        onFCP((metric: any) => console.log('FCP:', metric));
        onLCP((metric: any) => console.log('LCP:', metric));
        onTTFB((metric: any) => console.log('TTFB:', metric));
      });
    }
  }, []);
};

/**
 * Hook to measure component render time
 */
export const useRenderTime = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [componentName]);
};

/* ============================================================
   PAGE TRANSITION UTILITIES
   ============================================================ */

/**
 * Hook to smooth scroll to top on page change
 */
export const usePageTransition = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
};

/**
 * Hook to smooth scroll to element
 */
export const useSmoothScroll = () => {
  return useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
};

/* ============================================================
   ANIMATION UTILITIES
   ============================================================ */

/**
 * Hook for adding fade-in animation on mount
 */
export const useFadeIn = (delay: number = 0) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return {
    ref,
    className: isVisible ? 'animate-fade-in' : 'opacity-0',
  };
};

/**
 * Hook for observing when element becomes visible
 */
export const useInView = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isInView] as const;
};

/* ============================================================
   FORM OPTIMIZATION UTILITIES
   ============================================================ */

/**
 * Hook for optimized form handling with debouncing
 */
export const useOptimizedForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) => {
  const [values, setValues] = useState(initialValues);
  // const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit]
  );

  return { values, isSubmitting, handleChange, handleSubmit, setValues };
};

/* ============================================================
   LOCAL STORAGE OPTIMIZATION
   ============================================================ */

/**
 * Hook for optimized localStorage with type safety
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};

/* ============================================================
   REQUEST OPTIMIZATION
   ============================================================ */

/**
 * Create an optimized axios instance with caching and timeouts
 */
export const createOptimizedApiClient = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000, // 10 second timeout
  });

  // Request interceptor
  instance.interceptors.request.use(
    config => {
      // Check cache for GET requests
      if (config.method === 'get') {
        const cached = apiCache.get(config.url || '');
        if (cached) {
          return Promise.reject(new axios.Cancel(`Cached response for ${config.url}`));
        }
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    response => {
      // Cache GET responses
      if (response.config.method === 'get') {
        apiCache.set(response.config.url || '', response.data);
      }
      return response;
    },
    error => Promise.reject(error)
  );

  return instance;
};

/* ============================================================
   BUNDLE SIZE TRACKING
   ============================================================ */

/**
 * Log bundle size info (development only)
 */
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle loaded at:', new Date().toLocaleTimeString());
  }
};

/* ============================================================
   MEMORY LEAK PREVENTION
   ============================================================ */

/**
 * Safe effect hook that handles cleanup properly
 */
export const useSafeEffect = (
  effect: React.EffectCallback,
  deps?: React.DependencyList
) => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cleanup: void | (() => void);
    if (isMountedRef.current) {
      cleanup = effect();
    }
    return () => {
      if (isMountedRef.current && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
};
