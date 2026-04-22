import React from 'react';

const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex-shrink-0 w-[150px] h-[225px] rounded-lg overflow-hidden animate-pulse bg-text-light-gray/10">
      {/* Skeleton Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-text-light-gray/10 to-background" />
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Content Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        {/* Name skeleton */}
        <div className="h-4 rounded w-3/4 bg-text-light-gray/25" />
        {/* Location skeleton */}
        <div className="h-3 rounded w-1/2 bg-text-light-gray/25" />
      </div>
    </div>
  );
};

export default ArtistCardSkeleton;
