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
        
        {/* Location Context Indicator */}
        {!isLoading && singersMetadata && (
          <div className="px-4 mb-4">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {singersMetadata.strategy === 'nearby' && '📍'}
                  {singersMetadata.strategy === 'expanded' && '🗺️'}
                  {singersMetadata.strategy === 'nationwide' && '🌍'}
                </span>
                <p className="text-sm text-gray-700 font-medium">
                  {singersMetadata.message}
                </p>
              </div>
              
              {singersMetadata.strategy !== 'nationwide' && singersMetadata.userLocation && (
                <p className="text-xs text-gray-500 mt-1">
                  {singersMetadata.nearbyCount > 0 && `${singersMetadata.nearbyCount} nearby`}
                  {singersMetadata.nearbyCount > 0 && singersMetadata.expandedCount > 0 && ' • '}
                  {singersMetadata.expandedCount > 0 && `${singersMetadata.expandedCount} within ${singersMetadata.radiusUsed}km`}
                </p>
              )}
            </div>
          </div>
        )}
        
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
