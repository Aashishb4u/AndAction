'use client';

import React from 'react';
import ArtistProfileCard from '@/components/ui/ArtistProfileCard';
import { Artist } from '@/types';

interface ArtistGridProps {
  artists: Artist[];
  onBookmark: (artistId: string) => void;
  className?: string;
}

const ArtistGrid: React.FC<ArtistGridProps> = ({
  artists,
  onBookmark,
  className = '',
}) => {
  if (artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M13 12V7V2" stroke="currentColor" strokeWidth="1.5" stroke-linecap="round"></path> <circle cx="9" cy="18" r="4" stroke="currentColor" strokeWidth="1.5"></circle> <path d="M19 8C15.6863 8 13 5.31371 13 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path> </g></svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Artists Found</h3>
          <p className="text-gray-400 max-w-md">
            We couldn&apos;t find any artists matching your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`md:p-6 ${className}`}>
      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {artists.map((artist) => (
          <ArtistProfileCard
            key={artist.id}
            artist={artist}
            onBookmark={onBookmark}
            layout="grid"
          />
        ))}
      </div>

      {/* Mobile List Layout */}
      <div className="lg:hidden">
        {artists.map((artist) => (
          <ArtistProfileCard
            key={artist.id}
            artist={artist}
            onBookmark={onBookmark}
            layout="list"
          />
        ))}
      </div>
    </div>
  );
};

export default ArtistGrid;
