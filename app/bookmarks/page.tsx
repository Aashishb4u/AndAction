"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import ArtistGrid from '@/components/sections/ArtistGrid';
import VideoCard from '@/components/ui/VideoCard';
import ShortsCard from '@/components/ui/ShortsCard';
import { useArtistCategories } from "@/hooks/use-artist-categories";
import { findCategoryLabel } from "@/lib/artist-category-utils";
import { transformArtist } from "@/app/artists/transformArtist";

type TabType = 'Artist' | 'Videos' | 'Shorts';

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Artist');
  const { categories } = useArtistCategories();
  const resolveArtistTypeLabel = useMemo(() => {
    return (rawValue?: string) => findCategoryLabel(categories, rawValue);
  }, [categories]);

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
            const normalized = transformArtist({
              id: a.id,
              profileImage: a.profileImage ?? null,
              stageName: a.stageName ?? null,
              artistType: a.artistType ?? null,
              subArtistType: a.subArtistType ?? null,
              shortBio: a.shortBio ?? null,
              performingLanguage: a.performingLanguage ?? null,
              performingEventType: a.performingEventType ?? null,
              performingStates: a.performingStates ?? null,
              yearsOfExperience: a.yearsOfExperience ?? null,
              soloChargesFrom: Number(a.soloChargesFrom) || 0,
              soloChargesTo: a.soloChargesTo ? Number(a.soloChargesTo) : null,
              performingDurationFrom: a.performingDurationFrom ?? null,
              performingDurationTo: a.performingDurationTo ?? null,
              user: {
                id: a.user.id,
                firstName: a.user.firstName ?? null,
                lastName: a.user.lastName ?? null,
                avatar: a.user.avatar ?? null,
                city: a.user.city ?? null,
                state: a.user.state ?? null,
              },
            });

            return {
              ...normalized,
              bookmarkId: b.id,
              isBookmarked: true,
              category: a.artistType || normalized.category,
              location: `${a.user.state || ""}` || normalized.location,
              gender: a.user.gender ?? normalized.gender,
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
              artistId: (v.user as any).artists?.[0]?.id || "",
              artistType: (v.user as any).artists?.[0]?.artistType || "",
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

  // Redirect unauthenticated users to the signin page (no modal)
  React.useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth/signin');
    }
  }, [status, session, router]);

  // While session is loading or redirecting, show a small placeholder
  if (status === 'loading' || !session) {
    return (
      <SiteLayout showPreloader={false}>
        <div className="min-h-screen pt-14 lg:pt-24 bg-background flex items-center justify-center">
          <div className="text-white">Redirecting to sign in...</div>
        </div>
      </SiteLayout>
    );
  }

  // ------------------------------------------------------
  // REMOVE BOOKMARK — WORKS FOR ARTIST + VIDEO + SHORT
  // ------------------------------------------------------
  const deleteBookmark = async (bookmarkId: string, type: "artist" | "video" | "short") => {
    try {
      const res = await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
      const json = await res.json();
      
      if (!json.success) {
        console.error("Failed to delete bookmark:", json.message || json.error);
        return;
      }

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
      <div className="min-h-screen pt-14 lg:pt-24 bg-background">

        {/* Tabs */}
        <div className="flex bg-card border-b border-b-[#2D2D2D]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 btn1 transition-colors relative ${
                activeTab === tab ? 'text-white' : 'text-text-gray hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary-orange to-primary-pink" />
              )}
            </button>
          ))}
        </div>

        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">

          {loading && <LoadingOverlay text="Loading bookmarks..." />}

          {/* ARTISTS */}
          {activeTab === "Artist" && !loading && (
            <>
              {artistBookmarks.length > 0 ? (
                <ArtistGrid className='px-4'
                  artists={artistBookmarks}
                  onBookmark={(artistId: string) => {
                    const a = artistBookmarks.find(x => x.id === artistId);
                    if (a) deleteBookmark(a.bookmarkId, "artist");
                  }}
                />
              ) : (
                <div className="w-full min-h-[50vh] flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <img src="/blank.png" alt="No bookmarks" className="w-48 h-48 mx-auto mb-4" />
                    No bookmarked artists.
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIDEOS */}
          {activeTab === "Videos" && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-4">
              {videoBookmarks.length > 0 ? (
                videoBookmarks.map((v) => (
                  <VideoCard
                    key={v.id}
                    id={v.id}
                    title={v.title}
                    creator={v.creator}
                    artistType={resolveArtistTypeLabel(v.artistType)}
                    thumbnail={v.thumbnail}
                    videoUrl={v.videoUrl}
                    isBookmarked={true}
                    bookmarkId={v.bookmarkId}
                    onBookmark={({ bookmarkId }) => bookmarkId && deleteBookmark(bookmarkId, "video")}
                    onShare={() => {}}
                    artistId={v.artistId}
                  />
                ))
              ) : (
                <div className="w-full min-h-[50vh] flex items-center justify-center col-span-full">
                  <div className="text-center text-gray-400">
                    <img src="/blank.png" alt="No bookmarks" className="w-48 h-48 mx-auto mb-4" />
                    No bookmarked videos.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SHORTS */}
          {activeTab === "Shorts" && !loading && (
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 px-4">
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
                    bookmarkId={s.bookmarkId}
                    onBookmark={({ bookmarkId }) => bookmarkId && deleteBookmark(bookmarkId, "short")}
                    onShare={() => {}}
                  />
                ))
              ) : (
                <div className="w-full min-h-[50vh] flex items-center justify-center col-span-full">
                  <div className="text-center text-gray-400">
                    <img src="/blank.png" alt="No bookmarks" className="w-48 h-48 mx-auto mb-4" />
                    No bookmarked shorts.
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}
