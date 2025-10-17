'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import ShortsPlayer from '@/components/ui/ShortsPlayer';

// Sample shorts data - in real app, this would come from API
const shortsData = [
  {
    id: 'short-1',
    title: 'Amazing Guitar Solo',
    creator: 'Harsh Arora',
    creatorId: 'harsharora',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    description: 'Check out this incredible guitar solo! 🎸 #guitar #music #solo',
    isBookmarked: false,
  },
  {
    id: 'short-2',
    title: 'Creative Animation Story',
    creator: 'Sarah Johnson',
    creatorId: 'sarahjohnson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=700&fit=crop',
    description: 'Beautiful animated story that will touch your heart! ✨ #animation #art #story',
    isBookmarked: false,
  },
  {
    id: 'short-3',
    title: 'Epic Adventure Trailer',
    creator: 'Mike Chen',
    creatorId: 'mikechen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=700&fit=crop',
    description: 'Get ready for the ultimate adventure experience! 🔥 #adventure #action #epic',
    isBookmarked: true,
  },
  {
    id: 'short-4',
    title: 'Escape to Paradise',
    creator: 'Alex Rivera',
    creatorId: 'alexrivera',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    description: 'Sometimes you need to escape to find yourself 🌴 #travel #escape #paradise',
    isBookmarked: false,
  },
  {
    id: 'short-5',
    title: 'Fun Times Ahead',
    creator: 'Emma Wilson',
    creatorId: 'emmawilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=700&fit=crop',
    description: 'Life is better when you\'re having fun! � #fun #party #goodvibes',
    isBookmarked: false,
  },
  {
    id: 'short-6',
    title: 'Joyride Adventure',
    creator: 'Jordan Smith',
    creatorId: 'jordansmith',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=700&fit=crop',
    description: 'Life is about the journey, not the destination! � #adventure #joyride #freedom',
    isBookmarked: false,
  },
  {
    id: 'short-7',
    title: 'Emotional Meltdown',
    creator: 'Lisa Park',
    creatorId: 'lisapark',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    description: 'Sometimes we all need a good emotional release 😭 #emotions #real #authentic',
    isBookmarked: true,
  },
  {
    id: 'short-8',
    title: 'Fantasy Epic',
    creator: 'Carlos Martinez',
    creatorId: 'carlosmartinez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=700&fit=crop',
    description: 'A beautiful fantasy tale that will captivate your imagination! ⚔️ #fantasy #epic #story',
    isBookmarked: false,
  },
  {
    id: 'short-9',
    title: 'Off-Road Adventure',
    creator: 'Maya Patel',
    creatorId: 'mayapatel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=700&fit=crop',
    description: 'Taking the road less traveled! �️ #offroad #adventure #nature #explore',
    isBookmarked: false,
  },
  {
    id: 'short-10',
    title: 'Sci-Fi Masterpiece',
    creator: 'Ryan Thompson',
    creatorId: 'ryanthompson',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=700&fit=crop',
    description: 'Mind-bending sci-fi that will leave you speechless! 🚀 #scifi #future #technology',
    isBookmarked: false,
  },
  {
    id: 'short-11',
    title: 'Car Review Adventure',
    creator: 'David Kim',
    creatorId: 'davidkim',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    description: 'Testing the limits of this amazing car! 🚗 #cars #review #automotive #speed',
    isBookmarked: false,
  },
  {
    id: 'short-12',
    title: 'Rally Road Trip',
    creator: 'Jessica Brown',
    creatorId: 'jessicabrown',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=700&fit=crop',
    description: 'Join us on the ultimate road trip adventure! 🏁 #rally #roadtrip #adventure #cars',
    isBookmarked: true,
  },
  {
    id: 'short-13',
    title: 'Budget Car Hunt',
    creator: 'Marcus Johnson',
    creatorId: 'marcusjohnson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=700&fit=crop',
    description: 'Can you find a good car for just $1000? Let\'s find out! 💰 #budget #cars #challenge',
    isBookmarked: false,
  },
  {
    id: 'short-14',
    title: 'Animation Masterclass',
    creator: 'Sophia Chen',
    creatorId: 'sophiachen',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=700&fit=crop',
    description: 'Learn the art of 3D animation with this masterpiece! 🎨 #animation #3d #art #tutorial',
    isBookmarked: false,
  },
  {
    id: 'short-15',
    title: 'Dream Sequence',
    creator: 'Ahmed Hassan',
    creatorId: 'ahmedhassan',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=700&fit=crop',
    description: 'Dive into a surreal world of dreams and imagination! 🌙 #dreams #surreal #art #fantasy',
    isBookmarked: false,
  },
];

