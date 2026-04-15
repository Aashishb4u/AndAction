"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import OptimizedVideoPlayer from "@/components/ui/OptimizedVideoPlayer";
import ArtistInfo from "@/components/sections/ArtistInfo";
import VideoCard from "@/components/ui/VideoCard";
import ShortsCard from "@/components/ui/ShortsCard";
import VideoCardSkeleton from "@/components/ui/VideoCardSkeleton";
import ShortsCardSkeleton from "@/components/ui/ShortsCardSkeleton";
import Image from "next/image";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  Loader2,
} from "lucide-react";
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getArtishName } from "@/lib/utils";

export default function VideoDetailsPage() {
  const params = useParams();
  const videoId = params.id as string;

  const [videoData, setVideoData] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showRelated, setShowRelated] = useState(false);

  // Pagination state for related content
  const [videosPage, setVideosPage] = useState(1);
  const [shortsPage, setShortsPage] = useState(1);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [hasMoreShorts, setHasMoreShorts] = useState(false);
  const [loadingMoreVideos, setLoadingMoreVideos] = useState(false);
  const [loadingMoreShorts, setLoadingMoreShorts] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  // ---------- FETCH DATA WITH BOOKMARK INFO ----------
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/videos/related?videoId=${videoId}&withBookmarks=true`,
        );
        const json = await res.json();

        if (!json.success || !json.data?.video) {
          setLoading(false);
          return;
        }

        const v = json.data.video;

        // MAIN VIDEO
        setVideoData({
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

        // RELATED VIDEOS (processed but not rendered yet)
        setRelatedVideos(
          json.data.related.map((rv: any) => ({
            id: rv.id,
            title: rv.title,
            creator: getArtishName(rv.user.name, rv.user.firstName, rv.user.lastName),
            thumbnail: rv.thumbnailUrl,
            videoUrl: rv.url,
            isBookmarked: rv.isBookmarked,
            bookmarkId: rv.bookmarkId,
            artistId: rv.user.artist?.id || "",
          })),
        );
        setHasMoreVideos(json.data.videosPagination?.hasNextPage || false);

        // SHORTS (processed but not rendered yet)
        setShorts(
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
        setHasMoreShorts(json.data.shortsPagination?.hasNextPage || false);
      } catch (error) {
        console.error("Error fetching video details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [videoId]);

  // Lazy load related content AFTER video player is ready (prevents blocking)
  useEffect(() => {
    if (isVideoReady && videoData) {
      // Delay rendering related content to prioritize video player
      const timer = setTimeout(() => {
        setShowRelated(true);
      }, 500); // 500ms after video is ready
      return () => clearTimeout(timer);
    }
  }, [isVideoReady, videoData]);

  // ---------- BOOKMARK TOGGLE (GLOBAL) ----------
  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
    try {
      // REMOVE

      if (!session?.user) {
        router.push("/auth/signin");
        return;
      }

      if (isBookmarked && bookmarkId) {
        await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });

        if (videoData?.id === id) {
          setVideoData((prev: any) => ({
            ...prev,
            isBookmarked: false,
            bookmarkId: null,
          }));
        }

        // Update related content
        setRelatedVideos((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, isBookmarked: false, bookmarkId: null } : v,
          ),
        );

        setShorts((prev) =>
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

      if (videoData?.id === id) {
        setVideoData((prev: any) => ({
          ...prev,
          isBookmarked: true,
          bookmarkId: newBookmarkId,
        }));
      }

      // Update related content
      setRelatedVideos((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, isBookmarked: true, bookmarkId: newBookmarkId }
            : v,
        ),
      );

      setShorts((prev) =>
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
  const handleShare = async (videoId: string) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;

      const shareUrl = `${baseUrl}/videos/${videoId}`;

      await navigator.clipboard.writeText(shareUrl);

      // 🔔 Toast success
      toast.success("Link copied to clipboard");
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to copy link");
    }
  };

  // ---------- LOAD MORE RELATED VIDEOS ----------
  const loadMoreVideos = async () => {
    if (loadingMoreVideos || !hasMoreVideos) return;
    setLoadingMoreVideos(true);
    try {
      const nextPage = videosPage + 1;
      const res = await fetch(
        `/api/videos/related?videoId=${videoId}&videosPage=${nextPage}&shortsPage=1&shortsLimit=0`,
      );
      const json = await res.json();
      if (json.success && json.data?.related) {
        const newVideos = json.data.related.map((rv: any) => ({
          id: rv.id,
          title: rv.title,
          creator: getArtishName(rv.user.name, rv.user.firstName, rv.user.lastName),
          thumbnail: rv.thumbnailUrl,
          videoUrl: rv.url,
          isBookmarked: rv.isBookmarked,
          bookmarkId: rv.bookmarkId,
          artistId: rv.user.artist?.id || "",
        }));
        setRelatedVideos((prev) => [...prev, ...newVideos]);
        setVideosPage(nextPage);
        setHasMoreVideos(json.data.videosPagination?.hasNextPage || false);
      }
    } catch (err) {
      console.error("Error loading more videos:", err);
    } finally {
      setLoadingMoreVideos(false);
    }
  };

  // ---------- LOAD MORE SHORTS ----------
  const loadMoreShorts = async () => {
    if (loadingMoreShorts || !hasMoreShorts) return;
    setLoadingMoreShorts(true);
    try {
      const nextPage = shortsPage + 1;
      const res = await fetch(
        `/api/videos/related?videoId=${videoId}&shortsPage=${nextPage}&videosPage=1&videosLimit=0`,
      );
      const json = await res.json();
      if (json.success && json.data?.shorts) {
        const newShorts = json.data.shorts.map((sv: any) => ({
          id: sv.id,
          title: sv.title,
          creator: getArtishName(sv.user.name, sv.user.firstName, sv.user.lastName),
          thumbnail: sv.thumbnailUrl,
          videoUrl: sv.url,
          isBookmarked: sv.isBookmarked,
          bookmarkId: sv.bookmarkId,
        }));
        setShorts((prev) => [...prev, ...newShorts]);
        setShortsPage(nextPage);
        setHasMoreShorts(json.data.shortsPagination?.hasNextPage || false);
      }
    } catch (err) {
      console.error("Error loading more shorts:", err);
    } finally {
      setLoadingMoreShorts(false);
    }
  };

  // ---------- STATES ----------
  if (loading) {
    return (
      <SiteLayout>
        <div>
          <LoadingOverlay text="Loading video..." />
        </div>
      </SiteLayout>
    );
  }

  if (!videoData) {
    return (
      <SiteLayout>
        <div className="text-center py-20 text-gray-400">Video not found.</div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout showPreloader={false} hideNavbar>
      <div className="min-h-screen pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto lg:px-8">
          {/* MAIN VIDEO - Sticky on mobile only */}
          <div className="sticky top-0 lg:top-20 z-50 lg:static lg:mb-8 bg-[#0f0f0f]">
            <OptimizedVideoPlayer
              videoUrl={videoData.videoUrl}
              title={videoData.title}
              poster={videoData.poster}
              className="mb-0"
              autoplay={true}
              videoId={videoData.id}
              onVideoReady={() => setIsVideoReady(true)}
            />
          </div>

          {/* SCROLLABLE CONTENT - Below video on mobile */}
          <div className="bg-[#0f0f0f] lg:bg-none">
            <div className="px-3 sm:px-6 lg:px-8 pt-4 lg:pt-0">
              <ArtistInfo
                artist={videoData.artist}
                video={{
                  id: videoData.id,
                  title: videoData.title,
                  description: videoData.description,
                  views: videoData.views,
                  uploadDate: videoData.uploadDate,
                }}
                isBookmarked={videoData.isBookmarked}
                bookmarkId={videoData.bookmarkId}
                onBookmark={() =>
                  toggleBookmark({
                    id: videoData.id,
                    isBookmarked: videoData.isBookmarked,
                    bookmarkId: videoData.bookmarkId,
                  })
                }
                onShare={() => handleShare(videoData.id)}
              />
            </div>

            {/* RELATED VIDEOS - Show skeletons while video loads, then actual content */}
            {relatedVideos.length > 0 && (
              <section className="mb-4 px-3 sm:px-6 lg:px-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  More from this artist
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {!showRelated ? (
                    // Show skeletons while waiting for video to render
                    <>
                      <VideoCardSkeleton />
                      <VideoCardSkeleton />
                      <VideoCardSkeleton />
                      <VideoCardSkeleton />
                    </>
                  ) : (
                    // Show actual videos after main video is ready
                    relatedVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        id={video.id}
                        title={video.title}
                        creator={video.creator}
                        thumbnail={video.thumbnail}
                        videoUrl={video.videoUrl}
                        isBookmarked={video.isBookmarked}
                        bookmarkId={video.bookmarkId}
                        onBookmark={(data) => toggleBookmark(data)}
                        onShare={() => handleShare(video.id)}
                        artistId={video.artistId}
                      />
                    ))
                  )}
                </div>

                {/* Load More Videos */}
                {hasMoreVideos && showRelated && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={loadMoreVideos}
                      disabled={loadingMoreVideos}
                      className="px-6 py-2 rounded-full font-medium text-sm border transition-all bg-background text-white border-[#2D2D2D] hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMoreVideos ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* SHORTS - Show skeletons while video loads, then actual content */}
            {shorts.length > 0 && (
              <section className="mb-4 px-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/shorts.svg" alt="Shorts" width={24} height={24} />
                  <h2 className="text-2xl font-bold text-white">Shorts</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {!showRelated ? (
                    // Show skeletons while waiting for video to render
                    <>
                      <ShortsCardSkeleton />
                      <ShortsCardSkeleton />
                      <ShortsCardSkeleton />
                      <ShortsCardSkeleton />
                      <ShortsCardSkeleton />
                      <ShortsCardSkeleton />
                    </>
                  ) : (
                    // Show actual shorts after main video is ready
                    shorts.map((short) => (
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
                    ))
                  )}
                </div>

                {/* Load More Shorts */}
                {hasMoreShorts && showRelated && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={loadMoreShorts}
                      disabled={loadingMoreShorts}
                      className="px-6 py-2 rounded-full font-medium text-sm border transition-all bg-background text-white border-[#2D2D2D] hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMoreShorts ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
