'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import ArtistFilters from '@/components/sections/ArtistFilters';
import ArtistGrid from '@/components/sections/ArtistGrid';
import MobileFilters from '@/components/sections/MobileFilters';
import { Artist, Filters } from '@/types';

// Sample artist data - replace with your actual data fetching
const sampleArtists: Artist[] = [
  {
    id: '1',
    name: 'Arjun Sharma',
    category: 'Singer',
    location: 'Mumbai',
    duration: '120 - 160 minutes',
    startingPrice: 150000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'male',
    subCategory: 'bollywood',
  },
  {
    id: '2',
    name: 'Priya Patel',
    category: 'Singer',
    location: 'Delhi',
    duration: '90 - 160 minutes',
    startingPrice: 120000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'female',
    subCategory: 'classical',
  },
  {
    id: '3',
    name: 'Rahul Mehta',
    category: 'Singer',
    location: 'Bangalore',
    duration: '60 - 120 minutes',
    startingPrice: 80000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'male',
    subCategory: 'western',
  },
  {
    id: '4',
    name: 'Kavya Singh',
    category: 'Singer',
    location: 'Pune',
    duration: '120 - 180 minutes',
    startingPrice: 200000,
    languages: ['English', 'Marathi', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'female',
    subCategory: 'folk',
  },
  {
    id: '5',
    name: 'Vikram Joshi',
    category: 'Singer',
    location: 'Ahmedabad',
    duration: '90 - 150 minutes',
    startingPrice: 100000,
    languages: ['Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'male',
    subCategory: 'devotional',
  },
  {
    id: '6',
    name: 'Ananya Reddy',
    category: 'Singer',
    location: 'Hyderabad',
    duration: '120 - 160 minutes',
    startingPrice: 180000,
    languages: ['English', 'Telugu', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'female',
    subCategory: 'bollywood',
  },
  {
    id: '7',
    name: 'Karan Malhotra',
    category: 'Singer',
    location: 'Chennai',
    duration: '150 - 200 minutes',
    startingPrice: 250000,
    languages: ['English', 'Tamil', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'male',
    subCategory: 'classical',
  },
  {
    id: '8',
    name: 'Shreya Gupta',
    category: 'Singer',
    location: 'Kolkata',
    duration: '90 - 140 minutes',
    startingPrice: 110000,
    languages: ['English', 'Bengali', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=500&fit=crop&crop=face',
    isBookmarked: false,
    gender: 'female',
    subCategory: 'folk',
  },
];

export default function ArtistsPage() {
  const router = useRouter();
  const [artists, setArtists] = useState(sampleArtists);
  const [filteredArtists, setFilteredArtists] = useState(sampleArtists);
  const [filters, setFilters] = useState<Filters>({
    category: '',
    subCategory: '',
    gender: '',
    budget: '',
    eventState: '',
    eventType: '',
    language: '',
  });

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // Apply filters
    let filtered = artists;

    // Category filter
    if (newFilters.category) {
      filtered = filtered.filter(artist =>
        artist.category.toLowerCase().includes(newFilters.category.toLowerCase())
      );
    }

    // Sub-category filter
    if (newFilters.subCategory) {
      filtered = filtered.filter(artist =>
        artist.subCategory?.toLowerCase().includes(newFilters.subCategory.toLowerCase())
      );
    }

    // Gender filter
    if (newFilters.gender) {
      filtered = filtered.filter(artist =>
        artist.gender?.toLowerCase() === newFilters.gender.toLowerCase()
      );
    }

    // Budget filter
    if (newFilters.budget) {
      if (newFilters.budget.includes('+')) {
        const min = parseInt(newFilters.budget.replace('+', ''));
        filtered = filtered.filter(artist => artist.startingPrice >= min);
      } else {
        const [minStr, maxStr] = newFilters.budget.split('-');
        const min = parseInt(minStr);
        const max = parseInt(maxStr);
        filtered = filtered.filter(artist =>
          artist.startingPrice >= min && artist.startingPrice <= max
        );
      }
    }

    // Event state filter (location)
    if (newFilters.eventState) {
      filtered = filtered.filter(artist =>
        artist.location.toLowerCase().includes(newFilters.eventState.toLowerCase())
      );
    }

    // Language filter
    if (newFilters.language) {
      filtered = filtered.filter(artist =>
        artist.languages.some(lang =>
          lang.toLowerCase().includes(newFilters.language.toLowerCase())
        )
      );
    }

    setFilteredArtists(filtered);
  };

  const handleBookmark = (artistId: string) => {
    setArtists(prev => prev.map(artist => 
      artist.id === artistId 
        ? { ...artist, isBookmarked: !artist.isBookmarked }
        : artist
    ));
    setFilteredArtists(prev => prev.map(artist => 
      artist.id === artistId 
        ? { ...artist, isBookmarked: !artist.isBookmarked }
        : artist
    ));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      subCategory: '',
      gender: '',
      budget: '',
      eventState: '',
      eventType: '',
      language: '',
    });
    setFilteredArtists(artists);
  };

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24">
        {/* Header - Full Width */}
        <div className="w-full px-4 lg:px-8 py-4 border-b border-gray-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Singer</h1>
            </div>
            <span className="text-sm text-gray-400">{filteredArtists.length} Results</span>
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="lg:hidden">
          <MobileFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
          />
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto md:px-4 lg:px-8 md:py-6 flex gap-8">
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <ArtistFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              resultCount={filteredArtists.length}
            />
          </div>

          {/* Artists Grid */}
          <div className="flex-1">
            <ArtistGrid
              artists={filteredArtists}
              onBookmark={handleBookmark}
            />
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
