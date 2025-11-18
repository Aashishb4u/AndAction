'use client';

import React, { useState } from 'react';
import { Artist } from '@/types';
import VideoCard from '@/components/ui/VideoCard';
import ShortsCard from '@/components/ui/ShortsCard';

interface ArtistDetailTabsProps {
  artist: Artist;
  isMobile?: boolean;
}

type TabType = 'about' | 'performance' | 'videos' | 'shorts';

const ArtistDetailTabs: React.FC<ArtistDetailTabsProps> = ({
  artist,
  isMobile = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('about');

  const tabs = [
    { id: 'about' as TabType, label: 'About' },
    { id: 'performance' as TabType, label: 'Performance' },
    { id: 'videos' as TabType, label: 'Videos' },
    { id: 'shorts' as TabType, label: 'Shorts' },
  ];

  const renderAboutContent = () => (
    <div className="space-y-4 max-w-4xl">
      {/* Bio Section */}
      <div className='p-4 md:bg-background bg-card border border-border-color rounded-xl'>
        <h3 className="text-text-gray secondary-text mb-1">Bio</h3>
        <p className=" leading-relaxed text-sm">
          {artist.bio || 'Borem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero Borem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero'}
          {(!artist.bio || (artist.bio && artist.bio.length > 100)) && (
            <button className="text-blue hover:text-primary-pink transition-colors font-medium ml-1">
               more.
            </button>
          )}
        </p>
      </div>

      {/* Years of Experience */}
      <div className='p-4 md:bg-background bg-card border border-border-color rounded-xl'>
        <h3 className="text-text-gray secondary-text mb-1">Years of experience</h3>
        <p className="footnote">{artist.yearsOfExperience || 4} Years</p>
      </div>

      {/* Sub-Artist Type */}
      <div className='p-4 md:bg-background bg-card border border-border-color rounded-xl'>
        <h3 className="text-text-gray secondary-text mb-1">Sub-Artist Type</h3>
        <div className="flex flex-wrap gap-1.5">
          {(artist.subArtistTypes || ['Singer', 'DJ', 'Anker']).map((type, index) => (
            <span
              key={index}
              className="px-3 py-1.5 text-gray-300 rounded-full border border-border-color text-xs font-medium bg-background"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Achievements / Awards */}
      <div className='p-4 md:bg-background bg-card border border-border-color rounded-xl'>
        <h3 className="text-text-gray secondary-text mb-1">Achievements / Awards</h3>
        <div className="flex flex-wrap gap-1.5">
          {(artist.achievements || ['Singer', 'DJ', 'Anker']).map((achievement, index) => (
            <span
              key={index}
              className="px-3 py-1.5 text-gray-300 rounded-full border border-border-color text-xs font-medium bg-background"
            >
              {achievement}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPerformanceContent = () => (
  <div className="space-y-4 max-w-4xl">

    {/* Solo Charges */}
    <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
      <h3 className="text-text-gray secondary-text mb-1">Solo Charges</h3>
      <div className="text-white mb-1">
        ₹ {artist.soloChargesFrom || 0} - ₹ {artist.soloChargesTo || 0}
      </div>
      <p className="footnote">
        {artist.soloChargesDescription?.trim() || "No description provided."}
      </p>
    </div>

    {/* Charges with Backline */}
    <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
      <h3 className="text-text-gray secondary-text mb-1">Charges with backline</h3>
      <div className="text-white mb-1">
        ₹ {artist.chargesWithBacklineFrom || 0} - ₹ {artist.chargesWithBacklineTo || 0}
      </div>
      <p className="footnote">
        {artist.chargesWithBacklineDescription?.trim() || "No description provided."}
      </p>
    </div>

    {/* Performance Details Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Performing duration */}
      <div className="md:bg-background bg-card border border-border-color rounded-lg p-4">
        <h4 className="text-text-gray secondary-text mb-1">Performing duration</h4>
        <p className="text-white text-sm">
          {artist.performingDurationFrom || "N/A"} - {artist.performingDurationTo || "N/A"} mins
        </p>
      </div>

      {/* Performing members */}
      <div className="md:bg-background bg-card border border-border-color rounded-lg p-4">
        <h4 className="text-text-gray secondary-text mb-1">Performing members</h4>
        <p className="text-white text-sm">
          {artist.performingMembers || "N/A"} members
        </p>
      </div>

      {/* Off stage members */}
      <div className="md:bg-background bg-card border border-border-color rounded-lg p-4">
        <h4 className="text-text-gray secondary-text mb-1">Off stage members</h4>
        <p className="text-white text-sm">
          {artist.offStageMembers || "N/A"}
        </p>
      </div>

    </div>

    {/* Performing language */}
    <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
      <h3 className="text-text-gray secondary-text mb-1">Performing language</h3>
      <div className="flex flex-wrap gap-1.5">
        {(artist.languages?.length ? artist.languages : ["N/A"]).map((language, index) => (
          <span
            key={index}
            className="bg-background px-3 py-1.5 border border-border-color text-gray-300 rounded-full text-xs font-medium"
          >
            {language}
          </span>
        ))}
      </div>
    </div>

    {/* Performing event type */}
    <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
      <h3 className="text-text-gray secondary-text mb-1">Performing event type</h3>
      <div className="flex flex-wrap gap-1.5">
        <span className="bg-background px-3 py-1.5 border border-border-color text-gray-300 rounded-full text-xs font-medium">
          {artist.performingEventType || "N/A"}
        </span>
      </div>
    </div>

    {/* Performing States */}
    <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
      <h3 className="text-text-gray secondary-text mb-1">Performing States</h3>
      <div className="flex flex-wrap gap-1.5">
        {(artist.performingStates
          ? artist.performingStates.split(',').map(s => s.trim())
          : ["N/A"]
        ).map((state, index) => (
          <span
            key={index}
            className="bg-background px-3 py-1.5 border border-border-color text-gray-300 rounded-full text-xs font-medium"
          >
            {state}
          </span>
        ))}
      </div>
    </div>

  </div>
);


  const renderVideosContent = () => {
    // Sample video data - in real app, this would come from artist.videos
    const sampleVideos = [
      {
        id: 'v1',
        title: 'Amazing Performance at Wedding',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
      {
        id: 'v2',
        title: 'Live Concert Performance',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      },
      {
        id: 'v3',
        title: 'Studio Recording Session',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: 'v4',
        title: 'Behind the Scenes',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      },
    ];

    const handleVideoBookmark = (videoId: string) => {
      console.log('Bookmark video:', videoId);
    };

    const handleVideoShare = (videoId: string) => {
      console.log('Share video:', videoId);
    };

    if (sampleVideos.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Videos</h3>
          <p className="">This artist hasn&apos;t uploaded any videos yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sampleVideos.map((video) => (
          <VideoCard
            key={video.id}
            id={video.id}
            title={video.title}
            creator={video.creator}
            thumbnail={video.thumbnail}
            videoUrl={video.videoUrl}
            onBookmark={handleVideoBookmark}
            onShare={handleVideoShare}
            isBookmarked={false}
          />
        ))}
      </div>
    );
  };

  const renderShortsContent = () => {
    // Sample shorts data - in real app, this would come from artist.shorts
    const sampleShorts = [
      {
        id: 's1',
        title: 'Quick Performance Clip',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
      {
        id: 's2',
        title: 'Behind the Scenes',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      },
      {
        id: 's3',
        title: 'Practice Session',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: 's4',
        title: 'Live Performance',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      },
      {
        id: 's5',
        title: 'Rehearsal Clip',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      },
      {
        id: 's6',
        title: 'Studio Time',
        creator: artist.name,
        thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      },
    ];

    const handleShortsBookmark = (shortsId: string) => {
      console.log('Bookmark shorts:', shortsId);
    };

    const handleShortsShare = (shortsId: string) => {
      console.log('Share shorts:', shortsId);
    };

    if (sampleShorts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Shorts</h3>
          <p className="">This artist hasn&apos;t uploaded any shorts yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sampleShorts.map((short) => (
          <ShortsCard
            key={short.id}
            id={short.id}
            title={short.title}
            creator={short.creator}
            thumbnail={short.thumbnail}
            videoUrl={short.videoUrl}
            onBookmark={handleShortsBookmark}
            onShare={handleShortsShare}
            isBookmarked={false}
          />
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return renderAboutContent();
      case 'performance':
        return renderPerformanceContent();
      case 'videos':
        return renderVideosContent();
      case 'shorts':
        return renderShortsContent();
      default:
        return renderAboutContent();
    }
  };

  if (isMobile) {
    return (
      <div className="bg-background min-h-screen">
        {/* Mobile Tabs */}
        <div className="sticky top-0 bg-background border-b border-border-color z-40">
          <div className="flex bg-card overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-4 text-base font-medium transition-colors relative ${activeTab === tab.id
                  ? 'gradient-text'
                  : 'text-text-gray hover:text-gray-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Content */}
        <div className="md:p-6 p-4 pb-32">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Desktop Layout - Match Figma exactly
  return (
    <div className="min-h-screen bg-card rounded-2xl border border-border-color">
      {/* Desktop Tabs */}
      <div className="border-b border-border-color">
        <div className="flex px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-base font-medium transition-colors relative ${activeTab === tab.id
                ? 'gradient-text'
                : 'text-text-gray hover:text-gray-300'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Content */}
      <div className="p-8 h-full overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default ArtistDetailTabs;
