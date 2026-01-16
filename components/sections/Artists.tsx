'use client';

import React from 'react';
import ArtistSection from './ArtistSection';
import ArtistSectionSkeleton from './ArtistSectionSkeleton';
import { useAllArtists } from '@/hooks/use-artists';

interface ArtistsProps {
  location: { lat: number; lng: number } | null;
}

// Define all available categories with their display names
const ARTIST_CATEGORIES = [
  { key: 'singers', title: 'Singer' },
  { key: 'anchors', title: 'Anchor/emcee' },
  { key: 'bands', title: 'Live Band' },
  { key: 'djs', title: 'DJ / VJ' },
  { key: 'dancers', title: 'Dancer' },
  { key: 'comedians', title: 'Comedian' },
] as const;

export default function Artists({ location }: ArtistsProps) {
  const { 
    singers, dancers, anchors, djs, bands, comedians,
    singersMetadata,
    isLoading 
  } = useAllArtists(location, false);

  // Map category keys to their artist arrays
  const categoryData: Record<string, any[]> = {
    singers,
    dancers,
    anchors,
    djs,
    bands,
    comedians,
  };

  return (
    <section className="relative w-full ">
      {/* Remove curve from here, handled in Hero */}
      {/* Background */}
      <div className="absolute -top-4 bottom-0 left-0 right-0 z-0 bg-black">
        {/* Pink shadow gradient below the curve */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '240px',
            background: 'radial-gradient(ellipse 60% 100px at 50% 0, #ff2d7a33 0%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto space-y-6">
        {isLoading ? (
          <>
            {ARTIST_CATEGORIES.map((category) => (
              <ArtistSectionSkeleton key={category.key} title={category.title} />
            ))}
          </>
        ) : (
          <>
            {ARTIST_CATEGORIES.map((category) => {
              const artists = categoryData[category.key] || [];
              
              // Only render section if there are artists in this category
              if (artists.length === 0) {
                return null;
              }

              return (
                <ArtistSection 
                  key={category.key}
                  title={category.title} 
                  artists={artists} 
                />
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
