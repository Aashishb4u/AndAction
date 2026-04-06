"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import ShortsCard from "@/components/ui/ShortsCard";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Share2, Bookmark, BookmarkCheck } from "lucide-react";
import Image from "next/image";
import { getArtishName } from "@/lib/utils";

export default function ShortDetailsPage() {
  const params = useParams();
  const shortId = params.id as string;

  const [shortData, setShortData] = useState<any>(null);
  const [relatedShorts, setRelatedShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: session } = useSession();
  const router = useRouter();

  // ---------- FETCH DATA WITH BOOKMARK INFO ----------
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/videos/related?videoId=${shortId}&withBookmarks=true`,
        );
        const json = await res.json();

        if (!json.success || !json.data?.video) {
          setLoading(false);
          return;
        }

        const v = json.data.video;

        // MAIN SHORT
        setShortData({
          id: v.id,
          title: v.title,
          description: v.description ?? "",
          videoUrl: v.url,
          poster: v.thumbnailUrl,
          views: v.views,
          uploadDate: v.createdAt,
          isBookmarked: v.isBookmarked,
          bookmarkId: v.bookmarkId,
          artist: {
            id: v.user?.artist?.id,
            name: getArtishName(v.user.name, v.user.firstName, v.user.lastName),
            avatar: v.user.avatar,
            verified: v.user.isArtistVerified,
          },
        });

        // RELATED SHORTS
        setRelatedShorts(
          json.data.shorts.map((sv: any) => ({
            id: sv.id,
            title: sv.title,
            creator: getArtishName(sv.user.name, sv.user.firstName, sv.user.lastName),
            thumbnail: sv.thumbnailUrl,
            videoUrl: sv.url,
            isBookmarked: sv.isBookmarked,
            bookmarkId: sv.bookmarkId,
          })),
        );
      } catch (error) {
        console.error("Error fetching short details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [shortId]);

  // ---------- BOOKMARK TOGGLE ----------
  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
    try {
      if (!session?.user) {
        router.push("/auth/signin");
        return;
      }

      // REMOVE
      if (isBookmarked && bookmarkId) {
        await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });

        if (shortData?.id === id) {
          setShortData((prev: any) => ({
            ...prev,
            isBookmarked: false,
            bookmarkId: null,
          }));
        }

        setRelatedShorts((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isBookmarked: false, bookmarkId: null } : s,
          ),
        );

        return;
      }

      // CREATE
      const res = await fetch(`/api/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id }),
      });

      const json = await res.json();
      const newBookmarkId = json?.data?.bookmark?.id;

      if (shortData?.id === id) {
        setShortData((prev: any) => ({
          ...prev,
          isBookmarked: true,
          bookmarkId: newBookmarkId,
        }));
      }

      setRelatedShorts((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isBookmarked: true, bookmarkId: newBookmarkId }
            : s,
        ),
      );
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  // ---------- SHARE ----------
  const handleShare = async (shortId: string) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;

      const shareUrl = `${baseUrl}/shorts/${shortId}`;

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to copy link");
    }
  };

  // ---------- STATES ----------
  if (loading) {
    return (
      <SiteLayout>
        <div className="text-center py-20 text-gray-400">Loading...</div>
      </SiteLayout>
    );
  }

  if (!shortData) {
    return (
      <SiteLayout>
        <div className="text-center py-20 text-gray-400">Short not found.</div>
      </SiteLayout>
    );
  }

  // Helper to check if URL is YouTube
  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );
    return match ? match[1] : null;
  };

  const isYouTube = isYouTubeUrl(shortData.videoUrl);
  const youtubeVideoId = isYouTube
    ? getYouTubeVideoId(shortData.videoUrl)
    : null;

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-16 lg:pt-20 pb-28 bg-black">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Short - Left Side */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="lg:sticky lg:top-20">
                {/* Video Player - Sticky on mobile */}
                <div className="sticky top-0 lg:static z-50 bg-black">
                  <div className="relative w-full aspect-[9/16] max-h-[70vh] mx-auto bg-black rounded-2xl overflow-hidden">
                    {isYouTube && youtubeVideoId ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        playsInline
                        poster={shortData.poster}
                      >
                        <source src={shortData.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </div>

                {/* Short Info */}
                <div className="mt-6 space-y-4">
                  {/* Artist Info */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                      {shortData.artist.avatar ? (
                        <Image
                          src={shortData.artist.avatar}
                          alt={shortData.artist.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                          {shortData.artist.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">
                          {shortData.artist.name}
                        </h3>
                        {shortData.artist.verified && (
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {shortData.views.toLocaleString()} views
                      </p>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-xl font-bold text-white">
                    {shortData.title}
                  </h1>

                  {/* Description */}
                  {shortData.description && (
                    <p className="text-gray-300 text-sm">
                      {shortData.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:gap-4 pt-2 flex-wrap">
                    <button
                      onClick={() =>
                        toggleBookmark({
                          id: shortData.id,
                          isBookmarked: shortData.isBookmarked,
                          bookmarkId: shortData.bookmarkId,
                        })
                      }
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      {shortData.isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5 text-primary-pink" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-white" />
                      )}
                      <span className="text-white text-xs sm:text-sm">
                        {shortData.isBookmarked ? "Bookmarked" : "Bookmark"}
                      </span>
                    </button>

                    <button
                      onClick={() => handleShare(shortData.id)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                      <span className="text-white text-xs sm:text-sm">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Shorts - Right Side */}
            <div className="lg:col-span-7 xl:col-span-8">
              <h2 className="text-xl font-bold text-white mb-4">
                More shorts from {shortData.artist.name}
              </h2>

              {relatedShorts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {relatedShorts.map((short) => (
                    <ShortsCard
                      key={short.id}
                      id={short.id}
                      title={short.title}
                      creator={short.creator}
                      thumbnail={short.thumbnail}
                      videoUrl={short.videoUrl}
                      isBookmarked={short.isBookmarked}
                      bookmarkId={short.bookmarkId}
                      onBookmark={(data) => toggleBookmark(data)}
                      onShare={() => handleShare(short.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No more shorts from this artist
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
