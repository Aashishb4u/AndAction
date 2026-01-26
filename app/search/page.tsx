"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "@/components/icons/search";
import Image from "next/image";
import { Artist } from "@/types";
import MobileBottomBar from "@/components/layout/MobileBottomBar";
import LoadingSpinner from "@/components/ui/Loading";
import { buildArtishProfileUrl } from "@/lib/utils";

const ARTIST_CATEGORIES = [
  { value: "singer", label: "Singer" },
  { value: "dancer", label: "Dancer" },
  { value: "musician", label: "Musician" },
  { value: "comedian", label: "Comedian" },
  { value: "magician", label: "Magician" },
  { value: "actor", label: "Actor" },
  { value: "anchor", label: "Anchor" },
  { value: "band", label: "Live Band" },
  { value: "dj", label: "DJ" },
  { value: "other", label: "Other" },
];

export default function MobileSearchPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  // Fetch artist suggestions based on debounced search and page
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setArtists([]);
      setLoading(false);
      setHasSearched(false);
      setPage(1);
      setHasMore(true);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    async function fetchSuggestions() {
      try {
        const res = await fetch(
          `/api/artists/search?q=${encodeURIComponent(debouncedSearch)}&page=1`,
        );
        const json = await res.json();
        setArtists(json.data?.artists || []);
        setHasMore((json.data?.artists?.length || 0) === 10); // 10 is the page size
        setPage(2);
      } catch {
        setArtists([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [debouncedSearch]);

  // Load more artists on scroll
  const loadMoreArtists = async () => {
    if (!debouncedSearch.trim() || loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/artists/search?q=${encodeURIComponent(debouncedSearch)}&page=${page}`,
      );
      const json = await res.json();
      setArtists((prev) => [...prev, ...(json.data?.artists || [])]);
      setHasMore((json.data?.artists?.length || 0) === 10);
      setPage((prev) => prev + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    if (!search.trim()) return;
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (bottom && hasMore && !loading) {
        loadMoreArtists();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [search, hasMore, loading, debouncedSearch, page]);

  // Show all categories if no search, otherwise only those with artists
  const filterCategories = useMemo(() => {
    // Map category value to label for lookup
    const categoryMap = ARTIST_CATEGORIES.reduce((acc, cat) => {
      acc[cat.value.toLowerCase()] = cat.label;
      return acc;
    }, {} as Record<string, string>);

    // If no search, show all categories
    if (!search.trim()) {
      return [{ label: "All", value: "all" }, ...ARTIST_CATEGORIES.map(cat => ({ label: cat.label, value: cat.value }))];
    }

    // Find unique categories present in the current artists list
    const presentCategories = Array.from(
      new Set(
        artists
          .map((artist) => artist.category && artist.category.toLowerCase())
          .filter((cat) => cat && categoryMap[cat])
      )
    );

    // Build the filter list: All + only categories with artists
    const filtered = [
      { label: "All", value: "all" },
      ...presentCategories.map((cat) => ({ label: categoryMap[cat], value: cat }))
    ];
    return filtered;
  }, [artists, search]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [search]);

  // Filter artists by debounced search and selected category
  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (artist.category &&
          artist.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchesCategory;
    });
  }, [artists, selectedCategory]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // When search changes, reset page and hasMore
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="p-4 pb-2 mt-2 flex flex-col">
        <div className="relative w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search any artist..."
            className="w-full rounded-full border border-[#333] bg-[#181818] pl-10 pr-12 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#333] text-base shadow-sm"
            style={{ boxShadow: "none" }}
          />
          {search.trim() && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              onClick={() => setSearch("")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      {(search.trim() || selectedCategory !== "all") && (
        <div
          className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filterCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-1 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${selectedCategory === cat.value ? "bg-white text-black" : "bg-[#232323] text-white border-[#333]"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Artist Suggestions */}
      {search.trim() && (
        <div className="px-4 pt-2 pb-24">
          {filteredArtists.length === 0 && !loading && hasSearched ? (
            <div className="text-center text-gray-400 py-6">
              No artists found.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {filteredArtists.map((artist) => (
                  <button
                    key={artist.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#222] transition"
                    onClick={() => router.push(`/artists/${artist.id}`)}
                  >
                    <Image
                      src={buildArtishProfileUrl(artist.image)}
                      alt={artist.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover w-10 h-10"
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-base text-white">
                        {artist.name}
                      </span>
                      <span className="text-sm text-gray-400">
                        {artist.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {loading && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="md" text="" />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Categories (if not searching) */}
      {!search.trim() && filterCategories.length > 1 && (
        <div className="px-4 py-4 pb-24">
          <h2 className="text-lg font-semibold mb-4 text-[#F2F2F2]">Artist Categories</h2>
          <div className="flex flex-col gap-3">
            {filterCategories.slice(1).map((cat) => (
              <button
                key={cat.value}
                onClick={() =>
                  router.push(`/artists?type=${encodeURIComponent(cat.value)}`)
                }
                className="w-full flex justify-between items-center rounded-full border border-[#FF4B2B] bg-[#e8047e52] px-4 py-3 text-left text-base font-medium text-white transition-all duration-300 hover:from-[#ED4B22] hover:to-[#E8047E] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/50"
              >
                <span className="text-[#F2F2F2]">{cat.label}</span>
                <span className="text-[#F2F2F2] flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <MobileBottomBar />
    </div>
  );
}
