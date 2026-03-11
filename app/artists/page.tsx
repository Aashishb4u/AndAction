"use client";
import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SiteLayout from "@/components/layout/SiteLayout";
import ArtistFilters from "@/components/sections/ArtistFilters";
import ArtistGrid from "@/components/sections/ArtistGrid";
import MobileFilters from "@/components/sections/MobileFilters";
import { Artist, Filters } from "@/types";
import LoadingSpinner from "@/components/ui/Loading";
import { transformArtist } from "./transformArtist";
import ClientWrapper from "@/components/ui/client-wrapper";
import { Search } from "lucide-react";
import { VIDEO_CATEGORIES } from "@/lib/constants";

const DEFAULT_LIMIT = 12;

// Fetch artist count only (lightweight)
const getArtistCount = async (
  query: string,
  filters: Filters
): Promise<number> => {
  try {
    const params = new URLSearchParams();

    // Add countOnly parameter
    params.set("countOnly", "true");

    // Search
    if (query.trim()) {
      params.set("search", query.trim());
    }

    // Filters
    if (filters.category) params.set("type", normalizeTypeForRequest(filters.category));
    if (filters.subCategory) params.set("subType", filters.subCategory);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.language) params.set("language", filters.language);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.eventState) params.set("state", filters.eventState);
    if (filters.budget) params.set("budget", filters.budget);
    if (filters.location) params.set("location", filters.location);

    const url = `/api/artists?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return 0;
    }

    const json = await res.json();
    return json.data?.count || 0;
  } catch (error) {
    console.error("Count fetch failed:", error);
    return 0;
  }
};

// Fetch full artist data
const getArtists = async (
  query: string,
  filters: Filters,
  page: number = 1
): Promise<{ artists: Artist[]; total: number }> => {
  try {
    const params = new URLSearchParams();

    // Search
    if (query.trim()) {
      params.set("search", query.trim());
    }

    // Filters
    if (filters.category) params.set("type", normalizeTypeForRequest(filters.category));
    if (filters.subCategory) params.set("subType", filters.subCategory);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.language) params.set("language", filters.language);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.eventState) params.set("state", filters.eventState);
    if (filters.budget) params.set("budget", filters.budget);
    if (filters.location) params.set("location", filters.location);

    // Pagination
    params.set("page", page.toString());
    params.set("limit", DEFAULT_LIMIT.toString());

    const url = `/api/artists?${params.toString()}`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error("API Error:", error);
      return { artists: [], total: 0 };
    }

    const json = await res.json();
    return {
      artists: json.data.artists.map(transformArtist),
      total: json.data.metadata?.total || 0,
    };
  } catch (error) {
    console.error("Fetch failed:", error);
    return { artists: [], total: 0 };
  }
};

// Normalize category values for API requests / URLs
function normalizeTypeForRequest(type: string) {
  if (!type) return type;
  const t = type.toLowerCase();
  if (t === "band" || t === "bands" || t === "live band" || t === "liveband") return "Live Band";
  if (t === "dj percussionist" || t === "dj-percussionist" || t === "djpercussionist") return "dj-percussionist";
  return type;
}


function ArtistsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Initialize filters from URL params on first render
  const getInitialFilters = () => {
    const params = searchParams;
    return {
      category: params.get("type") || "",
      subCategory: params.get("subType") || "",
      gender: params.get("gender") || "",
      budget: params.get("budget") || "",
      eventState: params.get("state") || "",
      eventType: params.get("eventType") || "",
      language: params.get("language") || "",
      location: params.get("location") || "",
    };
  };

  const [artists, setArtists] = useState<Artist[]>([]);
  const [filters, setFilters] = useState<Filters>(getInitialFilters);
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load and when filters/query change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setPage(1);
      const { artists: newArtists, total } = await getArtists(query, filters, 1);
      setArtists(newArtists);
      setTotalResults(total);
      setHasMore(newArtists.length < total);
      setLoading(false);
    };
    fetchData();
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(filters)]);

  // Detect mobile viewport to control spinner presentation
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Debounce search input - wait 2 seconds after user stops typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setQuery(searchInput);
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput]);

  // Update URL with current filters and search query
  const updateURL = () => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (filters.category) params.set("type", filters.category);
    if (filters.subCategory) params.set("subType", filters.subCategory);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.language) params.set("language", filters.language);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.eventState) params.set("state", filters.eventState);
    if (filters.budget) params.set("budget", filters.budget);
    if (filters.location) params.set("location", filters.location);

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", newURL);
  };

  // Infinite scroll: fetch more artists when bottom is reached
  const fetchMoreArtists = useCallback(async () => {
    if (isFetchingMore || loading || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    const { artists: moreArtists } = await getArtists(query, filters, nextPage);
    setArtists((prev) => [...prev, ...moreArtists]);
    setPage(nextPage);
    setHasMore(artists.length + moreArtists.length < totalResults);
    setIsFetchingMore(false);
  }, [isFetchingMore, loading, hasMore, page, query, filters, totalResults, artists.length]);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingMore) {
          fetchMoreArtists();
        }
      },
      { threshold: 1 }
    );
    observer.observe(observerRef.current);
    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [fetchMoreArtists, hasMore, loading, isFetchingMore]);

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      subCategory: "",
      gender: "",
      budget: "",
      eventState: "",
      eventType: "",
      language: "",
      location: "",
    });
    setQuery("");
    setSearchInput("");
    setPage(1);

    // Reload all artists
    setLoading(true);
    getArtists(
      "",
      {
        category: "",
        subCategory: "",
        gender: "",
        budget: "",
        eventState: "",
        eventType: "",
        language: "",
        location: "",
      },
      1
    ).then(({ artists, total }) => {
      setArtists(artists);
      setTotalResults(total);
      setLoading(false);
    });
  };

  // Handle View Result button click
  const handleViewResult = () => {
    setLoading(true);
    setPage(1);
    getArtists(query, filters, 1)
      .then(({ artists, total }) => {
        setArtists(artists);
        setTotalResults(total);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching artists:", error);
        setLoading(false);
      });
  };

  // -----------------------------
  // BOOKMARK TOGGLE LOGIC
  // -----------------------------
  const handleBookmark = async (artistId: string) => {
    // Check if user is logged in
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    // Instant UI feedback
    setArtists((prev) =>
      prev.map((a) =>
        a.id === artistId ? { ...a, isBookmarked: !a.isBookmarked } : a
      )
    );

    const artist = artists.find((a) => a.id === artistId);
    if (!artist) return;

    try {
      // REMOVE BOOKMARK
      if (artist.isBookmarked) {
        if (!artist.bookmarkId) return;

        const res = await fetch(`/api/bookmarks/${artist.bookmarkId}`, {
          method: "DELETE",
        });

        const json = await res.json();
        if (!json.success) return;

        // Remove bookmarkId in state
        setArtists((prev) =>
          prev.map((a) =>
            a.id === artistId ? { ...a, bookmarkId: undefined } : a
          )
        );
      }

      // ADD BOOKMARK
      else {
        const res = await fetch(`/api/bookmarks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistId }),
        });

        const json = await res.json();
        if (!json.success) return;

        // Save the new bookmarkId so we can delete later
        setArtists((prev) =>
          prev.map((a) =>
            a.id === artistId ? { ...a, bookmarkId: json.data.id } : a
          )
        );
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  return (
    <div data-page="artists">
      <SiteLayout showPreloader={false} hideNavbar={false} hideBottomBar={true} className="lg:pt-20">
        <div className="min-h-screen lg:pt-4 overflow-x-hidden">
          {/* Header */}
          <div className="w-full px-4 lg:px-8 py-4 border-b border-[var(--border-color)]">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4 overflow-hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className=" text-white transition-colors flex-shrink-0"
                  aria-label="Go back"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                {/* Show active filter name if set */}
                {filters.category && (
                  <span className=" py-1 h3 text-white flex-shrink-0">
                    {(() => {
                      // Find matching category from VIDEO_CATEGORIES (case-insensitive)
                      const category = VIDEO_CATEGORIES.find(
                        cat => cat.value.toLowerCase() === filters.category.toLowerCase()
                      );
                      return category?.label || filters.category;
                    })()}
                  </span>
                )}
              </div>

              {/* Desktop Search Field - Hidden on Mobile */}
              <div className="hidden lg:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search artists by name or bio..."
                    className="w-full pl-10 pr-4 py-2 bg-card border border-border-color rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-pink focus:ring-1 focus:ring-primary-pink transition-colors"
                  />
                  {searchInput && (
                    <button
                      onClick={() => {
                        setSearchInput("");
                        setQuery("");
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <span className="text-sm text-gray-400 flex-shrink-0">
                {loading ? "Loading..." : `${totalResults} Results`}
              </span>
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden">
            <MobileFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              onViewResult={handleViewResult}
              resultCount={totalResults}
            />
          </div>

          {/* Main Layout */}
          <div className="max-w-7xl mx-auto px-4 lg:px-8 md:py-6 flex gap-8 overflow-x-hidden">
            {/* Desktop Filters */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <ArtistFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
                onViewResult={handleViewResult}
                resultCount={totalResults}
              />
            </div>

            {/* Artists Grid */}
            <div className="flex-1">
              {loading ? (
                isMobile ? (
                  <LoadingSpinner fullScreen={true} text="Loading artists..." />
                ) : (
                  <LoadingSpinner fullScreen={true} text="Loading artists..." />
                )
              ) : (
                <>
                  <ArtistGrid artists={artists} onBookmark={handleBookmark} />
                  {/* Infinite scroll trigger */}
                  {hasMore && (
                    <div ref={observerRef} style={{ height: 1 }} />
                  )}
                  {isFetchingMore && (
                    <div className="flex justify-center py-4 text-gray-400">Loading more artists...</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SiteLayout>
    </div>
  );
}

export default function ArtistsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientWrapper>
        <ArtistsPageContent />
      </ClientWrapper>
    </Suspense>
  );
}
