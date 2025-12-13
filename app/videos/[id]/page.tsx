'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import VideoPlayer from '@/components/ui/VideoPlayer';
import ArtistInfo from '@/components/sections/ArtistInfo';
import VideoCard from '@/components/ui/VideoCard';
import ShortsCard from '@/components/ui/ShortsCard';
import Image from 'next/image';

export default function VideoDetailsPage() {
  const params = useParams();
  const videoId = params.id as string;

  const [videoData, setVideoData] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
  async function fetchData() {
    try {
      const res = await fetch(`/api/videos/related?videoId=${videoId}`);
      const json = await res.json();

      if (!json.success || !json.data?.video) {
        setLoading(false);
        return;
      }

      const apiVideo = json.data.video;

      setVideoData({
        id: apiVideo.id,
        title: apiVideo.title,
        description: apiVideo.description ?? "",
        videoUrl: apiVideo.url,
        poster: apiVideo.thumbnailUrl,
        views: apiVideo.views,
        uploadDate: apiVideo.createdAt,
        artist: {
          id: apiVideo.user.id,
          name: `${apiVideo.user.firstName} ${apiVideo.user.lastName}`,
          avatar: apiVideo.user.avatar,
          verified: apiVideo.user.isArtistVerified,
        },
      });

      // Related Videos
      setRelatedVideos(
        json.data.related.map((v: any) => ({
          id: v.id,
          title: v.title,
          creator: `${v.user.firstName} ${v.user.lastName}`,
          thumbnail: v.thumbnailUrl,
          videoUrl: v.url,
        }))
      );

      // Shorts
      setShorts(
        json.data.shorts.map((v: any) => ({
          id: v.id,
          title: v.title,
          creator: `${v.user.firstName} ${v.user.lastName}`,
          thumbnail: v.thumbnailUrl,
          videoUrl: v.url,
        }))
      );

    } catch (error) {
      console.error("Error fetching video details:", error);
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, [videoId]);



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

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: videoData.title,
        text: `Check out this video by ${videoData.artist.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleItemBookmark = (itemId: string) => {
    setBookmarkedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const handleItemShare = (itemId: string) => {
    console.log("Share item:", itemId);
  };

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
                isBookmarked={isBookmarked}
                onBookmark={handleBookmark}
                onShare={handleShare}
              />
            </div>
          </div>

          <section className="mb-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-white mb-4">More from this artist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {relatedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  creator={video.creator}
                  thumbnail={video.thumbnail}
                  videoUrl={video.videoUrl}
                  onBookmark={handleItemBookmark}
                  onShare={handleItemShare}
                  isBookmarked={bookmarkedItems.has(video.id)}
                />
              ))}
            </div>
          </section>

          <section className="mb-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/shorts.svg" alt="Shorts" width={24} height={24} />
              <h2 className="text-2xl font-bold text-white">Shorts</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {shorts.map((short) => (
                <ShortsCard
                  key={short.id}
                  id={short.id}
                  title={short.title}
                  creator={short.creator}
                  thumbnail={short.thumbnail}
                  videoUrl={short.videoUrl}
                  onBookmark={handleItemBookmark}
                  onShare={handleItemShare}
                  isBookmarked={bookmarkedItems.has(short.id)}
                />
              ))}
            </div>
          </section>

        </div>
      </div>
    </SiteLayout>
  );
}
