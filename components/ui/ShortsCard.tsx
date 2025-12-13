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

  // ⭐ NEW
  bookmarkId?: string | null;

  // NEW object format
  onBookmark?: (data: { id: string; bookmarkId?: string | null; isBookmarked: boolean }) => void;

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
  bookmarkId,        // ⭐ NEW
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

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onBookmark?.({ id, bookmarkId, isBookmarked }); // ⭐ UPDATED
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
        className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
        onMouseEnter={() => {
          setIsHovered(true);
          videoRef.current?.play().catch(() => {});
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowMenu(false);
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      >

        <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-card">
          <Image
            src={thumbnail}
            alt={`${title} ${creator}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered && isVideoLoaded ? "opacity-100" : "opacity-0"}`}>
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
              onLoadedData={() => setIsVideoLoaded(true)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>

          {/* Delete Button */}
          {showDeleteButton && (
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 p-2 bg-card rounded-full text-red-500 hover:scale-110 z-10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Menu */}
          {!showDeleteButton && (
            <div className="absolute top-3 right-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowMenu(!showMenu);
                }}
                className="p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-card/95 rounded-lg shadow-xl border border-background-light z-10">
                  <button
                    onClick={handleBookmark}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-card ${
                      isBookmarked ? "text-primary-pink" : "text-white"
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-card"
                  >
                    <Share className="w-4 h-4" />
                    Share
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </Link>
  );
};

export default ShortsCard;
