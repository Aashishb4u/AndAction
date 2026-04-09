"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ArtistSection from "./ArtistSection";
import ArtistSectionSkeleton from "./ArtistSectionSkeleton";
import { useArtistsByCategoryValues } from "@/hooks/use-artists";
import { useArtistCategories } from "@/hooks/use-artist-categories";

interface ArtistsProps {
  location: { lat: number; lng: number } | null;
  canFetch?: boolean;
}

// Number of categories to display initially and per load
const CATEGORIES_PER_LOAD = 5;

export default function Artists({ location, canFetch = true }: ArtistsProps) {
  const { categories, isLoading: isCategoriesLoading } = useArtistCategories();
  const categoryValues = useMemo(
    () => categories.map((category) => category.value),
    [categories],
  );

  const normalizedLocation = useMemo(() => {
    if (!location) return null;

    const { lat, lng } = location;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  }, [location]);

  const locationQueryKey = normalizedLocation
    ? `${normalizedLocation.lat.toFixed(4)},${normalizedLocation.lng.toFixed(4)}`
    : "all";

  const {
    byType: artistsByType,
    isLoading: isArtistsLoading,
  } = useArtistsByCategoryValues(
    categoryValues,
    normalizedLocation,
    false,
    canFetch && categoryValues.length > 0,
  );

  const shouldShowLoading =
    !canFetch ||
    isCategoriesLoading ||
    (categoryValues.length > 0 && isArtistsLoading);

  const categoriesWithArtists = useMemo(
    () =>
      categories
        .map((category) => ({
          key: category.value,
          title: category.label,
          artistsCount: (artistsByType[category.value] || []).length,
        }))
        .filter((category) => category.artistsCount > 0)
        .map(({ key, title }) => ({ key, title })),
    [categories, artistsByType],
  );

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
    if (!observerRef.current || shouldShowLoading) return;

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
  }, [loadMoreCategories, hasMoreToLoad, loadingMore, shouldShowLoading]);

  // Reset visible category count when data changes
  useEffect(() => {
    if (!shouldShowLoading) {
      setVisibleCategoryCount(CATEGORIES_PER_LOAD);
    }
  }, [shouldShowLoading]);

  useEffect(() => {
    setVisibleCategoryCount(CATEGORIES_PER_LOAD);
    setLoadingMore(false);
  }, [locationQueryKey]);

  return (
    <section className="relative w-full pt-2 pb-20 md:pb-8 overflow-hidden">
      {/* Full-height Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base background */}
        <div className="absolute inset-0 bg-background" />

        {/* Centered pink spotlight at top — connects with Hero curve glow (faded start) */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: '600px',
            background: `
              radial-gradient(
                ellipse 40% 75% at 50% 0%,
                rgba(255,45,122,0.02) 0%,
                rgba(255,45,122,0.06) 20%,
                rgba(255,45,122,0.10) 40%,
                rgba(255,45,122,0.04) 65%,
                transparent 90%
              )
            `,
          }}
        />

        {/* Center spotlight starting at top and extending downward (~5 rows) */}
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            left: '50%',
            top: '-20px',
            transform: 'translateX(-50%)',
            width: '75%',
            height: '1800px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse 55% 65% at 50% 0%, rgba(255,45,122,0.02) 0%, rgba(255,45,122,0.06) 10%, rgba(255,45,122,0.12) 30%, rgba(255,45,122,0.08) 55%, rgba(255,45,122,0.03) 80%, transparent 95%)`,
            zIndex: 1,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto space-y-6">
        {shouldShowLoading ? (
          <>
            {Array.from({ length: CATEGORIES_PER_LOAD }).map((_, index) => (
              <ArtistSectionSkeleton
                key={`skeleton-${index}`}
              />
            ))}
          </>
        ) : (
          <>
            {visibleCategories.map((category) => {
              const artists = artistsByType[category.key] || [];

              return (
                <ArtistSection
                  key={category.key}
                  title={category.title}
                  artists={artists}
                  categoryValue={category.key}
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