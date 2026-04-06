"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "@/components/icons/search";
import Image from "next/image";
import { Artist } from "@/types";
import MobileBottomBar from "@/components/layout/MobileBottomBar";
import LoadingSpinner from "@/components/ui/Loading";
import { buildArtishProfileUrl } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useArtistCategories } from "@/hooks/use-artist-categories";

const fetchArtists = async ({
  pageParam = 1,
  query,
}: {
  pageParam?: number;
  query: string;
}) => {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    search: query,
    page: String(pageParam),
    limit: "10",
  });

  const res = await fetch(`/api/artists?${params.toString()}`);
  const json = await res.json();
  return json.data?.artists || [];
};

export default function MobileSearchPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { categoriesWithAll } = useArtistCategories();
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["artists", debouncedSearch],
      queryFn: ({ pageParam }) =>
        fetchArtists({ pageParam, query: debouncedSearch }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === 10 ? allPages.length + 1 : undefined;
      },
      enabled: !!debouncedSearch.trim(),
      placeholderData: (previousData) => previousData,
    });

  const artists = useMemo(() => {
    return (data?.pages.flat() as Artist[]) || [];
  }, [data]);

  const loading = isFetching || isFetchingNextPage;
  const hasSearched = !!debouncedSearch.trim();

  // Infinite scroll effect
  useEffect(() => {
    if (!debouncedSearch.trim()) return;
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (bottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [debouncedSearch, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Show all categories if no search, otherwise only those with artists
  const filterCategories = useMemo(() => {
    return categoriesWithAll;
  }, [categoriesWithAll]);

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="p-4 pb-2 mt-2 flex flex-col">
        <div className="relative w-full ">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {/* Fix 3 - when i type smthg the search icon must become white only when i type smthg in search box */}
            <SearchIcon className={`w-6 h-6 ${search.trim() ? "text-white" : "text-gray-400"}`} />
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search any artist..."
            className="w-full rounded-full border border-[#333] bg-[#181818] pl-12 pr-12 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#333] text-base shadow-sm"
            style={{ boxShadow: "none" }}
          />
          {search.trim() && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              onClick={() => setSearch("")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      {(search.trim() || selectedCategory !== "all") && (
        <div className="relative">
          <div
            className="flex gap-2 px-4 p-2 overflow-x-auto scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filterCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                // Fix 2 only the acive option's text must have gradient - linear gradient (#ED4B22 , #E8047E)
                className={`px-4 py-1 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${selectedCategory === cat.value ? "bg-white border-white" : "bg-background-light text-white border-border-color"}`}
              >
                <span className={selectedCategory === cat.value ? "bg-gradient-to-r from-[#ED4B22] to-[#E8047E] bg-clip-text text-transparent" : ""}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
          {/* Blur effect on the right */}
          <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none" />
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
                className="w-full flex justify-between items-center rounded-full category-btn-gradient px-4 py-3 text-left text-base font-medium text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
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
