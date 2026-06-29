import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import { useHomeStore } from '@/store/home';

export default function Home() {
  const { categories, featuredProducts, heroBannerUrls, fetchData } = useHomeStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track if user is interacting to pause auto-slide
  const isInteracting = useRef(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // If we have banners, duplicate the first one at the end to create a seamless infinite loop visual
  const hasBanners = heroBannerUrls && heroBannerUrls.length > 0;
  const loopBanners = hasBanners ? [...heroBannerUrls, heroBannerUrls[0]] : [];

  // Handle auto-slide
  useEffect(() => {
    if (!heroBannerUrls || heroBannerUrls.length <= 1) return;

    const intervalId = setInterval(() => {
      if (isInteracting.current) return;

      setCurrentSlide((prev) => {
        const next = prev + 1;
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          container.scrollTo({
            left: next * container.clientWidth,
            behavior: 'smooth'
          });
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [heroBannerUrls]);

  // Handle scroll snap updates and infinite loop logic
  const handleScroll = () => {
    if (!scrollContainerRef.current || !hasBanners) return;

    const container = scrollContainerRef.current;
    const scrollPosition = container.scrollLeft;
    const slideWidth = container.clientWidth;

    // Calculate which slide is currently most visible
    const newSlideIndex = Math.round(scrollPosition / slideWidth);

    if (newSlideIndex !== currentSlide) {
      setCurrentSlide(newSlideIndex);

      // If we've reached the duplicated first slide at the very end
      if (newSlideIndex === loopBanners.length - 1) {
        // Wait a tiny bit for the smooth scroll snap to finish visually
        setTimeout(() => {
          if (!scrollContainerRef.current) return;
          // Jump back to the real first slide instantly without animation
          scrollContainerRef.current.scrollTo({
            left: 0,
            behavior: 'instant' as ScrollBehavior // 'instant' is sometimes not in TS types, but works in modern browsers. 'auto' also works instantly.
          });
          setCurrentSlide(0);
        }, 300); // 300ms allows standard snap animation to finish
      }
    }
  };

  return (
    <div className="space-y-10 md:space-y-16 pb-10 md:pb-16">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden aspect-[2/1] w-full flex items-center justify-center bg-secondary-bg"
        onMouseEnter={() => isInteracting.current = true}
        onMouseLeave={() => isInteracting.current = false}
        onTouchStart={() => isInteracting.current = true}
        onTouchEnd={() => {
           // Small delay to allow scroll to finish snapping before resuming auto-slide
           setTimeout(() => { isInteracting.current = false; }, 1000);
        }}
      >
        {hasBanners ? (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="absolute inset-0 z-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loopBanners.map((url, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                <img src={url} alt={`Hero Banner ${idx + 1}`} className="w-full h-full object-cover object-center" loading={idx === 0 ? "eager" : "lazy"} fetchPriority={idx === 0 ? "high" : "auto"} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-accent/30"></div>
        )}

        {/* Fixed Overlay */}
        <div className="relative z-10 text-center max-w-2xl px-2 sm:px-4 flex flex-col items-center pointer-events-none">
          <h1 className="text-2xl sm:text-3xl md:text-6xl font-heading text-foreground mb-2 md:mb-6 leading-tight">
            {hasBanners ? <span className="text-white drop-shadow-md">Discover the Art of Style</span> : "Discover the Art of Style"}
          </h1>
          <p className="text-[10px] sm:text-xs md:text-base text-secondary-text mb-4 md:mb-8 max-w-md mx-auto px-4">
            {hasBanners ? <span className="text-white/90 drop-shadow-md">Explore our latest collection of curated pieces designed for the modern aesthetic.</span> : "Explore our latest collection of curated pieces designed for the modern aesthetic."}
          </p>
          <div className="pointer-events-auto">
            <Link to="/products" className="inline-block border border-foreground bg-btn-bg text-btn-text px-4 py-1.5 md:px-10 md:py-3 text-[9px] md:text-sm tracking-widest uppercase transition-colors hover:bg-transparent hover:text-foreground transform scale-90 md:scale-100 -translate-y-2 md:translate-y-0">
              Shop Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="px-4 md:px-8 max-w-[1600px] mx-auto">
        <h2 className="mb-6 md:mb-8 text-xl md:text-2xl font-heading text-center">Shop by Category</h2>
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category._id}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="group relative overflow-hidden rounded-md border border-secondary-bg aspect-square flex flex-col justify-end bg-white"
            >
              {category.image ? (
                <>
                  <div className="absolute inset-0 z-0">
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity group-hover:from-black/80 group-hover:via-black/40"></div>
                  </div>
                  <div className="relative z-10 p-4 md:p-6 drop-shadow-md">
                    <p className="text-[9px] md:text-[10px] tracking-widest uppercase text-white/90 mb-1 md:mb-2">{category.description || 'Collection'}</p>
                    <p className="text-lg md:text-xl font-heading text-white">{category.name}</p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 z-0 transition-colors group-hover:bg-secondary-bg/50">
                  <div className="p-4 md:p-6 h-full flex flex-col justify-end">
                    <p className="text-[9px] md:text-[10px] tracking-widest uppercase text-secondary-text mb-1 md:mb-2">{category.description || 'Collection'}</p>
                    <p className="text-lg md:text-xl font-heading text-foreground">{category.name}</p>
                  </div>
                </div>
              )}
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="col-span-full text-center text-secondary-text">No collections available at the moment.</p>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="px-4 md:px-8 max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-heading">Featured Pieces</h2>
            <Link to="/products" className="text-xs md:text-sm border-b border-foreground pb-0.5 md:pb-1 hover:text-secondary-text hover:border-secondary-text transition-colors">
              View All
            </Link>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
