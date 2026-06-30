export const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-square bg-secondary-bg rounded-md mb-4" />
    <div className="h-4 bg-secondary-bg rounded w-3/4 mb-2" />
    <div className="h-4 bg-secondary-bg rounded w-1/2" />
  </div>
);

export const SkeletonLoader = ({
  variant = 'card',
  count = 1,
}: {
  variant?: 'card' | 'text' | 'avatar' | 'image';
  count?: number;
}) => {
  if (variant === 'card') {
    return <SkeletonCard />;
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
