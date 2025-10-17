'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MoreVertical from '@/components/icons/more-vertical';
import Bookmark from '@/components/icons/bookmark';
import Share from '@/components/icons/share';
import { Trash2 } from 'lucide-react';

interface VideoCardProps {
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

const VideoCard: React.FC<VideoCardProps> = ({
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
        {/* Video Container */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card">
          {/* Background Image */}
          <div className="absolute inset-0 transition-opacity duration-300 select-none">
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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


        </div>

        {/* Video Info */}
        <div className="mt-3 px-1 flex justify-between gap-3">
          <div className='flex gap-2'>
            <Image src={thumbnail} alt={title} width={48} height={48} className="rounded-full object-cover shrink-0 h-10 w-10" />
            <div>

              <h3 className="btn2 text-white line-clamp-2 group-hover:text-primary-pink transition-colors duration-300">
                {title}
              </h3>
              <p className="text-text-gray footnote line-clamp-1">
                {creator}
              </p>
            </div>
          </div>
          {/* Three Dots Menu */}
          <div className='relative z-50 flex items-center gap-2'>
            {/* Delete Button - Bottom Right */}
            {showDeleteButton && (
              <button
                onClick={handleDelete}
                className="text-red-500 hover:scale-110 z-10"
                title="Delete video"
              >
                <Trash2 className="size-4" />
              </button>
            ) || (
                <>
                  <button
                    onClick={handleMenuToggle}
                    className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white transition-all duration-300 hover:bg-black/70"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute bottom-full right-0 mt-2 w-40 bg-card/95 backdrop-blur-md rounded-lg shadow-xl border border-background-light z-50">
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
                </>
              )}

          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
