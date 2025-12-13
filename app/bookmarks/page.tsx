'use client';

import React, { useEffect, useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import ArtistGrid from '@/components/sections/ArtistGrid';
import VideoCard from '@/components/ui/VideoCard';
import ShortsCard from '@/components/ui/ShortsCard';
import { Artist } from '@/types';

type TabType = 'Artist' | 'Videos' | 'Shorts';

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('Artist');

  const [artistBookmarks, setArtistBookmarks] = useState<any[]>([]);
  const [videoBookmarks, setVideoBookmarks] = useState<any[]>([]);
  const [shortBookmarks, setShortBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs: TabType[] = ['Artist', 'Videos', 'Shorts'];

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch('/api/bookmarks');
        const json = await res.json();

        if (!json.success) return;

        const raw = json.data.bookmarks;

        // -------------------------
        // Artists
        // -------------------------
        const artists = raw
          .filter((b: any) => b.artist)
          .map((b: any) => {
            const a = b.artist;
            return {
              id: a.id,
              bookmarkId: b.id,
              name: a.stageName || `${a.user.firstName} ${a.user.lastName}`,
              category: a.artistType,
              subCategory: a.subArtistType,
              location: `${a.user.city || ''}${a.user.state ? ', ' + a.user.state : ''}`,
              startingPrice: Number(a.soloChargesFrom) || 0,
              languages: [a.performingLanguage],
              image: a.user.avatar,
              isBookmarked: true,
              gender: a.user.gender,
            };
          });

        // -------------------------
        // Videos (isShort === false)
        // -------------------------
        const videos = raw
          .filter((b: any) => b.video && b.video.isShort === false)
          .map((b: any) => {
            const v = b.video;
            return {
              id: v.id,
              bookmarkId: b.id,
              title: v.title,
              creator: `${v.user.firstName} ${v.user.lastName}`,
              thumbnail: v.thumbnailUrl,
              videoUrl: v.url,
              isBookmarked: true,
            };
          });

        // -------------------------
        // Shorts (isShort === true)
        // -------------------------
        const shorts = raw
          .filter((b: any) => b.video && b.video.isShort === true)
          .map((b: any) => {
            const s = b.video;
            return {
              id: s.id,
              bookmarkId: b.id,
              title: s.title,
              creator: `${s.user.firstName} ${s.user.lastName}`,
              thumbnail: s.thumbnailUrl,
              videoUrl: s.url,
              isBookmarked: true,
            };
          });

        setArtistBookmarks(artists);
        setVideoBookmarks(videos);
        setShortBookmarks(shorts);

      } catch (err) {
        console.error("Failed to fetch bookmarks:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, []);

  // ------------------------------------------------------
  // REMOVE BOOKMARK — WORKS FOR ARTIST + VIDEO + SHORT
  // ------------------------------------------------------
  const deleteBookmark = async (bookmarkId: string, type: "artist" | "video" | "short") => {
    try {
      const res = await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) return;

      if (type === "artist")
        setArtistBookmarks(prev => prev.filter(a => a.bookmarkId !== bookmarkId));

      if (type === "video")
        setVideoBookmarks(prev => prev.filter(v => v.bookmarkId !== bookmarkId));

      if (type === "short")
        setShortBookmarks(prev => prev.filter(s => s.bookmarkId !== bookmarkId));

    } catch (err) {
      console.error("Bookmark delete failed:", err);
    }
  };

  // ------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24 bg-background">

        {/* Tabs */}
        <div className="flex bg-card border-b border-b-[#2D2D2D]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-base font-medium transition-colors relative ${
                activeTab === tab ? 'gradient-text' : 'text-text-gray hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink" />
              )}
            </button>
          ))}
        </div>

        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">

          {loading && <div className="text-center text-white py-12">Loading...</div>}

          {/* ARTISTS */}
          {activeTab === "Artist" && !loading && (
            <>
              {artistBookmarks.length > 0 ? (
                <ArtistGrid
                  artists={artistBookmarks}
                  onBookmark={(artistId: string) => {
                    const a = artistBookmarks.find(x => x.id === artistId);
                    if (a) deleteBookmark(a.bookmarkId, "artist");
                  }}
                />
              ) : (
                <div className="text-center text-gray-400 py-12">
                  No bookmarked artists.
                </div>
              )}
            </>
          )}

          {/* VIDEOS */}
          {activeTab === "Videos" && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {videoBookmarks.length > 0 ? (
                videoBookmarks.map((v) => (
                  <VideoCard
                    key={v.id}
                    id={v.id}
                    title={v.title}
                    creator={v.creator}
                    thumbnail={v.thumbnail}
                    videoUrl={v.videoUrl}
                    isBookmarked={true}
                    onBookmark={() => deleteBookmark(v.bookmarkId, "video")}
                    onShare={() => {}}
                  />
                ))
              ) : (
                <div className="text-center text-gray-400 py-12 w-full">No bookmarked videos.</div>
              )}
            </div>
          )}

          {/* SHORTS */}
          {activeTab === "Shorts" && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {shortBookmarks.length > 0 ? (
                shortBookmarks.map((s) => (
                  <ShortsCard
                    key={s.id}
                    id={s.id}
                    title={s.title}
                    creator={s.creator}
                    thumbnail={s.thumbnail}
                    videoUrl={s.videoUrl}
                    isBookmarked={true}
                    onBookmark={() => deleteBookmark(s.bookmarkId, "short")}
                    onShare={() => {}}
                  />
                ))
              ) : (
                <div className="text-center text-gray-400 py-12 w-full">No bookmarked shorts.</div>
              )}
            </div>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}
