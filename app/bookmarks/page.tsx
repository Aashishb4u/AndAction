'use client';

import React, { useEffect, useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import ArtistGrid from '@/components/sections/ArtistGrid';
import VideoCard from '@/components/ui/VideoCard';
import ShortsCard from '@/components/ui/ShortsCard';
import { Artist } from '@/types';

// Sample bookmarked - in real app, this would come from API/localStorage
const sampleBookmarkedArtists: any[] = [
  {
    id: '1',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'male',
    subCategory: 'bollywood',
  },
  {
    id: '2',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'female',
    subCategory: 'classical',
  },
  {
    id: '3',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'male',
    subCategory: 'folk',
  },
  {
    id: '4',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'male',
    subCategory: 'rock',
  },
  {
    id: '5',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'male',
    subCategory: 'jazz',
  },
  {
    id: '6',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'male',
    subCategory: 'pop',
  },
  {
    id: '7',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'female',
    subCategory: 'indie',
  },
  {
    id: '8',
    name: 'MJ Singer',
    category: 'Singer',
    location: 'Location',
    duration: '120 - 160 minutes',
    startingPrice: 100000,
    languages: ['English', 'Gujarati', 'Hindi'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    isBookmarked: true,
    gender: 'male',
    subCategory: 'electronic',
  },
];

const sampleBookmarkedVideos = [
  {
    id: '1',
    title: 'Amazing Performance by Local Artist',
    creator: 'Harsh Arora',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: '2',
    title: 'Incredible Dance Moves',
    creator: 'Sarah Johnson',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: '3',
    title: 'Live Concert Highlights',
    creator: 'Mike Chen',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: '4',
    title: 'Behind the Scenes',
    creator: 'Emma Wilson',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
];

const sampleBookmarkedShorts = [
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
    creator: 'Sarah Johnson',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'short-3',
    title: 'Studio Vibes',
    creator: 'Mike Chen',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'short-4',
    title: 'Live Performance',
    creator: 'Emma Wilson',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'short-5',
    title: 'Acoustic Session',
    creator: 'Alex Turner',
    thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    id: 'short-6',
    title: 'Dance Challenge',
    creator: 'Lisa Park',
    thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=500&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
];

type TabType = 'Artist' | 'Videos' | 'Shorts';

export default function BookmarksPage() {
  const [artistBookmarks, setArtistBookmarks] = useState<Artist[]>([]);
  const [loadingArtistBookmarks, setLoadingArtistBookmarks] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('Artist');
  const [bookmarkedArtists, setBookmarkedArtists] = useState<Set<string>>(
    new Set(sampleBookmarkedArtists.map(artist => artist.id))
  );
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(
    new Set(sampleBookmarkedVideos.map(video => video.id))
  );
  const [bookmarkedShorts, setBookmarkedShorts] = useState<Set<string>>(
    new Set(sampleBookmarkedShorts.map(short => short.id))
  );

  const tabs: TabType[] = ['Artist', 'Videos', 'Shorts'];
  useEffect(() => {
  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/bookmarks');
      const json = await res.json();

      if (json.success) {
        const mappedArtists = json.data.bookmarks
          .filter((b: any) => b.artist)
          .map((b: any) => {
            const a = b.artist;
            return {
              id: a.id,
              name: a.stageName || `${a.user.firstName} ${a.user.lastName}`,
              category: a.artistType,
              subCategory: a.subArtistType,
              location: `${a.user.city || ''}${a.user.state ? ', ' + a.user.state : ''}`,
              duration: '120 - 160 minutes', // MOCK FIELD
              startingPrice: Number(a.soloChargesFrom) || 0,
              languages: [a.performingLanguage],
              image: a.user.avatar || '/icons/images.jpeg',
              isBookmarked: true,
              gender: a.user.gender || 'unknown',
            };
          });

        setArtistBookmarks(mappedArtists);
      }
    } catch (err) {
      console.error('Bookmark fetch failed:', err);
    } finally {
      setLoadingArtistBookmarks(false);
    }
  };

  fetchBookmarks();
}, []);


  const handleArtistBookmark = (artistId: string) => {
    setBookmarkedArtists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artistId)) {
        newSet.delete(artistId);
      } else {
        newSet.add(artistId);
      }
      return newSet;
    });
  };

  const handleVideoBookmark = (videoId: string) => {
    setBookmarkedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleVideoShare = (videoId: string) => {
    console.log('Share video:', videoId);
  };

  const handleShortBookmark = (shortId: string) => {
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

  const handleShortShare = (shortId: string) => {
    console.log('Share short:', shortId);
  };

  // Filter out unbookmarked items
  const filteredArtists = sampleBookmarkedArtists.filter(artist =>
    bookmarkedArtists.has(artist.id)
  );
  const filteredVideos = sampleBookmarkedVideos.filter(video =>
    bookmarkedVideos.has(video.id)
  );
  const filteredShorts = sampleBookmarkedShorts.filter(short =>
    bookmarkedShorts.has(short.id)
  );

  return (
    <SiteLayout showPreloader={false}>
      <div className="min-h-screen pt-20 lg:pt-24 bg-background">
        {/* Tabs */}
        <div className="md:mb-8">
          <div className="flex bg-card border-b border-b-[#2D2D2D]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 text-base font-medium transition-colors relative ${activeTab === tab
                  ? 'gradient-text'
                  : 'text-text-gray hover:text-gray-300'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-orange to-primary-pink" />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

          {/* Tab Content */}
          <div className="pb-8">
            {activeTab === 'Artist' && (
  <div>
    {loadingArtistBookmarks ? (
      <div className="text-center py-16 text-white">Loading...</div>
    ) : artistBookmarks.length > 0 ? (
      <ArtistGrid
        artists={artistBookmarks}
        onBookmark={handleArtistBookmark}
      />
    ) : (
      <div className="text-center py-16">
        <div className="mb-4">
          <svg className="w-16 h-16 text-gray-600 mx-auto" viewBox="0 0 24 24" fill="none">
            <path d="M21.9004 16.09V11.098C21.9004 6.808 21.9004 4.665 20.5824 3.332..." stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Bookmarked Artists</h3>
        <p className="text-gray-400">Start exploring and bookmark your favorite artists!</p>
      </div>
    )}
  </div>
)}


            {activeTab === 'Videos' && (
              <div className='px-4 mt-4'>
                {filteredVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        id={video.id}
                        title={video.title}
                        creator={video.creator}
                        thumbnail={video.thumbnail}
                        videoUrl={video.videoUrl}
                        onBookmark={handleVideoBookmark}
                        onShare={handleVideoShare}
                        isBookmarked={bookmarkedVideos.has(video.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mb-4">
                      <svg className="w-16 h-16 text-gray-600 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.9004 16.09V11.098C21.9004 6.808 21.9004 4.665 20.5824 3.332C19.2644 2 17.1424 2 12.9004 2C8.65839 2 6.53639 2 5.21839 3.332C3.90039 4.664 3.90039 6.81 3.90039 11.098V16.091C3.90039 19.187 3.90039 20.736 4.63439 21.412C4.98439 21.735 5.42639 21.938 5.89739 21.992C6.88439 22.105 8.03739 21.085 10.3424 19.046C11.3624 18.145 11.8714 17.694 12.4604 17.576C12.7504 17.516 13.0504 17.516 13.3404 17.576C13.9304 17.694 14.4394 18.145 15.4584 19.046C17.7634 21.085 18.9164 22.105 19.9034 21.991C20.3734 21.938 20.8164 21.735 21.1664 21.412C21.9004 20.736 21.9004 19.187 21.9004 16.09Z" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Bookmarked Videos</h3>
                    <p className="text-gray-400">Start exploring and bookmark your favorite videos!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Shorts' && (
              <div className='px-4 mt-4'>
                {filteredShorts.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 gap-2.5">
                    {filteredShorts.map((short) => (
                      <ShortsCard
                        key={short.id}
                        id={short.id}
                        title={short.title}
                        creator={short.creator}
                        thumbnail={short.thumbnail}
                        videoUrl={short.videoUrl}
                        onBookmark={handleShortBookmark}
                        onShare={handleShortShare}
                        isBookmarked={bookmarkedShorts.has(short.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mb-4">
                      <svg className="w-16 h-16 text-gray-600 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.9004 16.09V11.098C21.9004 6.808 21.9004 4.665 20.5824 3.332C19.2644 2 17.1424 2 12.9004 2C8.65839 2 6.53639 2 5.21839 3.332C3.90039 4.664 3.90039 6.81 3.90039 11.098V16.091C3.90039 19.187 3.90039 20.736 4.63439 21.412C4.98439 21.735 5.42639 21.938 5.89739 21.992C6.88439 22.105 8.03739 21.085 10.3424 19.046C11.3624 18.145 11.8714 17.694 12.4604 17.576C12.7504 17.516 13.0504 17.516 13.3404 17.576C13.9304 17.694 14.4394 18.145 15.4584 19.046C17.7634 21.085 18.9164 22.105 19.9034 21.991C20.3734 21.938 20.8164 21.735 21.1664 21.412C21.9004 20.736 21.9004 19.187 21.9004 16.09Z" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Bookmarked Shorts</h3>
                    <p className="text-gray-400">Start exploring and bookmark your favorite shorts!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
