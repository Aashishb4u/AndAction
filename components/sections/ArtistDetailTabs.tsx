'use client';

import React, { useState, useEffect } from 'react';
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

  const [artistVideos, setArtistVideos] = useState<any[]>([]);
  const [artistShorts, setArtistShorts] = useState<any[]>([]);

  const toggleBookmark = async ({ id, bookmarkId, isBookmarked }: any) => {
  try {
    if (isBookmarked && bookmarkId) {
      // DELETE bookmark
      await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });

      setArtistVideos(prev =>
        prev.map(v =>
          v.id === id ? { ...v, isBookmarked: false, bookmarkId: null } : v
        )
      );

      setArtistShorts(prev =>
        prev.map(s =>
          s.id === id ? { ...s, isBookmarked: false, bookmarkId: null } : s
        )
      );

      return;
    }

    // CREATE bookmark
    const res = await fetch(`/api/bookmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: id }),
    });

    const json = await res.json();
    const newBookmarkId = json?.data?.bookmark?.id;

    setArtistVideos(prev =>
      prev.map(v =>
        v.id === id ? { ...v, isBookmarked: true, bookmarkId: newBookmarkId } : v
      )
    );

    setArtistShorts(prev =>
      prev.map(s =>
        s.id === id ? { ...s, isBookmarked: true, bookmarkId: newBookmarkId } : s
      )
    );

  } catch (err) {
    console.error("Bookmark error:", err);
  }
};



  useEffect(() => {
  if (!artist?.userId) return;

  async function fetchMedia() {
    try {
      console.log(`Artist id : ${artist.id}`);

      // 🔥 Fetch VIDEOS with bookmark info
      const videosRes = await fetch(
        `/api/videos?type=videos&artistId=${artist.userId}&withBookmarks=true`
      );
      const videosJson = await videosRes.json();

      setArtistVideos(videosJson?.data?.videos || []);

      // 🔥 Fetch SHORTS with bookmark info
      const shortsRes = await fetch(
        `/api/videos?type=shorts&artistId=${artist.userId}&withBookmarks=true`
      );
      const shortsJson = await shortsRes.json();

      setArtistShorts(shortsJson?.data?.videos || []);

    } catch (err) {
      console.error("Media fetch error:", err);
    }
  }

  fetchMedia();
}, [artist?.id]);


  const tabs = [
    { id: 'about' as TabType, label: 'About' },
    { id: 'performance' as TabType, label: 'Performance' },
    { id: 'videos' as TabType, label: 'Videos' },
    { id: 'shorts' as TabType, label: 'Shorts' },
  ];

  const renderAboutContent = () => (
    <div className="space-y-4 max-w-4xl">
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

      <div className='p-4 md:bg-background bg-card border border-border-color rounded-xl'>
        <h3 className="text-text-gray secondary-text mb-1">Years of experience</h3>
        <p className="footnote">{artist.yearsOfExperience || 4} Years</p>
      </div>

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
      <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
        <h3 className="text-text-gray secondary-text mb-1">Solo Charges</h3>
        <div className="text-white mb-1">
          ₹ {artist.soloChargesFrom || 0} - ₹ {artist.soloChargesTo || 0}
        </div>
        <p className="footnote">
          {artist.soloChargesDescription?.trim() || "No description provided."}
        </p>
      </div>

      <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
        <h3 className="text-text-gray secondary-text mb-1">Charges with backline</h3>
        <div className="text-white mb-1">
          ₹ {artist.chargesWithBacklineFrom || 0} - ₹ {artist.chargesWithBacklineTo || 0}
        </div>
        <p className="footnote">
          {artist.chargesWithBacklineDescription?.trim() || "No description provided."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:bg-background bg-card border border-border-color rounded-lg p-4">
          <h4 className="text-text-gray secondary-text mb-1">Performing duration</h4>
          <p className="text-white text-sm">
            {artist.performingDurationFrom || "N/A"} - {artist.performingDurationTo || "N/A"} mins
          </p>
        </div>

        <div className="md:bg-background bg-card border border-border-color rounded-lg p-4">
          <h4 className="text-text-gray secondary-text mb-1">Performing members</h4>
          <p className="text-white text-sm">
            {artist.performingMembers || "N/A"} members
          </p>
        </div>

        <div className="md:bg-background bg-card border border-border-color rounded-lg p-4">
          <h4 className="text-text-gray secondary-text mb-1">Off stage members</h4>
          <p className="text-white text-sm">
            {artist.offStageMembers || "N/A"}
          </p>
        </div>
      </div>

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

      <div className="md:bg-background bg-card border border-border-color rounded-lg md:p-6 p-4">
        <h3 className="text-text-gray secondary-text mb-1">Performing event type</h3>
        <div className="flex flex-wrap gap-1.5">
          <span className="bg-background px-3 py-1.5 border border-border-color text-gray-300 rounded-full text-xs font-medium">
            {artist.performingEventType || "N/A"}
          </span>
        </div>
      </div>

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
    if (artistVideos.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">No Videos</h3>
          <p>This artist hasn't uploaded any videos yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {artistVideos.map((video) => (
          <VideoCard
  key={video.id}
  id={video.id}
  title={video.title}
  creator={`${video.user.firstName} ${video.user.lastName}`}
  thumbnail={video.thumbnailUrl}
  videoUrl={video.url}

  isBookmarked={video.isBookmarked}         // 🔥 NEW
  bookmarkId={video.bookmarkId}             // 🔥 NEW

  onBookmark={(data) => toggleBookmark(data)} 
  onShare={() => {}}
/>

        ))}
      </div>
    );
  };

  const renderShortsContent = () => {
    if (artistShorts.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">No Shorts</h3>
          <p>This artist hasn't uploaded any shorts yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artistShorts.map((short) => (
          <ShortsCard
  key={short.id}
  id={short.id}
  title={short.title}
  creator={`${short.user.firstName} ${short.user.lastName}`}
  thumbnail={short.thumbnailUrl}
  videoUrl={short.url}

  isBookmarked={short.isBookmarked}       // 🔥 NEW
  bookmarkId={short.bookmarkId}           // 🔥 NEW

  onBookmark={(data) => toggleBookmark(data)}
  onShare={() => {}}
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

        <div className="md:p-6 p-4 pb-32">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card rounded-2xl border border-border-color">
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

      <div className="p-8 h-full overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default ArtistDetailTabs;
