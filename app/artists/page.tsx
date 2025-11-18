"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import ArtistFilters from "@/components/sections/ArtistFilters";
import ArtistGrid from "@/components/sections/ArtistGrid";
import MobileFilters from "@/components/sections/MobileFilters";
import { Artist, Filters } from "@/types";
import LoadingSpinner from "@/components/ui/Loading";
import { transformArtist } from "./transformArtist";

const DEFAULT_LIMIT = 12;

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
    if (filters.category) params.set("type", filters.category);
    if (filters.subCategory) params.set("subType", filters.subCategory);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.language) params.set("language", filters.language);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.eventState) params.set("state", filters.eventState);
    if (filters.budget) params.set("budget", filters.budget);

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

export default function ArtistsPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filters, setFilters] = useState<Filters>({
    category: "",
    subCategory: "",
    gender: "",
    budget: "",
    eventState: "",
    eventType: "",
    language: "",
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { artists, total } = await getArtists(query, filters, page);
      console.log(artists)
      setArtists((prev) => (page === 1 ? artists : [...prev, ...artists]));
      setTotalResults(total);
      setLoading(false);
    };

    fetchData();
  }, [query, filters, page]);

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    setPage(1);
    setArtists([]);
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
    });
    setQuery("");
    setPage(1);
    setArtists([]);
  };

  const handleBookmark = (artistId: string) => {
    setArtists((prev) =>
      prev.map((artist) =>
        artist.id === artistId
          ? { ...artist, isBookmarked: !artist.isBookmarked }
          : artist
      )
    );
  };

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24">
        {/* Header - Full Width */}
        <div className="w-full px-4 lg:px-8 py-4 border-b border-gray-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-white">
                Singers & Artists
              </h1>
            </div>
            <span className="text-sm text-gray-400">
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
          />
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto md:px-4 lg:px-8 md:py-6 flex gap-8">
          {loading ? (
            <LoadingSpinner fullScreen={false} text="Loading artists..." />
          ) : (
            <>
              {" "}
              {/* Desktop Sidebar Filters */}
              <div className="hidden lg:block w-80 flex-shrink-0">
                <ArtistFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={resetFilters}
                  resultCount={totalResults}
                />
              </div>
              {/* Artists Grid */}
              <div className="flex-1">
                <ArtistGrid artists={artists} onBookmark={handleBookmark} />
              </div>
            </>
          )}{" "}
        </div>
      </div>
    </SiteLayout>
  );
}
