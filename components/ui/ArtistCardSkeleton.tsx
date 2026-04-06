import React from 'react';

const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex-shrink-0 w-[150px] h-[225px] rounded-lg overflow-hidden animate-pulse" style={{ backgroundColor: '#1B1B1B' }}>
      {/* Skeleton Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #1B1B1B, #222222)' }} />
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Content Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        {/* Name skeleton */}
        <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#7F7F7F' }} />
        {/* Location skeleton */}
        <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#7F7F7F' }} />
      </div>
    </div>
  );
};

export default ArtistCardSkeleton;
