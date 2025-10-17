'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import ArtistProfileHeader from '@/components/sections/ArtistProfileHeader';
import ArtistDetailTabs from '@/components/sections/ArtistDetailTabs';
import { Artist } from '@/types';

// Sample artist data - in real app, this would come from API
const sampleArtistData: Artist = {
  id: '1',
  name: 'MJ Singer',
  category: 'Singer',
  location: 'Gujarat',
  duration: '120 - 160 minutes',
  startingPrice: 100000,
  languages: ['English', 'Gujarati', 'Hindi'],
  image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
  isBookmarked: false,
  gender: 'male',
  subCategory: 'bollywood',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero',
  yearsOfExperience: 4,
  subArtistTypes: ['Singer', 'DJ', 'Anker'],
  achievements: ['Singer', 'DJ', 'Anker'],
  phone: '+91 9876543210',
  whatsapp: '+91 9876543210',
  videos: [
    {
      id: 'v1',
      title: 'Amazing Performance',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '3:45',
      views: 1200
    }
  ],
  shorts: [
    {
      id: 's1',
      title: 'Quick Performance',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      views: 850,
      likes: 120
    }
  ],
  performances: [
    {
      id: 'p1',
      title: 'Wedding Performance',
      venue: 'Grand Hotel',
      date: '2024-01-15',
      description: 'Amazing wedding performance',
      images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop']
    }
  ]
};

export default function ArtistDetailPage() {
  // const params = useParams();
  const router = useRouter();
  // const artistId = params.id as string;

  // In real app, fetch artist data based on artistId
  const artist = sampleArtistData;

  const handleBack = () => {
    router.back();
  };

  const handleBookmark = () => {
    // Handle bookmark logic
    console.log('Bookmark toggled');
  };

  const handleShare = () => {
    // Handle share logic
    console.log('Share artist');
  };

  const handleRequestBooking = () => {
    // Handle booking request
    console.log('Request booking');
  };

  const handleCall = () => {
    if (artist.phone) {
      window.open(`tel:${artist.phone}`, '_self');
    }
  };

  const handleWhatsApp = () => {
    if (artist.whatsapp) {
      window.open(`https://wa.me/${artist.whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  if (!artist) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Artist not found</h1>
            <button
              onClick={handleBack}
              className="text-primary-pink hover:text-primary-orange transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout hideNavbar hideBottomBar>
      {/* Desktop Layout */}
      <div className="hidden max-w-7xl mx-auto lg:flex min-h-screen bg-background py-10 lg:py-14">
        {/* Left Side - Artist Profile */}
        <div className="w-[400px] flex-shrink-0">
          <ArtistProfileHeader
            artist={artist}
            onBack={handleBack}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onRequestBooking={handleRequestBooking}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
          />
        </div>

        {/* Right Side - Artist Details */}
        <div className="flex-1">
          <ArtistDetailTabs artist={artist} />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-background">
        <ArtistProfileHeader
          artist={artist}
          onBack={handleBack}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onRequestBooking={handleRequestBooking}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          isMobile={true}
        />
        <ArtistDetailTabs artist={artist} isMobile={true} />
      </div>
    </SiteLayout>
  );
}
