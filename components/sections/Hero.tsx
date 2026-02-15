'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import FindArtistModal from '@/components/modals/FindArtistModal';
import { HeroProps } from '@/types';

const Hero: React.FC<HeroProps> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger animations on component mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleFindArtist = () => {
    setIsModalOpen(true);
  };

  return (
    <section
      className={`relative h-[75vh] md:h-[80vh] flex flex-col overflow-hidden ${className} pt-16 md:pt-20`}
      style={{ overflow: 'hidden' }}
    /* pt-16 = 64px for mobile navbar, md:pt-20 = 80px for desktop */
    /* h-[75vh] = 75% of viewport height for mobile, md:h-[70vh] = 70% for desktop */
    >
      {/* Background Video - covers the entire hero section (3/4 of viewport) */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`object-cover object-center w-full h-full ${isLoaded ? 'hero-bg-animate' : ''}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        >
          <source src=" /file.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Dark Overlay */}
        <div className={`absolute inset-0 bg-black/10 ${isLoaded ? 'hero-overlay-animate' : ''}`} />
      </div>
      {/* Black Overlay */}
      <div
        className={`absolute inset-0 bg-black/70 pointer-events-none ${isLoaded ? 'hero-overlay-animate' : ''
          }`}
      />

      {/* Content - centered in the video area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col justify-end md:justify-center items-center pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto w-full">
          {/* Main Heading */}
          <h1 className={`t1 text-text-white mb-3 max-w-3xl md:max-w-4xl ${isLoaded ? 'hero-title-animate' : 'opacity-0'}`}>
            Discover and Book Perfect Artists for your Events
          </h1>

          {/* Subtitle */}
          <p className={`text-text-gray secondary-grey-text max-w-2xl md:max-w-3xl mx-auto mb-5 ${isLoaded ? 'hero-subtitle-animate' : 'opacity-0'}`}>
            Connecting talent with unforgettable experiences, all in one place!
          </p>

          {/* CTA Button */}
          <div className={`flex justify-center ${isLoaded ? 'hero-button-animate translate-y-0 md:translate-y-12' : 'opacity-0'}`}>
            <Button
              variant="primary"
              size="md"
              onClick={handleFindArtist}
              className="px-8 py-3 w-full max-w-96 shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300 btn1-responsive"
            >
              Find your Artist
            </Button>
          </div>
        </div>
      </div>

{/* Curve - positioned at the bottom of hero section */}
      <div className="absolute left-0 right-0 bottom-0 z-50 pointer-events-none select-none">
        <svg
          viewBox="0 0 1400 80"
          width="100%"
          height="85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="block"
        >
          <defs>
            {/* Main curve stroke gradient */}
            <linearGradient id="strokeFade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF2D7A" stopOpacity="0" />
              <stop offset="15%" stopColor="#FF2D7A" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#FF2D7A" stopOpacity="1" />
              <stop offset="85%" stopColor="#FF2D7A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF2D7A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Dark curve fill */}
          <path
            d="M0,80 Q720,10 1440,80 L1440,80 L0,80 Z"
            fill="#0A0A0A"
          />

          {/* Main curve stroke */}
          <path
            d="M0,80 Q720,10 1440,80"
            fill="none"
            stroke="url(#strokeFade)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Inner thin highlight */}
          <path
            d="M0,80 Q720,10 1440,80"
            fill="none"
            stroke="#FF2D7A"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Pink spotlight — originates from curve center, extends into Artists section */}
      <div
        className="absolute left-1/2 bottom-0 pointer-events-none"
        style={{
          width: '65%',
          height: '350px',
          transform: 'translate(-50%, 90%)',
          background: 'radial-gradient(ellipse 55% 65% at 50% 0%, rgba(255,45,122,0.32) 0%, rgba(255,45,122,0.16) 30%, rgba(255,45,122,0.05) 55%, transparent 80%)',
          zIndex: 100,
        }}
      />








      {/* Find Artist Modal */}
      <FindArtistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default Hero;
