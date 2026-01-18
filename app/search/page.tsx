"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "@/components/icons/search";
import Image from "next/image";
import { Artist } from "@/types";
import MobileBottomBar from "@/components/layout/MobileBottomBar";
import LoadingSpinner from "@/components/ui/Loading";

const ARTIST_CATEGORIES = [ { value: 'singer', label: 'Singer' }, { value: 'dancer', label: 'Dancer' }, { value: 'musician', label: 'Musician' }, { value: 'comedian', label: 'Comedian' }, { value: 'magician', label: 'Magician' }, { value: 'actor', label: 'Actor' }, { value: 'anchor', label: 'Anchor'}, { value: 'band', label: 'Live Band'}, { value: 'dj', label: 'DJ'}, { value: 'other', label: 'Other' } ];

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
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(debouncedSearch)}&page=1`);
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
      const res = await fetch(`/api/artists/search?q=${encodeURIComponent(debouncedSearch)}&page=${page}`);
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
      const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (bottom && hasMore && !loading) {
        loadMoreArtists();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [search, hasMore, loading, debouncedSearch, page]);

  // Unique categories from all possible artist types (static)
  const filterCategories = useMemo(() => {
    return [{ label: "All", value: "all" }, ...ARTIST_CATEGORIES];
  }, []);

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
        (artist.category && artist.category.toLowerCase() === selectedCategory.toLowerCase());
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
      <div className="p-4 pb-2 flex flex-col">
        <div className="relative w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search any artist..."
            className="w-full rounded-full border border-[#333] bg-[#181818] pl-10 pr-4 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#333] text-base shadow-sm"
            style={{ boxShadow: 'none' }}
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      {(search.trim() || selectedCategory !== "all") && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
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
        <div className="px-4 pt-2">
          {filteredArtists.length === 0 && !loading && hasSearched ? (
            <div className="text-center text-gray-400 py-6">No artists found.</div>
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
                      src={artist.image || "/avatars/default.png"}
                      alt={artist.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover w-10 h-10"
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-base text-white">{artist.name}</span>
                      <span className="text-sm text-gray-400">{artist.category}</span>
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
      {!search.trim() && (
        <div className="px-4">
          <h2 className="text-lg font-semibold mb-4">Artist Categories</h2>
          <div className="flex flex-col gap-3">
            {filterCategories.slice(1).map((cat) => (
              <button
                key={cat.value}
                onClick={() => router.push(`/artists?type=${encodeURIComponent(cat.value)}`)}
                className="w-full flex justify-between items-center rounded-lg border border-[#FF4B2B] bg-gradient-to-r from-[#ed4a225f] to-[#e8047e52] px-4 py-3 text-left text-base font-medium text-white transition-all duration-300 hover:from-[#ED4B22] hover:to-[#E8047E] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/50"
              >
                <span>{cat.label}</span>
                <span className="text-white/90">&gt;</span>
              </button>
            ))}
          </div>
        </div>
      )}

     <MobileBottomBar />
    </div>
  );
}
