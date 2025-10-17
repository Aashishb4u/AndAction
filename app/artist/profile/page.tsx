'use client';

import React, { useState } from 'react';
import ArtistDashboardLayout from '@/components/layout/ArtistDashboardLayout';
import ArtistProfileCard from '@/components/artist/ArtistProfileCard';
import ArtistProfileTabs from '@/components/artist/ArtistProfileTabs';
import type { ArtistProfile } from '@/types';
import { useRouter } from 'next/navigation';

// Mock artist data - this would come from your API/database
const mockArtist = {
  id: '1',
  name: 'MJ Singer',
  category: 'Singer',
  location: 'Surat, Gujarat',
  duration: '2-4 hours',
  startingPrice: 25000,
  languages: ['Hindi', 'Gujarati', 'English'],
  image: '/artist.png',
  isBookmarked: false,
  gender: 'Male',
  subCategory: 'DJ',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos',
  yearsOfExperience: 4,
  subArtistTypes: ['Example', 'example', 'example'],
  achievements: ['Award 1', 'Award 2', 'Award 3'],
  phone: '+91 9876543210',
  whatsapp: '+91 9876543210',
  videos: [],
  shorts: [],
  performances: [],
  // Additional fields for compatibility
  stageName: 'MJ Singer',
  firstName: 'Jignesh',
  lastName: 'Mistry',
  dateOfBirth: '23/Dec/1998',
  address: '306, Surbhi complex',
  pinCode: '395004',
  state: 'Gujarat',
  city: 'Surat',
  subArtistType: 'Example, example, example',
  shortBio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos',
  tags: ['Musician', 'DJ'],
};

export default function ArtistProfile() {
  const [activeTab, setActiveTab] = useState('about');
  const router = useRouter();

  return (
    <ArtistDashboardLayout>
      <div className="flex flex-col lg:flex-row md:gap-5 md:p-6 min-h-screen">
        {/* Left Side - Artist Profile Card */}
        <div className="w-full lg:w-80 flex-shrink-0 max-w-screen overflow-hidden">
          <ArtistProfileCard onBack={() => router.back()} artist={mockArtist} />
        </div>

        {/* Right Side - Tabs and Content */}
        <div className="flex-1 md:bg-card w-full md:rounded-lg">
          <ArtistProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            artist={mockArtist}
          />
        </div>
      </div>
    </ArtistDashboardLayout>
  );
}
