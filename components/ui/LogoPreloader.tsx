'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface LogoPreloaderProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

const LogoPreloader: React.FC<LogoPreloaderProps> = ({
  onLoadingComplete,
  duration = 1500
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [shouldShow, setShouldShow] = useState(true); // Start as true to show immediately

  useEffect(() => {
    // Check if preloader has been shown in this session
    const hasShownPreloader = sessionStorage.getItem('preloader-shown');

    if (hasShownPreloader) {
      // If already shown, immediately hide and call completion callback
      setShouldShow(false);
      onLoadingComplete?.();
    } else {
      // Mark as shown in session storage for future visits
      sessionStorage.setItem('preloader-shown', 'true');
    }
  }, [onLoadingComplete]);

  useEffect(() => {
    // Start the loading sequence after logo is loaded and should show
    if (logoLoaded && shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Call completion callback after fade out animation
        setTimeout(() => {
          onLoadingComplete?.();
        }, 500); // Wait for fade out animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [logoLoaded, duration, onLoadingComplete, shouldShow]);

  // Don't render if shouldn't show
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`
      fixed inset-0 z-[9999] flex items-center justify-center
      bg-black transition-all duration-500 ease-out
      ${!logoLoaded || !isVisible ? 'opacity-0' : 'opacity-100'}
    `}>
      {/* Background with subtle gradient and animated particles */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Subtle animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary-pink/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-primary-orange/30 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-3/4 w-1.5 h-1.5 bg-primary-pink/15 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Logo container */}
      <div className="relative z-10 flex items-center justify-center">
        <div className={`
          transition-all duration-1200 ease-out
          ${logoLoaded
            ? 'opacity-100 scale-100 transform-none'
            : 'opacity-0 scale-90 transform translate-y-8'
          }
        `}>
          <div className="relative">
            <Image
              src="/logo.png"
              alt="ANDACTION Logo"
              width={250}
              height={250}
              priority
              className={`
                w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56
                object-contain
                transition-all duration-1200 ease-out
                ${logoLoaded
                  ? 'opacity-100 scale-100 logo-animate'
                  : 'opacity-0 scale-85'
                }
              `}
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)} // Fallback in case of error
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoPreloader;
