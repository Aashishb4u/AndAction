'use client';

import React, { useEffect, useRef, useState } from 'react';
import ArtistSection from './ArtistSection';

const mockVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function Artists({ location }: { location: { lat: number; lng: number } | null }) {
  const [singers, setSingers] = useState<any[]>([]);
  const [dancers, setDancers] = useState<any[]>([]);
  const [anchors, setAnchors] = useState<any[]>([]);
  const [djs, setDJ] = useState<any[]>([]);

  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;

      if (!location) return;
    }

    // If no location yet, wait for real update


    async function fetchSingers() {
      try {
        let url = `/api/artists?type=singer&verified=false`;

        if (location?.lat && location?.lng) {
          url += `&lat=${location.lat}&lng=${location.lng}`;
        }

        const res = await fetch(url);
        console.log("Fetching singers from URL:", url);
        const json = await res.json();

        const apiArtists = json?.data?.artists || [];

        const mapped = apiArtists.map((artist: any) => ({
          id: artist.id,
          name:
            artist.stageName ||
            `${artist.user.firstName} ${artist.user.lastName}`.trim(),
          location: artist.user.city || "Unknown",
          thumbnail: artist.user.avatar || "/icons/images.jpeg",
          videoUrl: mockVideoUrl,
        }));

        setSingers(mapped);
      } catch (err) {
        console.error("Failed to load singers:", err);
      }
    }
    async function fetchDancers() {
      try {
        let url = `/api/artists?type=dancer&verified=false`;

        if (location?.lat && location?.lng) {
          url += `&lat=${location.lat}&lng=${location.lng}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        const apiArtists = json?.data?.artists || [];

        const mapped = apiArtists.map((artist: any) => ({
          id: artist.id,
          name:
            artist.stageName ||
            `${artist.user.firstName} ${artist.user.lastName}`.trim(),
          location: artist.user.city || "Unknown",
          thumbnail: artist.user.avatar || "/icons/images.jpeg",
          videoUrl: mockVideoUrl,
        }));

        setDancers(mapped);
      } catch (err) {
        console.error("Failed to load singers:", err);
      }
    }

    async function fetchAnchors() {
      try {
        let url = `/api/artists?type=anchor&verified=false`;

        if (location?.lat && location?.lng) {
          url += `&lat=${location.lat}&lng=${location.lng}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        const apiArtists = json?.data?.artists || [];

        const mapped = apiArtists.map((artist: any) => ({
          id: artist.id,
          name:
            artist.stageName ||
            `${artist.user.firstName} ${artist.user.lastName}`.trim(),
          location: artist.user.city || "Unknown",
          thumbnail: artist.user.avatar || "/icons/images.jpeg",
          videoUrl: mockVideoUrl,
        }));

        setAnchors(mapped);
      } catch (err) {
        console.error("Failed to load singers:", err);
      }
    }
    async function fetchDJ() {
      try {
        let url = `/api/artists?type=dj&verified=false`;

        if (location?.lat && location?.lng) {
          url += `&lat=${location.lat}&lng=${location.lng}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        const apiArtists = json?.data?.artists || [];

        const mapped = apiArtists.map((artist: any) => ({
          id: artist.id,
          name:
            artist.stageName ||
            `${artist.user.firstName} ${artist.user.lastName}`.trim(),
          location: artist.user.city || "Unknown",
          thumbnail: artist.user.avatar || "/icons/images.jpeg",
          videoUrl: mockVideoUrl,
        }));

        setDJ(mapped);
      } catch (err) {
        console.error("Failed to load singers:", err);
      }
    }
    fetchDJ();
    fetchAnchors();
    fetchDancers();
    fetchSingers();
  }, [location]);




  const sampleArtists = {
    singers,
    dancers,
    anchors,
    djs
  };

  return (
    <section className="relative w-full min-h-screen pb-20 md:pt-0">
      {/* Background */}
      <div className="absolute inset-0 -translate-y-32 z-0">
        <div
          className="w-full h-auto bg-cover bg-top bg-no-repeat md:block hidden"
          style={{ backgroundImage: 'url(/home-bg.webp)', minHeight: '120vh' }}
        />
        <div
          className="w-full h-auto bg-cover bg-top bg-no-repeat md:hidden"
          style={{ backgroundImage: 'url(/home-bg-mobile.webp)', minHeight: '100vh' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <ArtistSection title="Singer" artists={sampleArtists.singers} />
        <ArtistSection title="Dancers" artists={sampleArtists.dancers} />
        <ArtistSection title="Anchor" artists={sampleArtists.anchors} />
        <ArtistSection title="DJ / VJ" artists={sampleArtists.djs} />
      </div>
    </section>
  );
}
