'use client';

import React, { useEffect, useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import Hero from '@/components/sections/Hero';
import Artists from '@/components/sections/Artists';

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Location permission denied", err);
        setLocation(null);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <SiteLayout>
      <Hero />

      {/* PASS LOCATION DOWN TO CHILD */}
      <Artists location={location} />
    </SiteLayout>
  );
}