export default function ShortsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shorts, setShorts] = useState(shortsData);

  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);

  // Load more videos when approaching the end
  const loadMoreVideos = useCallback(() => {
    if (currentIndex >= shorts.length - 2) {
      // In a real app, this would fetch more videos from API
      const newShorts = [...shortsData.map((short) => ({
        ...short,
        id: `${short.id}-${Math.random()}`, // Ensure unique IDs
      }))];
      setShorts(prev => [...prev, ...newShorts]);
    }
  }, [currentIndex, shorts.length]);

  const handleScroll = useCallback((direction: 'up' | 'down', velocity: number = 1) => {
    const now = Date.now();

    // Simple debouncing - only check time, not transition state
    const debounceTime = velocity > 2 ? 50 : 100; // Reduced debounce time
    if (now - lastScrollTime.current < debounceTime) {
      return;
    }

    lastScrollTime.current = now;

    setCurrentIndex(prevIndex => {
      const newIndex = direction === 'down'
        ? Math.min(prevIndex + 1, shorts.length - 1)
        : Math.max(prevIndex - 1, 0);

      // Don't scroll if already at boundary
      if (newIndex === prevIndex) {
        return prevIndex;
      }

      // Load more videos if approaching end
      if (newIndex >= shorts.length - 2) {
        loadMoreVideos();
      }

      return newIndex;
    });
  }, [shorts.length, loadMoreVideos]);

  // Handle wheel events for desktop with momentum
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const deltaY = e.deltaY;

    // Calculate velocity for momentum (normalized)
    const timeDelta = Math.max(now - lastScrollTime.current, 16); // Min 16ms for 60fps
    velocityRef.current = Math.min(Math.abs(deltaY) / timeDelta, 10); // Cap velocity

    // More sensitive threshold for better responsiveness
    if (Math.abs(deltaY) > 3) {
      const direction = deltaY > 0 ? 'down' : 'up';
      handleScroll(direction, velocityRef.current);
    }
  }, [handleScroll]);

  // Handle touch events for mobile with momentum
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    touchStartY.current = e.touches[0].clientY;
    lastTouchTime.current = Date.now();
    velocityRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    const now = Date.now();
    const timeDelta = now - lastTouchTime.current;

    // Calculate velocity for momentum
    if (timeDelta > 0) {
      velocityRef.current = Math.abs(deltaY) / timeDelta;
    }

    lastTouchTime.current = now;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    touchEndY.current = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY.current;
    const now = Date.now();
    const touchDuration = now - lastTouchTime.current;

    // Calculate final velocity for momentum
    const finalVelocity = Math.abs(deltaY) / Math.max(touchDuration, 50);

    // More sensitive threshold with velocity consideration
    const threshold = finalVelocity > 0.5 ? 25 : 40; // Lower threshold for fast swipes
    if (Math.abs(deltaY) > threshold) {
      const direction = deltaY > 0 ? 'down' : 'up';
      handleScroll(direction, finalVelocity);
    }
  }, [handleScroll]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle if not typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      handleScroll('down', 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleScroll('up', 1);
    }
  }, [handleScroll]);

  // Initialize event listeners

  useEffect(() => {
    // Add global event listeners
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    // Add touch event listeners to both containers
    const mobileContainer = mobileContainerRef.current;
    const desktopContainer = desktopContainerRef.current;

    if (mobileContainer) {
      mobileContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      mobileContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      mobileContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    if (desktopContainer) {
      desktopContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      desktopContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      desktopContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);

      if (mobileContainer) {
        mobileContainer.removeEventListener('touchstart', handleTouchStart);
        mobileContainer.removeEventListener('touchmove', handleTouchMove);
        mobileContainer.removeEventListener('touchend', handleTouchEnd);
      }

      if (desktopContainer) {
        desktopContainer.removeEventListener('touchstart', handleTouchStart);
        desktopContainer.removeEventListener('touchmove', handleTouchMove);
        desktopContainer.removeEventListener('touchend', handleTouchEnd);
      }

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown]);

  // Optimized video rendering - only render visible videos plus buffer
  const getVisibleVideos = useCallback(() => {
    const bufferSize = 2; // Render 2 videos before and after current
    const startIndex = Math.max(0, currentIndex - bufferSize);
    const endIndex = Math.min(shorts.length - 1, currentIndex + bufferSize);

    return shorts.slice(startIndex, endIndex + 1).map((short, relativeIndex) => ({
      ...short,
      absoluteIndex: startIndex + relativeIndex,
    }));
  }, [currentIndex, shorts]);

  const handleBookmark = (id: string) => {
    setShorts(prevShorts =>
      prevShorts.map(short =>
        short.id === id
          ? { ...short, isBookmarked: !short.isBookmarked }
          : short
      )
    );
  };

  const handleShare = (id: string) => {
    // In real app, implement share functionality
    console.log('Share short:', id);
  };

  const visibleVideos = getVisibleVideos();

  return (
    <SiteLayout showPreloader={false} hideBottomBar>
      {/* Mobile: Full screen */}
      <div className="md:hidden">
        <div
          ref={mobileContainerRef}
          className="fixed inset-0 bg-black overflow-hidden shorts-scrollbar-hide"
          style={{ height: '100vh', width: '100vw' }}
        >
          {/* Shorts Container */}
          <div
            className="relative h-full"
            style={{
              transform: `translateY(-${currentIndex * 100}vh)`,
              transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
              willChange: 'transform',
            }}
          >
            {visibleVideos.map((video) => (
              <div
                key={`${video.id}-${video.absoluteIndex}`}
                className="absolute inset-0 w-full h-full"
                style={{
                  top: `${video.absoluteIndex * 100}vh`,
                }}
              >
                <ShortsPlayer
                  short={video}
                  isActive={video.absoluteIndex === currentIndex}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Centered with max width */}
      <div className="hidden md:block pt-20 lg:pt-24 min-h-screen bg-black">
        <div className="max-w-md mx-auto">
          <div
            ref={desktopContainerRef}
            className="relative bg-black overflow-hidden shorts-scrollbar-hide"
            style={{ height: 'calc(100vh - 6rem)' }}
          >
            {/* Shorts Container */}
            <div
              className="relative h-full"
              style={{
                transform: `translateY(-${currentIndex * 100}%)`,
                transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                willChange: 'transform',
              }}
            >
              {visibleVideos.map((video) => (
                <div
                  key={`${video.id}-${video.absoluteIndex}`}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    top: `${video.absoluteIndex * 100}%`,
                  }}
                >
                  <ShortsPlayer
                    short={video}
                    isActive={video.absoluteIndex === currentIndex}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
