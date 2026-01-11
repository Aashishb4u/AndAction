import React from 'react';

const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex-shrink-0 w-[150px] h-[225px] rounded-lg overflow-hidden bg-gray-800/50 animate-pulse">
      {/* Skeleton Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700/50 to-gray-800/50" />
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Content Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        {/* Name skeleton */}
        <div className="h-4 bg-gray-700/70 rounded w-3/4" />
        {/* Location skeleton */}
        <div className="h-3 bg-gray-700/50 rounded w-1/2" />
      </div>
    </div>
  );
};

export default ArtistCardSkeleton;
