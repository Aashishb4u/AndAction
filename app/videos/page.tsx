"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import SiteLayout from "@/components/layout/SiteLayout";
import VideoCard from "@/components/ui/VideoCard";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useInfiniteVideos, useToggleBookmark } from "@/hooks/use-videos";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import { 
  X,
  Copy,
  MessageCircle,
  Facebook,
  Twitter,
  Mail,
  Linkedin,
  Loader2,
} from "lucide-react";
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getArtishName } from "@/lib/utils";

export default function VideosPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { categoriesWithAll } = useArtistCategories();
  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categoriesWithAll) {
      map.set(category.value.toLowerCase(), category.label);
      map.set(category.label.toLowerCase(), category.label);
    }
    return map;
  }, [categoriesWithAll]);

  const resolveArtistTypeLabel = useCallback(
    (rawValue?: string) => {
      const raw = (rawValue || "").trim();
      if (!raw) return "";
      return categoryLabelMap.get(raw.toLowerCase()) || raw;
    },
    [categoryLabelMap],
  );
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    videoId: string;
    title: string;
  }>({
    isOpen: false,
    videoId: "",
    title: "",
  });

  const { data: session } = useSession();
  const router = useRouter();

  // Responsive limit: 6 on mobile, 12 on desktop
  const [videoLimit, setVideoLimit] = useState(12);
  useEffect(() => {
    const updateLimit = () => {
      setVideoLimit(window.innerWidth < 768 ? 6 : 12);
    };
    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  // Use infinite query hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteVideos({
    type: "videos",
    category: selectedCategory,
    withBookmarks: true,
    limit: videoLimit,
    random: true,
  });

  const toggleBookmarkMutation = useToggleBookmark();

  // Flatten all pages into single array
  const allVideos =
    data?.pages.flatMap((page) =>
      page.videos.map((v) => ({
        id: v.id,
        title: v.title,
        creator: getArtishName(v.user.name, v.user.firstName, v.user.lastName),
        userId: v.user.id, // Add userId for grouping
        thumbnail: v.thumbnailUrl,
        videoUrl: v.url,
        category: v.user.artists?.[0]?.artistType || "",
        isBookmarked: v.isBookmarked || false,
        bookmarkId: v.bookmarkId || null,
        creatorImage: v.user.avatar || v.user.image || undefined,
        artistType: resolveArtistTypeLabel(v.user.artists?.[0]?.artistType),
        artistId: v.user.artists?.[0]?.id || "",
      })),
    ) || [];

  // Group videos by artist (all videos from one artist together)
  const groupedVideos = useMemo(() => {
    if (!allVideos.length) return [];

    // Group by userId
    const videosByArtist = allVideos.reduce((acc, video) => {
      if (!acc[video.userId]) {
        acc[video.userId] = [];
      }
      acc[video.userId].push(video);
      return acc;
    }, {} as Record<string, typeof allVideos>);

    // Flatten back to array, maintaining artist grouping
    // Get unique artist IDs in order of first appearance
    const artistOrder: string[] = [];
    allVideos.forEach(video => {
      if (!artistOrder.includes(video.userId)) {
        artistOrder.push(video.userId);
      }
    });

    // Return videos grouped by artist
    return artistOrder.flatMap(artistId => videosByArtist[artistId]);
  }, [allVideos]);

  // Infinite scroll: auto-fetch when sentinel enters viewport
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Toggle bookmark handler
  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    toggleBookmarkMutation.mutate({
      videoId: id,
      bookmarkId,
      isBookmarked,
    });
  };

  const handleShare = async (videoId: string) => {
    const video = groupedVideos.find((v) => v.id === videoId);
    const shareTitle = video?.title || "Check out this video";
    setShareModal({ isOpen: true, videoId, title: shareTitle });
  };

  const getShareUrl = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;
    return `${baseUrl}/videos/${shareModal.videoId}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast.success("Link copied to clipboard");
      setShareModal({ isOpen: false, videoId: "", title: "" });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareModal.title} - ${getShareUrl()}`)}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, videoId: "", title: "" });
      },
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, videoId: "", title: "" });
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareModal.title)}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, videoId: "", title: "" });
      },
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, "_blank");
        setShareModal({ isOpen: false, videoId: "", title: "" });
      },
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600 hover:bg-gray-700",
      action: () => {
        const url = `mailto:?subject=${encodeURIComponent(shareModal.title)}&body=${encodeURIComponent(`Check out this video: ${getShareUrl()}`)}`;
        window.location.href = url;
        setShareModal({ isOpen: false, videoId: "", title: "" });
      },
    },
  ];

  return (
    <SiteLayout showPreloader={false} hideNavbarOnMobile={true}>
      <div className="min-h-screen md:pt-20 pb-28">
        {/* Category Filter Chips */}
        <div
          className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide bg-[#1B1B1B] p-4 border-y border-border-line sticky top-0 md:static z-10"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categoriesWithAll.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                selectedCategory === category.value
                  ? "bg-white border-white"
                  : "bg-background text-white border-[#2D2D2D] hover:border-gray-400"
              }`}
            >
              <span
                className={
                  selectedCategory === category.value
                    ? "text-transparent bg-clip-text bg-linear-to-r from-[#ED4B22] to-[#E8047E]"
                    : ""
                }
              >
                {category.label}
              </span>
            </button>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Initial Loading */}
          {isLoading && (
            <LoadingOverlay text="Loading videos..." />
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-20">
              <p className="text-red-400 text-lg">Failed to load videos</p>
              <p className="text-gray-400 text-sm mt-2">
                Please try again later
              </p>
            </div>
          )}

          {/* Videos Grid */}
          {!isLoading && !isError && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {groupedVideos.map((video, idx) => (
                  <VideoCard
                    key={`video-${video.id}-${idx}`}
                    id={video.id}
                    title={video.title}
                    creator={video.creator}
                    artistType={video.artistType}
                    creatorImage={video.creatorImage}
                    thumbnail={video.thumbnail}
                    videoUrl={video.videoUrl}
                    isBookmarked={video.isBookmarked}
                    bookmarkId={video.bookmarkId}
                    onBookmark={(data) => toggleBookmark(data)}
                    onShare={() => handleShare(video.id)}
                    artistId={video.artistId}
                    enableMobileAutoplay={true}
                  />
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-pink" />
                      <span>Loading more videos...</span>
                    </div>
                )}
              </div>
              )}

              {/* End of List */}
              {!hasNextPage && groupedVideos.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    You&apos;ve reached the end
                  </p>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !isError && groupedVideos.length === 0 && (
            <div className="text-center py-16">
              <img src="/blank.png" alt="No videos" className="w-48 h-48 mx-auto mb-6" />
              <p className="text-gray-400 text-lg">
                {selectedCategory === "all"
                  ? "No videos found."
                  : `No ${selectedCategory} videos found.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() =>
            setShareModal({ isOpen: false, videoId: "", title: "" })
          }
        >
          <div
            className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Share Video</h3>
              <button
                onClick={() =>
                  setShareModal({ isOpen: false, videoId: "", title: "" })
                }
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Video Title */}
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">
              {shareModal.title}
            </p>

            {/* Share Options Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl ${option.color} transition-all transform hover:scale-105`}
                >
                  <option.icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Copy Link Section */}
            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-transparent text-gray-300 text-sm outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-primary-pink hover:bg-primary-pink/80 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
