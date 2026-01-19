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
    <section className="relative w-full pt-4 md:pt-16 overflow-hidden">

      {/* Full-height Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">

        {/* Base black */}
        <div className="absolute inset-0 bg-black" />

        {/* Full-height pink glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `
          radial-gradient(
            ellipse 500% 40% at 50% 0%,
            rgba(255,45,122,0.22) 0%,
            rgba(255,45,122,0.12) 30%,
            transparent 70%
          ),
          linear-gradient(
            to bottom,
            transparent 0%,
            rgba(255,45,122,0.08) 40%,
            transparent 80%
          )
        `,
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
