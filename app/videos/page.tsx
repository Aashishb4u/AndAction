'use client';

import React, { useState, useEffect } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import VideoCard from '@/components/ui/VideoCard';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: session } = useSession();
  const router = useRouter();

  // ---------- FETCH VIDEOS WITH BOOKMARK INFO ----------
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?type=videos&withBookmarks=true');
        const json = await res.json();

        if (json.success) {
          const mapped = json.data.videos.map((v: any) => ({
            id: v.id,
            title: v.title,
            creator: `${v.user.firstName} ${v.user.lastName}`,
            thumbnail: v.thumbnailUrl,
            videoUrl: v.url,

            // 🔥 bookmark data
            isBookmarked: v.isBookmarked,
            bookmarkId: v.bookmarkId,
          }));

          setVideos(mapped);
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  // ---------- TOGGLE BOOKMARK ----------
  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
    try {
      // REMOVE bookmark

      if (!session?.user) {
      router.push("/auth/signin");
      return;
    }
      if (isBookmarked && bookmarkId) {
        await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: 'DELETE',
        });

        setVideos(prev =>
          prev.map(v =>
            v.id === id
              ? { ...v, isBookmarked: false, bookmarkId: null }
              : v
          )
        );
        return;
      }

      // CREATE bookmark
      const res = await fetch(`/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id }),
      });

      const json = await res.json();
      const newBookmarkId = json?.data?.bookmark?.id;

      setVideos(prev =>
        prev.map(v =>
          v.id === id
            ? { ...v, isBookmarked: true, bookmarkId: newBookmarkId }
            : v
        )
      );
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleShare = async (videoId: string) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_NEXTAUTH_URL ||
        window.location.origin;

      const shareUrl = `${baseUrl}/videos/${videoId}`;

      await navigator.clipboard.writeText(shareUrl);

      // 🔔 Toast success
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Failed to copy link');
    }
  };


  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24 pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

          {/* Loading */}
          {loading && (
            <div className="text-center py-20 text-gray-400">
              Loading videos...
            </div>
          )}

          {/* Videos Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {videos.map((video) => (
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
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                No videos found.
              </p>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
