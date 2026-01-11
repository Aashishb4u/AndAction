'use client';

import React, { useEffect, useState, useRef } from 'react';
import ArtistSection from './ArtistSection';
import ArtistSectionSkeleton from './ArtistSectionSkeleton';

const mockVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface Artist {
  id: string;
  name: string;
  location: string;
  thumbnail: string;
  videoUrl: string;
}

type ArtistType = 'singer' | 'dancer' | 'anchor' | 'dj';

interface ArtistsState {
  singers: Artist[];
  dancers: Artist[];
  anchors: Artist[];
  djs: Artist[];
}

export default function Artists({ location }: { location: { lat: number; lng: number } | null }) {
  const [artists, setArtists] = useState<ArtistsState>({
    singers: [],
    dancers: [],
    anchors: [],
    djs: []
  });
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const mapArtistData = (artist: any): Artist => ({
      id: artist.id,
      name: artist.stageName || `${artist.user.firstName} ${artist.user.lastName}`.trim(),
      location: artist.user.city || "Unknown",
      thumbnail: artist.user.avatar || "/icons/images.jpeg",
      videoUrl: mockVideoUrl,
    });

    const fetchArtistsByType = async (type: ArtistType): Promise<Artist[]> => {
      try {
        let url = `/api/artists?type=${type}&verified=false`;

        if (location?.lat && location?.lng) {
          url += `&lat=${location.lat}&lng=${location.lng}`;
        }

        const res = await fetch(url, { signal: abortController.signal });
        const json = await res.json();
        const apiArtists = json?.data?.artists || [];

        return apiArtists.map(mapArtistData);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`Request for ${type}s was cancelled`);
          return [];
        }
        console.error(`Failed to load ${type}s:`, err);
        return [];
      }
    };

    const fetchAllArtists = async () => {
      setLoading(true);
      try {
        const [singers, dancers, anchors, djs] = await Promise.all([
          fetchArtistsByType('singer'),
          fetchArtistsByType('dancer'),
          fetchArtistsByType('anchor'),
          fetchArtistsByType('dj')
        ]);

        if (!abortController.signal.aborted) {
          console.log('Fetched artists:', { singers, dancers, anchors, djs });
          setArtists({ singers, dancers, anchors, djs });
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAllArtists();

    return () => {
      abortController.abort();
    };
  }, [location?.lat, location?.lng]);

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
        {loading ? (
          <>
            <ArtistSectionSkeleton title="Singer" />
            <ArtistSectionSkeleton title="Dancers" />
            <ArtistSectionSkeleton title="Anchor" />
            <ArtistSectionSkeleton title="DJ / VJ" />
          </>
        ) : (
          <>
            <ArtistSection title="Singer" artists={artists.singers} />
            <ArtistSection title="Dancers" artists={artists.dancers} />
            <ArtistSection title="Anchor" artists={artists.anchors} />
            <ArtistSection title="DJ / VJ" artists={artists.djs} />
          </>
        )}
      </div>
    </section>
  );
}
