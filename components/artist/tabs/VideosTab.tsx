'use client';

import React, { useState } from 'react';
import { Artist } from '@/types';
import VideoCard from '@/components/ui/VideoCard';

interface VideosTabProps {
  artist: Artist;
}

// Mock data for videos
const mockVideos = [
  {
    id: '1',
    title: 'Video Heading',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    videoUrl: '/videos/sample1.mp4',
  },
  {
    id: '2',
    title: 'Video Heading',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=450&fit=crop',
    videoUrl: '/videos/sample2.mp4',
  },
  {
    id: '3',
    title: 'Video Heading',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop',
    videoUrl: '/videos/sample3.mp4',
  },
  {
    id: '4',
    title: 'Video Heading',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    videoUrl: '/videos/sample4.mp4',
  },
  {
    id: '5',
    title: 'Video Heading',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=450&fit=crop',
    videoUrl: '/videos/sample5.mp4',
  },
  {
    id: '6',
    title: 'Video Heading',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop',
    videoUrl: '/videos/sample6.mp4',
  },
];

const VideosTab: React.FC<VideosTabProps> = () => {
  const [videos, setVideos] = useState(mockVideos);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());

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
    // Handle share functionality
    console.log('Sharing video:', videoId);
    // You can implement actual share functionality here
  };

  const handleDelete = (videoId: string) => {
    // Handle delete functionality
    setVideos(prev => prev.filter(video => video.id !== videoId));
    setBookmarkedVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            id={video.id}
            title={video.title}
            creator={video.creator}
            thumbnail={video.thumbnail}
            videoUrl={video.videoUrl}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onDelete={handleDelete}
            isBookmarked={bookmarkedVideos.has(video.id)}
            showDeleteButton={true}
          />
        ))}
      </div>

      {/* Empty State */}
      {videos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No videos found</div>
          <div className="text-gray-500 text-sm">Upload your first video to get started</div>
        </div>
      )}
    </div>
  );
};

export default VideosTab;
