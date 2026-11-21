"use client";

import SiteLayout from "@/components/layout/SiteLayout";
import { useLocation } from "@/components/providers/location-provider";
import Hero from "@/components/sections/Hero";
import Artists from "@/components/sections/Artists";

export default function HomeClient() {
  const { location, isLocationResolved } = useLocation();

  return (
    <SiteLayout>
      <Hero />

      {/* PASS LOCATION DOWN TO CHILD */}
      <Artists location={location} canFetch={isLocationResolved} />

    </SiteLayout>
  );
}
