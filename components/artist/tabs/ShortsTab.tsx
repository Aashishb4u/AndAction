'use client';

import React, { useState } from 'react';
import { Artist } from '@/types';
import ShortsCard from '@/components/ui/ShortsCard';

interface ShortsTabProps {
  artist: Artist;
}

// Mock data for shorts
const mockShorts = [
  {
    id: '1',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    videoUrl: '/videos/short1.mp4',
  },
  {
    id: '2',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=700&fit=crop',
    videoUrl: '/videos/short2.mp4',
  },
  {
    id: '3',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=700&fit=crop',
    videoUrl: '/videos/short3.mp4',
  },
  {
    id: '4',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    videoUrl: '/videos/short4.mp4',
  },
  {
    id: '5',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=700&fit=crop',
    videoUrl: '/videos/short5.mp4',
  },
  {
    id: '6',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=700&fit=crop',
    videoUrl: '/videos/short6.mp4',
  },
  {
    id: '7',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    videoUrl: '/videos/short7.mp4',
  },
  {
    id: '8',
    title: 'Short Video',
    creator: 'Jignesh Mistry',
    thumbnail: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=700&fit=crop',
    videoUrl: '/videos/short8.mp4',
  },
];

const ShortsTab: React.FC<ShortsTabProps> = () => {
  const [shorts, setShorts] = useState(mockShorts);
  const [bookmarkedShorts, setBookmarkedShorts] = useState<Set<string>>(new Set());

  const handleBookmark = (shortId: string) => {
    setBookmarkedShorts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shortId)) {
        newSet.delete(shortId);
      } else {
        newSet.add(shortId);
      }
      return newSet;
    });
  };

  const handleShare = (shortId: string) => {
    // Handle share functionality
    console.log('Sharing short:', shortId);
    // You can implement actual share functionality here
  };

  const handleDelete = (shortId: string) => {
    // Handle delete functionality
    setShorts(prev => prev.filter(short => short.id !== shortId));
    setBookmarkedShorts(prev => {
      const newSet = new Set(prev);
      newSet.delete(shortId);
      return newSet;
    });
  };

  return (
    <div className="md:space-y-6 space-y-4 pb-24 md:pb-0">
      {/* Shorts Grid - 4 columns for vertical videos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {shorts.map((short) => (
          <ShortsCard
            key={short.id}
            id={short.id}
            title={short.title}
            creator={short.creator}
            thumbnail={short.thumbnail}
            videoUrl={short.videoUrl}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onDelete={handleDelete}
            isBookmarked={bookmarkedShorts.has(short.id)}
            showDeleteButton={true}
          />
        ))}
      </div>

      {/* Empty State */}
      {shorts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No shorts found</div>
          <div className="text-gray-500 text-sm">Upload your first short to get started</div>
        </div>
      )}
    </div>
  );
};

export default ShortsTab;
