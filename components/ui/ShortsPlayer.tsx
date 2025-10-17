'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Bookmark from '@/components/icons/bookmark';
import Share from '@/components/icons/share';
import MoreVertical from '@/components/icons/more-vertical';
import Play from '@/components/icons/play';
import Pause from '@/components/icons/pause';
import Link from 'next/link';

interface Short {
  id: string;
  title: string;
  creator: string;
  creatorId: string;
  avatar: string;
  videoUrl: string;
  thumbnail: string;
  description: string;
  isBookmarked: boolean;
}

interface ShortsPlayerProps {
  short: Short;
  isActive: boolean;
  shouldLoad?: boolean;
  onBookmark: (id: string) => void;
  onShare: (id: string) => void;
}

const ShortsPlayer: React.FC<ShortsPlayerProps> = ({
  short,
  isActive,
  shouldLoad = true,
  onBookmark,
  onShare,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  // const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>(null);

  // Auto play/pause based on active state with smooth transitions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && isVideoLoaded) {
      // Small delay to ensure smooth transition
      const playTimeout = setTimeout(() => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.warn('Video play failed:', error);
          setIsPlaying(false);
        });
      }, 100);

      return () => clearTimeout(playTimeout);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isVideoLoaded]);

  // Update progress
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        const video = videoRef.current;
        if (video && video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
        }
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  // const handleMuteToggle = () => {
  //   const video = videoRef.current;
  //   if (!video) return;

  //   video.muted = !video.muted;
  //   setIsMuted(video.muted);
  // };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    const video = videoRef.current;
    if (video) {
      // video.muted = isMuted;
    }
  };

  const handleVideoEnd = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play();
    }
  };



  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={short.thumbnail}
          alt={short.title}
          fill
          className="object-cover"
          priority={isActive}
        />
      </div>

      {/* Video Player */}
      {shouldLoad && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={short.videoUrl}
          loop
          playsInline
          muted
          preload={isActive ? 'auto' : 'metadata'}
          onLoadedData={handleVideoLoad}
          onEnded={handleVideoEnd}
          onClick={handleVideoClick}
          style={{
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
      )}

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Play/Pause Overlay */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Click overlay for play/pause - positioned behind UI elements */}
      <div
        className="absolute inset-0 cursor-pointer z-0"
        onClick={handleVideoClick}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex z-10 pointer-events-none">
        {/* Left Side - Creator Info & Description */}
        <div className="flex-1 flex flex-col justify-end p-4 pb-20 md:pb-8">
          {/* Creator Info */}
          <Link href={`/artists/${short.creatorId}`} className="pointer-events-auto">
            <div className="flex items-center space-x-2 mb-4 hover:bg-black/20 rounded-lg p-2 -m-2 transition-all duration-200 cursor-pointer">
              <div className="relative">
                <Image
                  src={short.avatar}
                  alt={short.creator}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white hover:border-primary-pink transition-colors duration-200"
                />
              </div>
              <div>
                <h3 className="text-white btn2 hover:text-primary-pink transition-colors duration-200">
                  {short.creator}
                </h3>
                <p className="footnote text-gray-300">
                  @{short.creatorId}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex flex-col items-center justify-end space-y-4 p-4 pb-24 md:pb-8">
          {/* Share Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(short.id);
              }}
              className="p-3 rounded-full bg-black/30 text-white hover:bg-primary-pink hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto z-20"
            >
              <Share className="w-6 h-6" />
            </button>
          </div>

          {/* Bookmark Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(short.id);
              }}
              className={`p-3 rounded-full transition-all duration-300 pointer-events-auto z-20 active:scale-95 ${short.isBookmarked
                ? 'bg-black/30 text-white scale-110 hover:scale-125'
                : 'bg-black/30 text-white hover:bg-primary-pink hover:scale-110'
                }`}
            >
              <Bookmark
                className={`w-6 h-6 ${short.isBookmarked ? 'fill-current' : ''}`}
              />
            </button>
          </div>

          {/* More Options */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle more options
              console.log('More options clicked for:', short.id);
            }}
            className="p-3 rounded-full bg-black/30 text-white hover:bg-gray-600 hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto z-20"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortsPlayer;
