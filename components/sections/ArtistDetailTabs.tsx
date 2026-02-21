'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showBioMoreButton, setShowBioMoreButton] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

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

  // Check if bio text overflows (more than 2 lines)
  useEffect(() => {
    const checkBioOverflow = () => {
      if (bioRef.current) {
        const lineHeight = parseFloat(getComputedStyle(bioRef.current).lineHeight) || 20;
        const maxHeight = lineHeight * 4; // 4 lines
        setShowBioMoreButton(bioRef.current.scrollHeight > maxHeight + 2);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(checkBioOverflow, 100);
    window.addEventListener('resize', checkBioOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkBioOverflow);
    };
  }, [artist.bio, activeTab]);


  const tabs = [
    { id: 'about' as TabType, label: 'About' },
    { id: 'performance' as TabType, label: 'Performance' },
    { id: 'videos' as TabType, label: 'Videos' },
    { id: 'shorts' as TabType, label: 'Shorts' },
  ];

  const renderAboutContent = () => (
   <div className="space-y-4 max-w-4xl">
      {artist.bio && artist.bio.trim() !== "" && (() => {
        const sanitizedBio = artist.bio
          .replaceAll('\\r\\n', '\n')
          .replaceAll('\\r', '')
          .replaceAll('\\n', '\n')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '');
        return (
        <div className='p-4 md:bg-background bg-card border rounded-xl' style={{ borderColor: '#232323' }}>
          <h3 className="text-text-gray secondary-text mb-2">Bio</h3>
          <p 
            ref={bioRef}
            className={`leading-relaxed secondary-grey-text whitespace-pre-line ${isBioExpanded ? '' : 'line-clamp-4'}`}
          >
            {sanitizedBio}
          </p>
          {showBioMoreButton && (
            <button 
              onClick={() => setIsBioExpanded(!isBioExpanded)}
              className="text-blue hover:text-primary-pink transition-colors font-medium text-sm mt-1"
            >
              {isBioExpanded ? 'less' : 'more...'}
            </button>
          )}
        </div>
        );
      })()}
      {/* Years of experience: show only when a positive number is provided */}
      {(typeof artist.yearsOfExperience === 'number' && artist.yearsOfExperience > 0) && (
        <div className='p-4 md:bg-background bg-card border rounded-xl' style={{ borderColor: '#232323' }}>
          <h3 className="text-text-gray secondary-text mb-2">Years of experience</h3>
          <p className="secondary-grey-text">{artist.yearsOfExperience} Years</p>
        </div>
      )}

      {/* Sub-artist types: filter out empty / N/A values */}
        {/* Resolve sub-artist types whether provided as array or CSV string */}
        {(() => {
          const a: any = artist as any;
          const artistSubTypes = Array.isArray(a.subArtistTypes)
            ? a.subArtistTypes
            : (a.subArtistType ? (a.subArtistType as string).split(',').map((s: string) => s.trim()).filter(Boolean) : []);

          if (artistSubTypes.filter((t: string) => t && t.trim() && t.toLowerCase() !== 'n/a').length === 0) return null;

          return (
            <div className='p-4 md:bg-background bg-card border rounded-xl' style={{ borderColor: '#232323' }}>
              <h3 className="text-text-gray secondary-text mb-2">Sub-Artist Type</h3>
              <div className="flex flex-wrap gap-1.5">
                {artistSubTypes
                  .filter((t: string) => t && t.trim() && t.toLowerCase() !== 'n/a')
                  .map((type: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-white rounded-full border border-border-color secondary-text font-medium bg-background"
                    >
                      {type}
                    </span>
                  ))}
              </div>
            </div>
          );
        })()}
      

      {/* Achievements: filter out empty / N/A values */}
      {Array.isArray(artist.achievements) && artist.achievements.filter((a: string) => a && a.trim() && a.toLowerCase() !== 'n/a').length > 0 && (
        <div className='p-4 md:bg-background bg-card border rounded-xl' style={{ borderColor: '#232323' }}>
          <h3 className="text-text-gray secondary-text mb-2">Achievements / Awards</h3>
          <div className="flex flex-wrap gap-1.5">
            {artist.achievements
              .filter((a: string) => a && a.trim() && a.toLowerCase() !== 'n/a')
              .map((achievement: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-white rounded-full border border-border-color secondary-text font-medium bg-background"
                >
                  {achievement}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceContent = () => (
    <div className="space-y-4 max-w-4xl">
      <div className="md:bg-background bg-card border rounded-lg md:p-6 p-4" style={{ borderColor: '#232323' }}>
        <div className="mb-6">
          <h3 className="text-text-gray secondary-text mb-1">Solo Charges</h3>
          <div className="text-white mb-1">Starting from ₹ {artist.soloChargesFrom || 0}</div>
          {artist.soloChargesDescription?.trim() ? (
            <p className="footnote">{artist.soloChargesDescription.trim()}</p>
          ) : null}
        </div>

        <div>
          <h3 className="text-text-gray secondary-text mb-1">Charges with backline</h3>
          <div className="text-white mb-1">Starting from ₹ {artist.chargesWithBacklineFrom || 0}</div>
          {artist.chargesWithBacklineDescription?.trim() ? (
            <p className="footnote">{artist.chargesWithBacklineDescription.trim()}</p>
          ) : null}
        </div>
      </div>

      <div className="md:bg-background bg-card border rounded-lg p-4" style={{ borderColor: '#232323' }}>
        <div className="mb-4">
          <h4 className="text-text-gray secondary-text mb-1">Performing duration</h4>
          <p className="text-white text-sm">
            {artist.performingDurationFrom || 'N/A'} mins
          </p>
        </div>

        <div className="mb-4">
          <h4 className="text-text-gray secondary-text mb-1">Performing members</h4>
          <p className="text-white text-sm">
            {artist.performingMembers || "N/A"} members
          </p>
        </div>

        <div>
          <h4 className="text-text-gray secondary-text mb-1">Off stage members</h4>
          <p className="text-white text-sm">
            {artist.offStageMembers || "N/A"}
          </p>
        </div>
      </div>

      <div className="md:bg-background bg-card border rounded-lg md:p-6 p-4" style={{ borderColor: '#232323' }}>
        <h3 className="text-text-gray secondary-text mb-1">Performing language</h3>
        <div className="flex  flex-wrap gap-1.5">
          {(artist.languages?.length
            ? artist.languages.flatMap((lang: string) => lang.split(',').map((l: string) => l.trim())).filter((l: string) => l)
            : ["N/A"]
          ).map((language: string, index: number) => (
            <span
              key={index}
              className="bg-background px-3 py-1.5 border border-border-color text-white rounded-full secondary-grey-text font-medium"
            >
              {language || "N/A"}
            </span>
          ))}
        </div>
      </div>

      <div className="md:bg-background bg-card border rounded-lg md:p-6 p-4" style={{ borderColor: '#232323' }}>
        <h3 className="text-text-gray secondary-text mb-1">Performing event type</h3>
        <div className="flex flex-wrap gap-1.5">
          {(artist.performingEventType
            ? artist.performingEventType.split(',').map((e: string) => e.trim()).filter((e: string) => e)
            : ["N/A"]
          ).map((eventType: string, index: number) => (
            <span
              key={index}
              className="bg-background px-3 py-1.5 border border-border-color text-white rounded-full secondary-grey-text font-medium"
            >
              {eventType || "N/A"}
            </span>
          ))}
        </div>
      </div>

      <div className="md:bg-background bg-card border rounded-lg md:p-6 p-4" style={{ borderColor: '#232323' }}>
        <h3 className="text-text-gray secondary-text mb-1">Performing States</h3>
        <div className="flex flex-wrap gap-1.5">
          {(() => {
            const states = artist.performingStates
              ? artist.performingStates.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              : ["N/A"];
            const hasPanIndia = states.some((s: string) => s.toLowerCase() === 'pan india');
            return hasPanIndia ? ["Pan India"] : states;
          })().map((state: string, index: number) => (
            <span
              key={index}
              className="bg-background px-3 py-1.5 border border-border-color text-white rounded-full secondary-grey-text font-medium"
            >
              {state || "N/A"}
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
          <p>This artist hasn&apos;t uploaded any videos yet</p>
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
            onShare={() => { }}
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
          <p>This artist hasn&apos;t uploaded any shorts yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artistShorts.map((short) => (
          <ShortsCard
            key={short.id}
            id={short.id}
            title={short.title}
            creator={`${short.user.firstName} ${short.user.lastName}`}
            thumbnail={short.thumbnailUrl}
            videoUrl={short.url}
            isBookmarked={short.isBookmarked}       
            bookmarkId={short.bookmarkId}   
            onBookmark={(data) => toggleBookmark(data)}
            onShare={() => { }}
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
        <div className="sticky top-0 bg-background border-b z-40" style={{ borderColor: '#232323' }}>
          <div className="flex bg-card overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-4 text-base font-medium transition-colors relative ${activeTab === tab.id
                  ? 'text-white'
                  : 'text-text-gray hover:text-gray-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink z-50"
                    style={{ bottom: '-1px' }}
                  />
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
    <div className="min-h-screen bg-card rounded-2xl border" style={{ borderColor: '#232323' }}>
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
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink z-50"
                    style={{ bottom: '-1px' }}
                  />
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
