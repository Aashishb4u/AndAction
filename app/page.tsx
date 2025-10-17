'use client';

import React from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import Hero from '@/components/sections/Hero';
import Artists from '@/components/sections/Artists';

export default function Home() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <Hero />

      {/* Artists Section */}
      <Artists />
    </SiteLayout>
  );
}
