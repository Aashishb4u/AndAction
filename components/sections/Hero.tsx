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
      className={`relative h-[75vh] md:h-[80vh] flex flex-col ${className} pt-16 md:pt-20 z-10`}
      style={{ overflow: 'visible' }}
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
        <div
          className={`absolute inset-0 ${isLoaded ? 'hero-overlay-animate' : ''}`}
          style={{ backgroundColor: '#0F0F0F88' }}
        />
      </div>
      {/* Black Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none ${isLoaded ? 'hero-overlay-animate' : ''}`}
        style={{ backgroundColor: '#0F0F0F88' }}
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

      {/* Curve with pink spotlight - positioned at the bottom of hero section */}
      <div className="absolute left-0 right-0 pointer-events-none select-none -bottom-[10vh] md:-bottom-[12vh]" style={{ zIndex: 1 }}>
        {/* Mobile Curve SVG */}
        <div className="block md:hidden w-full">
          <Image
            src="/icons/Mobile_Curve.svg"
            alt=""
            width={1440}
            height={200}
            className="w-full h-auto"
            priority
          />
        </div>
        
        {/* Desktop Curve SVG */}
        <div className="hidden md:block w-full">
          <Image
            src="/icons/Curve.svg"
            alt=""
            width={1440}
            height={200}
            className="w-full h-auto"
            priority
          />
        </div>
        
        {/* Pink spotlight — originates from curve center, extends into Artists section */}
        <div
          className="absolute left-1/2 top-0 pointer-events-none"
          style={{
            width: '85%',
            height: '1800px',
            transform: 'translate(-50%, 0)',
            background: 'radial-gradient(ellipse 55% 65% at 50% 0%, rgba(255,45,122,0.32) 0%, rgba(255,45,122,0.16) 20%, rgba(255,45,122,0.08) 45%, rgba(255,45,122,0.03) 70%, transparent 95%)',
            zIndex: 1,
            mixBlendMode: 'screen',
          }}
        />
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