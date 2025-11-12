'use client';

import React from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import Hero from '@/components/sections/Hero';
import Artists from '@/components/sections/Artists';
import { useSession } from 'next-auth/react'; 

export default function Home() {
  const { data: session } = useSession();
  console.log('TODO: remove Session (live):', session);

  return (
    <SiteLayout>
      <Hero />
      <Artists />
    </SiteLayout>
  );
}
