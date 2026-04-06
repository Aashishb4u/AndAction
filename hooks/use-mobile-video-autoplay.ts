"use client";

import { useEffect, useRef, RefObject } from 'react';

interface UseMobileVideoAutoplayOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  isYouTube: boolean;
  enabled?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

/**
 * Hook to handle mobile scroll-based autoplay
 * Plays video when it's in the center of the viewport (mobile only)
 */
export function useMobileVideoAutoplay({
  videoRef,
  iframeRef,
  isYouTube,
  enabled = true,
  onPlayStateChange,
}: UseMobileVideoAutoplayOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Only enable on mobile devices
    const isMobile = () => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth <= 768; // Mobile breakpoint
    };

    const mobile = isMobile();
    if (!mobile) return;

    const container = containerRef.current;
    
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isInCenter = entry.isIntersecting && entry.intersectionRatio >= 0.75;
          
          if (isInCenter && !isPlayingRef.current) {
            // Video is in center, play it
            isPlayingRef.current = true;
            onPlayStateChange?.(true);
            
            console.log('▶️ Playing video in center');

            if (isYouTube && iframeRef.current) {
              // Play YouTube video
              iframeRef.current.contentWindow?.postMessage(
                '{"event":"command","func":"playVideo","args":""}',
                "*"
              );
            } else if (videoRef.current) {
              // Play HTML5 video
              videoRef.current.play().catch(() => {
                // Ignore autoplay errors
              });
            }
          } else if (!isInCenter && isPlayingRef.current) {
            // Video left center, pause it
            isPlayingRef.current = false;
            onPlayStateChange?.(false);
            
            console.log('⏸️ Pausing video (left center)');

            if (isYouTube && iframeRef.current) {
              // Pause YouTube video
              iframeRef.current.contentWindow?.postMessage(
                '{"event":"command","func":"pauseVideo","args":""}',
                "*"
              );
            } else if (videoRef.current) {
              // Pause HTML5 video
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '-25% 0px -25% 0px', // Ensures video must be in center 50% of screen
      }
    );

    observer.observe(container);

    // Cleanup
    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, [videoRef, iframeRef, isYouTube, enabled, onPlayStateChange]);

  return containerRef;
}
