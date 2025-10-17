'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MoreVertical from '@/components/icons/more-vertical';
import Bookmark from '@/components/icons/bookmark';
import Share from '@/components/icons/share';
import { Trash2 } from 'lucide-react';

interface ShortsCardProps {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  videoUrl: string;
  className?: string;
  onBookmark?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
  isBookmarked?: boolean;
  showDeleteButton?: boolean;
}

const ShortsCard: React.FC<ShortsCardProps> = ({
  id,
  title,
  creator,
  thumbnail,
  videoUrl,
  className = '',
  onBookmark,
  onShare,
  onDelete,
  isBookmarked = false,
  showDeleteButton = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle play error silently
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowMenu(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onBookmark?.(id);
    setShowMenu(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onShare?.(id);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(id);
  };

  return (
    <Link href={`/videos/${id}`} className="block">
      <div
        className={`relative group cursor-pointer transition-all duration-300 ease-out hover:scale-105 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video Container - Vertical aspect ratio for shorts */}
        <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-card">
          {/* Background Image */}
          <div className="absolute inset-0 transition-opacity duration-300 select-none">
            <Image
              src={thumbnail}
              alt={title + ' ' + creator}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={false}
            />
          </div>

          {/* Video Overlay */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${isHovered && isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={handleVideoLoad}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Delete Button - Top Right */}
          {showDeleteButton && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full absolute top-2 right-2 bg-card backdrop-blur-sm text-red-500 transition-all duration-300 hover:scale-110 z-10"
              title="Delete short"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) || (
              <>
                {/* Three Dots Menu */}
                <div className={`absolute top-3 right-3`}>
                  <button
                    onClick={handleMenuToggle}
                    className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-card/95 backdrop-blur-md rounded-lg shadow-xl border border-background-light z-10">
                      <button
                        onClick={handleBookmark}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-card ${isBookmarked ? 'text-primary-pink' : 'text-white'
                          }`}
                      >
                        <Bookmark className="w-4 h-4" />
                        {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white transition-colors hover:bg-card"
                      >
                        <Share className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}


        </div>

      </div>
    </Link>
  );
};

export default ShortsCard;
