'use client';

import React from 'react';
import ArtistSection from './ArtistSection';
import ArtistSectionSkeleton from './ArtistSectionSkeleton';
import { useAllArtists } from '@/hooks/use-artists';

interface ArtistsProps {
  location: { lat: number; lng: number } | null;
}

export default function Artists({ location }: ArtistsProps) {
  const { 
    singers, dancers, anchors, djs, 
    singersMetadata,
    isLoading 
  } = useAllArtists(location, false);

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
            <ArtistSectionSkeleton title="Singer" />
            <ArtistSectionSkeleton title="Dancers" />
            <ArtistSectionSkeleton title="Anchor" />
            <ArtistSectionSkeleton title="DJ / VJ" />
          </>
        ) : (
          <>
            <ArtistSection title="Singer" artists={singers} />
            <ArtistSection title="Dancers" artists={dancers} />
            <ArtistSection title="Anchor" artists={anchors} />
            <ArtistSection title="DJ / VJ" artists={djs} />
          </>
        )}
      </div>
    </section>
  );
}
