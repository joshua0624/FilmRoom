'use client';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export const SkeletonLoader = ({ className = '', count = 1 }: SkeletonLoaderProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
          aria-label="Loading..."
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      ))}
    </>
  );
};

export const SessionSkeleton = () => {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="space-y-4">
        <SkeletonLoader className="h-8 w-64" />
        <SkeletonLoader className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonLoader className="h-32 w-full" />
          <SkeletonLoader className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
};

export const ListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <SkeletonLoader className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-3/4" />
            <SkeletonLoader className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};



