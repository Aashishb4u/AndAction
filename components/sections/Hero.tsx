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
          <source src="/file.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Dark Overlay */}
        <div className={`absolute inset-0 bg-black/10 ${isLoaded ? 'hero-overlay-animate' : ''}`} />
      </div>
      {/* Black Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 pointer-events-none ${isLoaded ? 'hero-overlay-animate' : ''
          }`}
      />

      {/* Content - centered in the video area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col justify-center items-center">
        <div className="max-w-4xl mx-auto w-full">
          {/* Main Heading */}
          <h1 className={`text-4xl leading-10 lg:leading-14 lg:text-5xl font-bold text-white mb-3 max-w-3xl ${isLoaded ? 'hero-title-animate' : 'opacity-0'}`}>
            Discover and Book Perfect Artists for your Events
          </h1>

          {/* Subtitle */}
          <p className={`text-text-gray max-w-2xl mx-auto mb-5 ${isLoaded ? 'hero-subtitle-animate' : 'opacity-0'}`}>
            Connecting talent with unforgettable experiences, all in one place!
          </p>

          {/* CTA Button */}
          <div className={`flex justify-center ${isLoaded ? 'hero-button-animate' : 'opacity-0'}`}>
            <Button
              variant="primary"
              size="md"
              onClick={handleFindArtist}
              className="px-8 py-3 w-full max-w-96 font-semibold shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300 btn1"
            >
              Find your Artist
            </Button>
          </div>
        </div>
      </div>

      {/* Curve - positioned at the bottom of hero section */}
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none select-none">
        <svg
          viewBox="0 0 1440 60"
          width="100%"
          height="50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="block"
        >
          <defs>
            {/* Pink glow gradient under curve stroke - centered 40% width, fades vertically */}
            <linearGradient id="pinkGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF2D7A" stopOpacity="0" />
              <stop offset="20%" stopColor="#FF2D7A" stopOpacity="0.18" />
              <stop offset="30%" stopColor="#FF2D7A" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#FF2D7A" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FF2D7A" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#FF2D7A" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#FF2D7A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#FF2D7A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FF2D7A" stopOpacity="0" />
            </linearGradient>

            {/* Combined radial gradient - centered horizontally, fades down */}
            {/* <radialGradient id="pinkGlow" cx="50%" cy="0%" r="60%" fx="50%" fy="0%">
              <stop offset="0%" stopColor="#FF2D7A" stopOpacity="0.3" />
              <stop offset="80%" stopColor="#FF2D7A" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#FF2D7A" stopOpacity="0" />
            </radialGradient> */}

            {/* Main curve stroke gradient */}
            <linearGradient id="strokeFade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF2D7A" stopOpacity="0" />
              <stop offset="15%" stopColor="#FF2D7A" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#FF2D7A" stopOpacity="1" />
              <stop offset="85%" stopColor="#FF2D7A" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF2D7A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Black curve fill that creates the transition */}
          <path
            d="M0,60 Q720,20 1440,60 L1440,60 L0,60 Z"
            fill="black"
          />

          {/* Pink gradient overlay slightly inside black curve */}
          <path
            d="M0,60 Q720,20 1440,60 L1440,120 L0,60 Z"
            fill="url(#pinkGlow)"
          />

          {/* Main curve stroke */}
          <path
            d="M0,60 Q720,20 1440,60"
            fill="none"
            stroke="url(#strokeFade)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Inner thin highlight */}
          <path
            d="M0,60 Q720,20 1440,60"
            fill="none"
            stroke="#FF2D7A"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>








      {/* Find Artist Modal */}
      <FindArtistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default Hero;
