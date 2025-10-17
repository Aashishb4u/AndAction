'use client';

import React, { useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import FilterButtons from '@/components/ui/FilterButtons';
import VideoCard from '@/components/ui/VideoCard';

// Sample video data - replace with your actual data
const sampleVideos = [
  {
    id: '1',
    title: 'Amazing Performance',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'musician',
  },
  {
    id: '2',
    title: 'Incredible Dance Moves',
    creator: 'Sarah Johnson',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'dancer',
  },
  {
    id: '3',
    title: 'DJ Set at Sunset',
    creator: 'Mike Chen',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'dj',
  },
  {
    id: '4',
    title: 'Motivational Speaking Event',
    creator: 'Dr. Amanda Smith',
    thumbnail: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'speaker',
  },
  {
    id: '5',
    title: 'Live Band Performance',
    creator: 'The Rock Stars',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'musician',
  },
  {
    id: '6',
    title: 'Contemporary Dance Show',
    creator: 'Emma Wilson',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'dancer',
  },
];

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'musician', label: 'Musician' },
  { id: 'dancer', label: 'Dancer' },
  { id: 'dj', label: 'DJ' },
  { id: 'speaker', label: 'Speaker' },
];

export default function VideosPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());

  const filteredVideos = activeFilter === 'all'
    ? sampleVideos
    : sampleVideos.filter(video => video.category === activeFilter);

  const handleBookmark = (videoId: string) => {
    setBookmarkedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleShare = (videoId: string) => {
    // Implement share functionality
    console.log('Share video:', videoId);
    // You can add actual share logic here
  };

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24 pb-28">
        {/* Filter Buttons */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-card py-3 mb-8">
          <FilterButtons
            options={filterOptions}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Videos Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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

          {/* Empty State */}
          {filteredVideos.length === 0 && (
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
