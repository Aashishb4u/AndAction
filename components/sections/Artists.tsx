"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ArtistSection from "./ArtistSection";
import ArtistSectionSkeleton from "./ArtistSectionSkeleton";
import { useAllArtists } from "@/hooks/use-artists";
import { TITLE_MAP, PREFERRED_ORDER, prettifyKey } from "@/lib/artistCategories";

interface ArtistsProps {
  location: { lat: number; lng: number } | null;
}

// Number of categories to display initially and per load
const CATEGORIES_PER_LOAD = 5;

export default function Artists({ location }: ArtistsProps) {
  const {
    singers,
    dancers,
    anchors,
    djs,
    bands,
    comedians,
    musicians,
    magicians,
    actors,
    mimicry,
    specialAct,
    spiritual,
    kidsEntertainers,
    isLoading,
  } = useAllArtists(location, false);

  // Map category keys to their artist arrays (memoized to keep stable ref)
  const categoryData: Record<string, any[]> = useMemo(
    () => ({
      singers,
      dancers,
      anchors,
      djs,
      bands,
      comedians,
      musicians,
      magicians,
      actors,
      mimicry,
      specialAct,
      spiritual,
      kidsEntertainers,
    }),
    [
      singers,
      dancers,
      anchors,
      djs,
      bands,
      comedians,
      musicians,
      magicians,
      actors,
      mimicry,
      specialAct,
      spiritual,
      kidsEntertainers,
    ],
  );

  // Derive categories dynamically from returned data keys and memoize
  const categoriesWithArtists = useMemo(() => {
    const derivedCategories = Object.keys(categoryData);
    const ordered = [
      ...PREFERRED_ORDER.filter((k) => derivedCategories.includes(k)),
      ...derivedCategories.filter((k) => !PREFERRED_ORDER.includes(k)),
    ];
    return ordered
      .map((key) => ({ key, title: TITLE_MAP[key] || prettifyKey(key) }))
      .filter((category) => (categoryData[category.key] || []).length > 0);
  }, [categoryData]);

  // State to track how many categories to show
  const [visibleCategoryCount, setVisibleCategoryCount] =
    useState(CATEGORIES_PER_LOAD);

  // State to track if more categories are being loaded
  const [loadingMore, setLoadingMore] = useState(false);

  // Observer ref for infinite scroll
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Get visible categories based on current count
  const visibleCategories = categoriesWithArtists.slice(
    0,
    visibleCategoryCount,
  );

  // Check if there are more categories to load
  const hasMoreToLoad = visibleCategoryCount < categoriesWithArtists.length;

  // Load more categories
  const loadMoreCategories = useCallback(() => {
    if (loadingMore || !hasMoreToLoad) return;

    setLoadingMore(true);

    // Small delay to simulate loading effect
    setTimeout(() => {
      setVisibleCategoryCount((prev) =>
        Math.min(prev + CATEGORIES_PER_LOAD, categoriesWithArtists.length),
      );
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMoreToLoad, categoriesWithArtists.length]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!observerRef.current || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreToLoad && !loadingMore) {
          loadMoreCategories();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    const target = observerRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loadMoreCategories, hasMoreToLoad, loadingMore, isLoading]);

  // Reset visible category count when data changes
  useEffect(() => {
    if (!isLoading) {
      setVisibleCategoryCount(CATEGORIES_PER_LOAD);
    }
  }, [isLoading]);

  return (
    <section className="relative w-full pt-2 pb-20 md:pb-8 overflow-hidden">
      {/* Full-height Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base background */}
        <div className="absolute inset-0 bg-background" />

        {/* Centered pink spotlight at top — connects with Hero curve glow */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: '450px',
            background: `
              radial-gradient(
                ellipse 40% 75% at 50% 0%,
                rgba(255,45,122,0.25) 0%,
                rgba(255,45,122,0.12) 30%,
                rgba(255,45,122,0.04) 55%,
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
            {PREFERRED_ORDER.slice(0, CATEGORIES_PER_LOAD).map((key) => (
              <ArtistSectionSkeleton
                key={key}
                title={TITLE_MAP[key] || prettifyKey(key)}
              />
            ))}
          </>
        ) : (
          <>
            {visibleCategories.map((category) => {
              const artists = categoryData[category.key] || [];

              return (
                <ArtistSection
                  key={category.key}
                  title={category.title}
                  artists={artists}
                  categoryKey={category.key}
                />
              );
            })}

            {/* Infinite scroll trigger */}
            {hasMoreToLoad && <div ref={observerRef} className="h-1" />}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-primary-pink border-t-transparent rounded-full animate-spin" />
                  <span>Loading more categories...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
