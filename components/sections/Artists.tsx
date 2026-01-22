"use client";

import React from "react";
import ArtistSection from "./ArtistSection";
import ArtistSectionSkeleton from "./ArtistSectionSkeleton";
import { useAllArtists } from "@/hooks/use-artists";

interface ArtistsProps {
  location: { lat: number; lng: number } | null;
}

// Define all available categories with their display names
const ARTIST_CATEGORIES = [
  { key: "singers", title: "Singer" },
  { key: "anchors", title: "Anchor/emcee" },
  { key: "bands", title: "Live Band" },
  { key: "djs", title: "DJ / VJ" },
  { key: "dancers", title: "Dancer" },
  { key: "comedians", title: "Comedian" },
] as const;

export default function Artists({ location }: ArtistsProps) {
  const {
    singers,
    dancers,
    anchors,
    djs,
    bands,
    comedians,
    singersMetadata,
    isLoading,
  } = useAllArtists(location, false);

  // Map category keys to their artist arrays
  const categoryData: Record<string, any[]> = {
    singers,
    dancers,
    anchors,
    djs,
    bands,
    comedians,
  };

  return (
    <section className="relative w-full pt-4 md:pt-16 pb-20 md:pb-8 overflow-hidden">
      {/* Full-height Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base background (use theme background variable) */}
        <div className="absolute inset-0 bg-background" />

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
            {ARTIST_CATEGORIES.map((category) => (
              <ArtistSectionSkeleton
                key={category.key}
                title={category.title}
              />
            ))}
          </>
        ) : (
          <>
            {ARTIST_CATEGORIES.map((category) => {
              const artists = categoryData[category.key] || [];

              // Only render section if there are artists in this category
              if (artists.length === 0) {
                return null;
              }

              return (
                <ArtistSection
                  key={category.key}
                  title={category.title}
                  artists={artists}
                />
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
