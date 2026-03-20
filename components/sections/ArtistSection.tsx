'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ArtistCard from '@/components/ui/ArtistCard';
import Modal from '@/components/ui/Modal';
import { getValueForKey } from '@/lib/artistCategories';

interface Artist {
  id: string;
  name: string;
  location: string;
  thumbnail: string;
  videoUrl: string;
}

interface ArtistSectionProps {
  title: string;
  artists: Artist[];
  categoryKey?: string;
  className?: string;
}

const MAX_VISIBLE = 11; // 11 artists + 1 "View All" card = 12 total

const ArtistSection: React.FC<ArtistSectionProps> = ({
  title,
  artists,
  categoryKey,
  className = '',
}) => {

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showNoArtistModal, setShowNoArtistModal] = useState(false);
  const router = useRouter();

  const hasMore = artists.length > MAX_VISIBLE;
  const visibleArtists = artists.slice(0, MAX_VISIBLE);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth',
      });
    }
  };

  const getTypeParam = () => {
    if (categoryKey) return getValueForKey(categoryKey);
    let typeParam = title.toLowerCase();
    if (typeParam.includes('percussion')) typeParam = 'Dj Percussionist';
    else if (typeParam.includes('dj')) typeParam = 'DJ';
    else if (typeParam.includes('anchor')) typeParam = 'anchor';
    else if (typeParam.includes('band')) typeParam = 'Live Band ';
    else if (typeParam.includes('actor')) typeParam = 'actor';
    else if (typeParam.includes('singer')) typeParam = 'singer';
    else if (typeParam.includes('dancer')) typeParam = 'dancer';
    else if (typeParam.includes('comedian')) typeParam = 'comedian';
    else if (typeParam.includes('musician')) typeParam = 'musician';
    else if (typeParam.includes('magician')) typeParam = 'magician';
    else if (typeParam.includes('mimicry')) typeParam = 'mimicry';
    else if (typeParam.includes('special act')) typeParam = 'specialAct';
    else if (typeParam.includes('spiritual')) typeParam = 'spiritual';
    else if (typeParam.includes('kids entertainer')) typeParam = 'kidsEntertainer';
    return typeParam;
  };

  const handleViewAll = () => {
    if (artists.length === 0) {
      setShowNoArtistModal(true);
    } else {
      const params = new URLSearchParams({ type: getTypeParam() });
      router.push(`/artists?${params.toString()}`);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1 px-4 ">
        <h2 className="h2 text-white">{title}</h2>
        <div className="relative inline-flex">
          <button
            className="gradient-text hover:text-primary-orange transition-colors duration-300 btn1-responsive"
            onClick={() => handleViewAll()}
          >
            View all
          </button>

          {/* Gradient underline matching View all gradient */}
          <div
            className="absolute left-0 right-0 -bottom-1 h-[2px] rounded"
            style={{ background: 'linear-gradient(90deg,#FF6A3D,#FF2A8E)' }}
          />
        </div>
      </div>

      {/* Modal for no artists found */}
      <Modal
        isOpen={showNoArtistModal}
        onClose={() => setShowNoArtistModal(false)}
        title={`No artist found`}
        size="sm"
      >
        <div className="p-6 text-center">
          <p>No artist found for this category.</p>
          <button
            className="mt-4 px-4 py-2 bg-primary-orange text-white rounded hover:bg-primary-pink transition"
            onClick={() => setShowNoArtistModal(false)}
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Only show scrollable container if there are artists */}
      {artists.length > 0 && (
        <div className="relative group">
          {/* Left Scroll Button */}
          {/* <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:scale-110"
            aria-label="Scroll left"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button> */}

          {/* Right Scroll Button */}
          {/* <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:scale-110"
            aria-label="Scroll right"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button> */}

          {/* Cards Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-[10px] overflow-x-auto scrollbar-hide px-4  py-2 md:pb-8 cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            onMouseDown={(e) => {
              const container = scrollContainerRef.current;
              if (!container) return;

              const startX = e.pageX - container.offsetLeft;
              const scrollLeft = container.scrollLeft;
              let isDown = true;

              const handleMouseMove = (e: MouseEvent) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - container.offsetLeft;
                const walk = (x - startX) * 2;
                container.scrollLeft = scrollLeft - walk;
              };

              const handleMouseUp = () => {
                isDown = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            {visibleArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                name={artist.name}
                location={artist.location}
                thumbnail={artist.thumbnail}
                videoUrl={artist.videoUrl}
              />
            ))}

            {/* View All card as the last card in the scroll */}
            {hasMore && (
              <button
                onClick={handleViewAll}
                className="relative flex-shrink-0 w-[150px] h-[225px] md:w-[200px] md:h-[300px] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-primary-pink/20 flex flex-col items-center justify-center gap-3 group"
                style={{ backgroundColor: '#1B1B1B', border: '1px solid var(--border-color)' }}
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-pink/10 to-primary-orange/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

                {/* Arrow circle */}
                <div className="relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-primary-pink flex items-center justify-center group-hover:bg-primary-pink/20 transition-all duration-300">
                  <svg
                    className="w-6 h-6 md:w-7 md:h-7 text-primary-pink transition-transform duration-300 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* Label */}
                <span className="relative z-10 text-sm md:text-base font-semibold gradient-text">
                  View All
                </span>
                <span className="relative z-10 text-xs text-text-gray">
                  {artists.length}+ artists
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistSection;
