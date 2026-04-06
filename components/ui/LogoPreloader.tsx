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
      fixed inset-0 z-9999 flex items-center justify-center
      bg-black transition-all duration-500 ease-out
      ${!logoLoaded || !isVisible ? 'opacity-0' : 'opacity-100'}
    `}>
      {/* Logo container */}
      <div className="relative z-10 flex items-center justify-center">
        <div className={`
          transition-all duration-1200 ease-out
          ${logoLoaded
            ? 'opacity-100 scale-100 transform-none'
            : 'opacity-0 scale-90 transform translate-y-8'
          }
        `}>
          <div className="rounded-[52px] bg-[#090D12] p-8 sm:rounded-[60px] sm:p-10">
            <Image
              src="/icons/logo.jpeg"
              alt="ANDACTION Logo"
              width={220}
              height={220}
              priority
              className={`
                h-40 w-40 sm:h-44 sm:w-44 md:h-48 md:w-48
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
