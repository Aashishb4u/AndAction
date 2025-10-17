'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import VideoPlayer from '@/components/ui/VideoPlayer';
import ArtistInfo from '@/components/sections/ArtistInfo';
import VideoCard from '@/components/ui/VideoCard';
import ShortsCard from '@/components/ui/ShortsCard';
import Image from 'next/image';

// Sample data - replace with your actual data fetching
const sampleVideoData = {
  '1': {
    id: '1',
    title: 'Bonam ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit...',
    description: 'Experience an incredible live performance featuring original compositions and crowd favorites. This intimate concert showcases the raw talent and emotional depth of our featured artist.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    views: 125000,
    uploadDate: '2024-01-15',
    artist: {
      id: 'artist-1',
      name: 'Jagesh Henry',
      location: 'Mumbai, India',
      avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=face',
      bio: 'Jagesh is a versatile musician with over 10 years of experience in live performances. Known for his soulful voice and engaging stage presence.',
      category: 'musician',
      followers: 45000,
      verified: true,
    },
  },
  // Add more sample data as needed
};

const sampleRelatedVideos = [
  {
    id: '2',
    title: 'Incredible Dance Moves',
    creator: 'Sarah Johnson',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: '3',
    title: 'DJ Set at Sunset',
    creator: 'Mike Chen',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: '4',
    title: 'Motivational Speaking Event',
    creator: 'Dr. Amanda Smith',
    thumbnail: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: '5',
    title: 'Live Band Performance',
    creator: 'The Rock Stars',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  },
];

const sampleShorts = [
  {
    id: 'short-1',
    title: 'Quick Guitar Riff',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'short-2',
    title: 'Behind the Scenes',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'short-3',
    title: 'Studio Session',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'short-4',
    title: 'Live Performance',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'short-5',
    title: 'Motivational Speaking',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  },
  {
    id: 'short-6',
    title: 'Dance Moves',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
  },
];

export default function VideoDetailsPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

  // Get video data (in real app, this would be fetched from API)
  const videoData = sampleVideoData[videoId as keyof typeof sampleVideoData] || sampleVideoData['1'];

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: videoData.title,
        text: `Check out this amazing video by ${videoData.artist.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const handleItemBookmark = (itemId: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleItemShare = (itemId: string) => {
    console.log('Share item:', itemId);
  };

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-16 lg:pt-20 pb-28">
        <div className="max-w-7xl mx-auto lg:px-8">
          {/* Main Content */}
          {/* Video Player */}
          <div className="mb-8">
            <VideoPlayer
              videoUrl={videoData.videoUrl}
              title={videoData.title}
              poster={videoData.poster}
              className="mb-4"
            />
            <div className='px-4 sm:px-6 lg:px-8'>
              {/* Artist Info */}
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

          <div className='px-4 sm:px-6 lg:px-8'>
            {/* Related Artist Videos */}
            <section className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sampleRelatedVideos.map((video) => (
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

            {/* Shorts Section */}
            <section className="mb-8">
              <div className='flex items-center gap-3 mb-4'>
                <Image
                  src="/shorts.svg"
                  alt="Shorts"
                  width={24}
                  height={24}
                  className="size-6"
                />
                <h2 className="text-2xl font-bold text-white">
                  Shorts
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sampleShorts.map((short) => (
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
      </div>
    </SiteLayout>
  );
}
