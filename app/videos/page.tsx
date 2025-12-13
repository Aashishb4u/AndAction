'use client';

import React, { useState, useEffect } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import FilterButtons from '@/components/ui/FilterButtons';
import VideoCard from '@/components/ui/VideoCard';

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'musician', label: 'Musician' },
  { id: 'dancer', label: 'Dancer' },
  { id: 'dj', label: 'DJ' },
  { id: 'speaker', label: 'Speaker' },
];

export default function VideosPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());

  // ------- FETCH REAL VIDEOS ----------
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?type=videos');
        const json = await res.json();

        if (json.success) {
          const mapped = json.data.videos.map((v: any) => ({
            id: v.id,
            title: v.title,
            creator: `${v.user.firstName} ${v.user.lastName}`,
            thumbnail: v.thumbnailUrl,
            videoUrl: v.url,
            category: v.category ?? 'all', // fallback, since your API doesn't include category
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

  // ------- FILTER LOGIC -----------
  const filteredVideos =
    activeFilter === 'all'
      ? videos
      : videos.filter((video) => video.category === activeFilter);

  // ------- BOOKMARK TOGGLE ----------
  const handleBookmark = (videoId: string) => {
    setBookmarkedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) newSet.delete(videoId);
      else newSet.add(videoId);
      return newSet;
    });
  };

  const handleShare = (videoId: string) => {
    console.log('Share video:', videoId);
  };

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24 pb-28">
        
        {/* Filter Buttons 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-card py-3 mb-8">
          <FilterButtons
            options={filterOptions}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>*/}

        {/* Videos Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20 text-gray-400">Loading videos...</div>
          )}

          {/* Videos */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  creator={video.creator}
                  thumbnail={video.thumbnail}
                  videoUrl={video.videoUrl}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  isBookmarked={bookmarkedVideos.has(video.id)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredVideos.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                No videos found for the selected category.
              </p>
            </div>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}
