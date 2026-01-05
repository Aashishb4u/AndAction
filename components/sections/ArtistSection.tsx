'use client';

import React, { useRef, useState } from 'react';
import ArtistCard from '@/components/ui/ArtistCard';

import Modal from '@/components/ui/Modal';

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
  className?: string;
}

const ArtistSection: React.FC<ArtistSectionProps> = ({
  title,
  artists,
  className = '',
}) => {

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showNoArtistModal, setShowNoArtistModal] = useState(false);

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

  return (
    <div className={`w-full ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1 px-6">
        <h2 className="h2 text-white">{title}</h2>
        <button
          className="gradient-text hover:text-primary-orange transition-colors duration-300 btn1 border-b border-primary-pink/80 leading-4!"
          onClick={() => {
            if (artists.length === 0) {
              setShowNoArtistModal(true);
            } else {
              // TODO: Implement navigation to all artists page if needed
            }
          }}
        >
          View all
        </button>
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
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:scale-110"
            aria-label="Scroll left"
          >
            <svg
              className="w-5 h-5"
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
          </button>

          {/* Right Scroll Button */}
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:scale-110"
            aria-label="Scroll right"
          >
            <svg
              className="w-5 h-5"
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
          </button>

          {/* Cards Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-6 py-2 cursor-grab active:cursor-grabbing"
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
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                name={artist.name}
                location={artist.location}
                thumbnail={artist.thumbnail}
                videoUrl={artist.videoUrl}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistSection;
