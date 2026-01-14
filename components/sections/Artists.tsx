'use client';

import React from 'react';
import ArtistSection from './ArtistSection';
import ArtistSectionSkeleton from './ArtistSectionSkeleton';
import { useAllArtists } from '@/hooks/use-artists';

interface ArtistsProps {
  location: { lat: number; lng: number } | null;
}

export default function Artists({ location }: ArtistsProps) {
  const { singers, dancers, anchors, djs, isLoading } = useAllArtists(location, false);

  return (
    <section className="relative w-full pt-16">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* Desktop */}
        <div
          className="hidden md:block w-full h-full bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: "url(/home-bg.webp)" }}
        />

        {/* Mobile */}
        <div
          className="md:hidden w-full h-full bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: "url(/home-bg-mobile.webp)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6 py-12">
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
