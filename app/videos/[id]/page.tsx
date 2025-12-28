'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import VideoPlayer from '@/components/ui/VideoPlayer';
import ArtistInfo from '@/components/sections/ArtistInfo';
import VideoCard from '@/components/ui/VideoCard';
import ShortsCard from '@/components/ui/ShortsCard';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

export default function VideoDetailsPage() {
  const params = useParams();
  const videoId = params.id as string;

  const [videoData, setVideoData] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: session } = useSession();
  const router = useRouter();

  // ---------- FETCH DATA WITH BOOKMARK INFO ----------
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/videos/related?videoId=${videoId}&withBookmarks=true`
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
          description: v.description ?? '',
          videoUrl: v.url,
          poster: v.thumbnailUrl,
          views: v.views,
          uploadDate: v.createdAt,
          isBookmarked: v.isBookmarked,
          bookmarkId: v.bookmarkId,
          artist: {
            id: v.user.id,
            name: `${v.user.firstName} ${v.user.lastName}`,
            avatar: v.user.avatar,
            verified: v.user.isArtistVerified,
          },
        });

        // RELATED VIDEOS
        setRelatedVideos(
          json.data.related.map((rv: any) => ({
            id: rv.id,
            title: rv.title,
            creator: `${rv.user.firstName} ${rv.user.lastName}`,
            thumbnail: rv.thumbnailUrl,
            videoUrl: rv.url,
            isBookmarked: rv.isBookmarked,
            bookmarkId: rv.bookmarkId,
          }))
        );

        // SHORTS
        setShorts(
          json.data.shorts.map((sv: any) => ({
            id: sv.id,
            title: sv.title,
            creator: `${sv.user.firstName} ${sv.user.lastName}`,
            thumbnail: sv.thumbnailUrl,
            videoUrl: sv.url,
            isBookmarked: sv.isBookmarked,
            bookmarkId: sv.bookmarkId,
          }))
        );
      } catch (error) {
        console.error('Error fetching video details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [videoId]);

  // ---------- BOOKMARK TOGGLE (GLOBAL) ----------
  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
    try {
      // REMOVE

      if (!session?.user) {
        router.push("/auth/signin");
        return;
      }

      if (isBookmarked && bookmarkId) {
        await fetch(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' });

        if (videoData?.id === id) {
          setVideoData((prev: any) => ({
            ...prev,
            isBookmarked: false,
            bookmarkId: null,
          }));
        }

        setRelatedVideos(prev =>
          prev.map(v =>
            v.id === id ? { ...v, isBookmarked: false, bookmarkId: null } : v
          )
        );

        setShorts(prev =>
          prev.map(s =>
            s.id === id ? { ...s, isBookmarked: false, bookmarkId: null } : s
          )
        );

        return;
      }

      // CREATE
      const res = await fetch(`/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      setRelatedVideos(prev =>
        prev.map(v =>
          v.id === id
            ? { ...v, isBookmarked: true, bookmarkId: newBookmarkId }
            : v
        )
      );

      setShorts(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, isBookmarked: true, bookmarkId: newBookmarkId }
            : s
        )
      );
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  // ---------- SHARE ----------
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

  // ---------- STATES ----------
  if (loading) {
    return (
      <SiteLayout>
        <div className="text-center py-20 text-gray-400">Loading...</div>
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
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-16 lg:pt-20 pb-28">
        <div className="max-w-7xl mx-auto lg:px-8">

          {/* MAIN VIDEO */}
          <div className="mb-8">
            <VideoPlayer
              videoUrl={videoData.videoUrl}
              title={videoData.title}
              poster={videoData.poster}
              className="mb-4"
            />

            <div className="px-4 sm:px-6 lg:px-8">
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
          </div>

          {/* RELATED VIDEOS */}
          <section className="mb-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-white mb-4">
              More from this artist
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {relatedVideos.map(video => (
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
          </section>

          {/* SHORTS */}
          <section className="mb-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/shorts.svg" alt="Shorts" width={24} height={24} />
              <h2 className="text-2xl font-bold text-white">Shorts</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {shorts.map(short => (
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
          </section>

        </div>
      </div>
    </SiteLayout>
  );
}
