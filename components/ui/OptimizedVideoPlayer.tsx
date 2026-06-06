'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  poster?: string;
  videoId?: string;
  onVideoReady?: () => void; // Callback when video is loaded and ready
}

// Helper functions
function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeId(url: string) {
  const regex = /(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : "";
}

const OptimizedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title = 'Video player',
  className = '',
  autoplay = false,
  poster,
  videoId,
  onVideoReady,
}) => {
  const isYT = isYouTube(videoUrl);
  const ytId = isYT ? getYouTubeId(videoUrl) : null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const milestonesTracked = useRef<Set<number>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(!autoplay); // Don't show spinner for autoplay
  const [hasError, setHasError] = useState(false);
  const [playYouTube, setPlayYouTube] = useState(autoplay); // Only load iframe on click

  // Track video playback milestones
  const trackMilestone = useCallback(async (milestone: number, currentTime: number, duration: number) => {
    if (!videoId || milestonesTracked.current.has(milestone)) return;

    milestonesTracked.current.add(milestone);

    try {
      await fetch(`/api/videos/${videoId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone,
          watchTimeSeconds: currentTime,
          totalDuration: duration,
        }),
      });
      // Removed console.log for performance
    } catch {
      // Silent error - don't block video playback
    }
  }, [videoId]);

  // Handle HTML5 video tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoId) return;

    const handleTimeUpdate = () => {
      const { currentTime, duration } = video;
      if (!duration) return;

      const percentage = (currentTime / duration) * 100;

      if (percentage >= 25 && !milestonesTracked.current.has(25)) {
        trackMilestone(25, currentTime, duration);
      } else if (percentage >= 50 && !milestonesTracked.current.has(50)) {
        trackMilestone(50, currentTime, duration);
      } else if (percentage >= 75 && !milestonesTracked.current.has(75)) {
        trackMilestone(75, currentTime, duration);
      }
    };

    const handleEnded = () => {
      const { currentTime, duration } = video;
      trackMilestone(100, currentTime, duration);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      onVideoReady?.(); // Notify parent that video is ready
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoId, trackMilestone, onVideoReady]);

  // Handle iframe load
  useEffect(() => {
    if (isYT && playYouTube) {
      // Hide loading spinner faster for better perceived performance
      const timer = setTimeout(() => {
        setIsLoading(false);
        onVideoReady?.(); // Notify parent that YouTube iframe is ready
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isYT, playYouTube, onVideoReady]);

  // For YouTube, tracking would require YouTube IFrame API
  // which adds complexity. For now, we'll track HTML5 videos only.
  // You can add YouTube tracking later if needed.

  return (
    <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
      <div className="relative aspect-video">
        {/* Loading spinner */}
        {isLoading && playYouTube && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-white/70 text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center px-4">
              <p className="text-red-500 text-lg mb-2">Failed to load video</p>
              <p className="text-white/50 text-sm">Please try again later</p>
            </div>
          </div>
        )}

        {isYT && ytId ? (
          <>
            {/* YouTube thumbnail placeholder - no API calls */}
            {!playYouTube && (
              <div 
                className="absolute inset-0 cursor-pointer group"
                onClick={() => {
                  setPlayYouTube(true);
                  setIsLoading(true);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    // Fallback to hqdefault if maxresdefault doesn't exist
                    e.currentTarget.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
                  }}
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-medium drop-shadow-lg line-clamp-2">{title}</p>
                </div>
              </div>
            )}

            {/* YouTube iframe - only loads when clicked */}
            {playYouTube && (
              <iframe
                ref={iframeRef}
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
                loading="eager"
              />
            )}
          </>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={videoUrl}
            poster={poster}
            controls
            autoPlay={autoplay}
            playsInline
            preload="auto"
          />
        )}
      </div>
    </div>
  );
};

export default OptimizedVideoPlayer;
