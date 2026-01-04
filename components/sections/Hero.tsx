'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
      className={`relative md:min-h-screen min-h-[80vh] flex items-end pb-28 justify-center overflow-hidden ${className} pt-16 md:pt-20`}
      /* pt-16 = 64px for mobile navbar, md:pt-20 = 80px for desktop */
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.jpg"
          alt="Hero Background"
          fill
          className={`object-cover object-center ${isLoaded ? 'hero-bg-animate' : ''}`}
          priority
        />
        {/* Dark Overlay */}
        <div className={`absolute inset-0 bg-black/10 ${isLoaded ? 'hero-overlay-animate' : ''}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center h-full flex flex-col justify-center items-center pb-10">
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

      {/* Find Artist Modal */}
      <FindArtistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default Hero;
