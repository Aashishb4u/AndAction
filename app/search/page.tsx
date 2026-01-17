"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "@/components/icons/search";
import Image from "next/image";
import { Artist } from "@/types";
import MobileBottomBar from "@/components/layout/MobileBottomBar";

const ARTIST_CATEGORIES = [
  { label: "Signer", value: "singer" },
  { label: "Devotional/Spiritual singer", value: "devotional" },
  { label: "Anchor", value: "anchor" },
  { label: "Dj/Vj", value: "dj" },
  { label: "Dancer", value: "dancer" },
];

export default function MobileSearchPage() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(ARTIST_CATEGORIES);
  const [artists, setArtists] = useState<Artist[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const router = useRouter();

    // Fetch all artists on mount
    useEffect(() => {
      async function fetchAllArtists() {
        try {
          const res = await fetch("/api/artists/all");
          const json = await res.json();
          const allArtists = json.data?.artists || [];
          const mapped = allArtists.map((a: any) => ({
            id: a.id,
            name: a.stageName || `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim(),
            category: a.artistType,
            subCategory: [a.subArtistType],
            location: `${a.user?.city || ""}${a.user?.state ? ", " + a.user.state : ""}`,
            image: a.user?.avatar && a.user?.avatar.startsWith('/') ? a.user.avatar : "/icons/images.jpeg",
            bio: a.shortBio || "",
            yearsOfExperience: a.yearsOfExperience || 0,
            achievements: [a.achievements],
            subArtistTypes: [a.subArtistType],
            languages: [a.performingLanguage],
            soloChargesFrom: a.soloChargesFrom || 0,
            soloChargesTo: a.soloChargesTo || 0,
            soloChargesDescription: a.soloChargesDescription || "",
            chargesWithBacklineFrom: a.chargesWithBacklineFrom || 0,
            chargesWithBacklineTo: a.chargesWithBacklineTo || 0,
            chargesWithBacklineDescription: a.chargesWithBacklineDescription || "",
            performingDurationFrom: a.performingDurationFrom || "",
            performingDurationTo: a.performingDurationTo || "",
            performingMembers: a.performingMembers || "",
            offStageMembers: a.offStageMembers || "",
            performingEventType: a.performingEventType || "",
            performingStates: a.performingStates || "",
            duration: `${a.performingDurationFrom || ""} - ${a.performingDurationTo || ""} minutes`,
            startingPrice: Number(a.soloChargesFrom) || 0,
            phone: a.contactNumber || "",
            whatsapp: a.whatsappNumber || "",
            userId: a.user?.id,
          }));
          setArtists(mapped);
        } catch {
          setArtists([]);
        }
      }
      fetchAllArtists();
    }, []);

    // Unique categories from artist data
    const filterCategories = React.useMemo(() => {
      const cats = new Set<string>();
      artists.forEach((a) => {
        if (a.category) cats.add(a.category);
      });
      return ["all", ...Array.from(cats)];
    }, [artists]);

    // Filter artists by search and selected category
    const filteredArtists = React.useMemo(() => {
      return artists.filter((artist) => {
        const matchesSearch =
          !search.trim() ||
          (artist.name && artist.name.toLowerCase().includes(search.toLowerCase())) ||
          (artist.category && artist.category.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory =
          selectedCategory === "all" ||
          (artist.category && artist.category.toLowerCase() === selectedCategory.toLowerCase());
        return matchesSearch && matchesCategory;
      });
    }, [artists, search, selectedCategory]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    };

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
          <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-white text-black" : "bg-[#232323] text-white border-[#333]"}`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        )}

        {/* Artist Suggestions */}
        {search.trim() && (
          <div className="px-4 pt-2">
            {filteredArtists.length === 0 ? (
              <div className="text-center text-gray-400 py-6">No artists found.</div>
            ) : (
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
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="w-full flex justify-between items-center rounded-lg border border-[#FF4B2B] bg-gradient-to-r from-[#ed4a225f] to-[#e8047e52] px-4 py-3 text-left text-base font-medium text-white transition-all duration-300 hover:from-[#ED4B22] hover:to-[#E8047E] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/50"
                >
                  <span>{cat}</span>
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
