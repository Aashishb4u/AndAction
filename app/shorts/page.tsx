'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import ShortsPlayer from '@/components/ui/ShortsPlayer';

export default function ShortsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shorts, setShorts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('shorts_sound');
      if (saved === 'on') setSoundEnabled(true);
    }
  }, []);

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
      const nextPage = page + 1;
      fetchShorts(nextPage);
      setPage(nextPage);
    }
  }, [currentIndex, shorts.length, page]);

  const fetchShorts = async (pageNum = 1) => {
    try {
      const res = await fetch(`/api/videos?type=shorts&page=${pageNum}`);
      const json = await res.json();

      const mapped = json.data.videos.map((v: any) => ({
        id: v.id,
        title: v.title,
        creator: `${v.user.firstName} ${v.user.lastName}`,
        creatorId: v.user.id,
        avatar: v.user.avatar,
        videoUrl: v.url,
        thumbnail: v.thumbnailUrl,
        description: '',
        isBookmarked: false,
      }));

      setShorts((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error('Failed to fetch shorts:', err);
    }
  };

  const handleScroll = useCallback(
    (direction: 'up' | 'down', velocity: number = 1) => {
      const now = Date.now();
      const debounceTime = velocity > 2 ? 50 : 100;

      if (now - lastScrollTime.current < debounceTime) {
        return;
      }

      lastScrollTime.current = now;

      setCurrentIndex((prevIndex) => {
        const newIndex =
          direction === 'down'
            ? Math.min(prevIndex + 1, shorts.length - 1)
            : Math.max(prevIndex - 1, 0);

        if (newIndex === prevIndex) return prevIndex;

        if (newIndex >= shorts.length - 2) loadMoreVideos();

        return newIndex;
      });
    },
    [shorts.length, loadMoreVideos],
  );

  // Wheel (desktop)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      const deltaY = e.deltaY;
      const timeDelta = Math.max(now - lastScrollTime.current, 16);
      velocityRef.current = Math.min(Math.abs(deltaY) / timeDelta, 10);

      if (Math.abs(deltaY) > 3) {
        const direction = deltaY > 0 ? 'down' : 'up';
        handleScroll(direction, velocityRef.current);
      }
    },
    [handleScroll],
  );

  // Touch events (mobile)
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

    if (timeDelta > 0) velocityRef.current = Math.abs(deltaY) / timeDelta;

    lastTouchTime.current = now;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.stopPropagation();
      touchEndY.current = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY.current;
      const now = Date.now();
      const duration = now - lastTouchTime.current;
      const finalVelocity = Math.abs(deltaY) / Math.max(duration, 50);

      const threshold = finalVelocity > 0.5 ? 25 : 40;

      if (Math.abs(deltaY) > threshold) {
        const direction = deltaY > 0 ? 'down' : 'up';
        handleScroll(direction, finalVelocity);
      }
    },
    [handleScroll],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;

      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleScroll('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleScroll('up');
      }
    },
    [handleScroll],
  );

  useEffect(() => {
    fetchShorts(1);
  }, []);

  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    const mobile = mobileContainerRef.current;
    const desktop = desktopContainerRef.current;

    if (mobile) {
      mobile.addEventListener('touchstart', handleTouchStart, { passive: true });
      mobile.addEventListener('touchmove', handleTouchMove, { passive: false });
      mobile.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    if (desktop) {
      desktop.addEventListener('touchstart', handleTouchStart, { passive: true });
      desktop.addEventListener('touchmove', handleTouchMove, { passive: false });
      desktop.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);

      if (mobile) {
        mobile.removeEventListener('touchstart', handleTouchStart);
        mobile.removeEventListener('touchmove', handleTouchMove);
        mobile.removeEventListener('touchend', handleTouchEnd);
      }

      if (desktop) {
        desktop.removeEventListener('touchstart', handleTouchStart);
        desktop.removeEventListener('touchmove', handleTouchMove);
        desktop.removeEventListener('touchend', handleTouchEnd);
      }

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown]);

  const getVisibleVideos = useCallback(() => {
    const bufferSize = 2;
    const startIndex = Math.max(0, currentIndex - bufferSize);
    const endIndex = Math.min(shorts.length - 1, currentIndex + bufferSize);

    return shorts.slice(startIndex, endIndex + 1).map((short, idx) => ({
      ...short,
      absoluteIndex: startIndex + idx,
    }));
  }, [currentIndex, shorts]);

  const handleBookmark = (id: string) => {
    setShorts((prev) =>
      prev.map((short) =>
        short.id === id ? { ...short, isBookmarked: !short.isBookmarked } : short,
      ),
    );
  };

  const handleShare = (id: string) => {
    console.log('Share short:', id);
  };

  const visibleVideos = getVisibleVideos();

  return (
    <SiteLayout showPreloader={false} hideBottomBar>
      {/* MOBILE */}
      <div className="md:hidden">
        <div
          ref={mobileContainerRef}
          className="fixed inset-0 bg-black overflow-hidden shorts-scrollbar-hide"
          style={{ height: '100vh', width: '100vw' }}
        >
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
                style={{ top: `${video.absoluteIndex * 100}vh` }}
              >
                <ShortsPlayer
                  short={video}
                  isActive={video.absoluteIndex === currentIndex}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  soundEnabled={soundEnabled}
                  setSoundEnabled={setSoundEnabled}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block pt-20 lg:pt-24 min-h-screen bg-black">
        <div className="max-w-md mx-auto">
          <div
            ref={desktopContainerRef}
            className="relative bg-black overflow-hidden shorts-scrollbar-hide"
            style={{ height: 'calc(100vh - 6rem)' }}
          >
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
                  style={{ top: `${video.absoluteIndex * 100}%` }}
                >
                  <ShortsPlayer
                    short={video}
                    isActive={video.absoluteIndex === currentIndex}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    soundEnabled={soundEnabled}
                    setSoundEnabled={setSoundEnabled}
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
