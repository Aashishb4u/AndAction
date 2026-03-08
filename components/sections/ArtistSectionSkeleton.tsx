import React from 'react';
import ArtistCardSkeleton from '@/components/ui/ArtistCardSkeleton';

interface ArtistSectionSkeletonProps {
  title: string;
}

const ArtistSectionSkeleton: React.FC<ArtistSectionSkeletonProps> = ({ title }) => {
  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1 px-6">
        <h2 className="h2 text-white">{title}</h2>
        <div className="h-6 w-20 rounded animate-pulse" style={{ backgroundColor: '#7F7F7F' }}/>
      </div>

      {/* Cards Container */}
      <div className="flex gap-3 overflow-x-hidden px-6 py-2">
        {[...Array(6)].map((_, index) => (
          <ArtistCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default ArtistSectionSkeleton;
