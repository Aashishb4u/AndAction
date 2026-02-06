"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import MoreVertical from "@/components/icons/more-vertical";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import { Trash2 } from "lucide-react";

interface VideoCardProps {
  id: string;
  title: string;
  creator: string;
  creatorImage?: string;
  thumbnail: string;
  videoUrl: string;
  className?: string;

  // ⭐ NEW: bookmarkId passed from API so UI knows what to delete
  bookmarkId?: string | null;

  // UPDATED: pass full object instead of just ID
  onBookmark?: (data: {
    id: string;
    bookmarkId?: string | null;
    isBookmarked: boolean;
  }) => void;
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
  className = "",
  bookmarkId,
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
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowMenu(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onBookmark?.({ id, bookmarkId, isBookmarked });
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
    <Link
      href={`/videos/${id}`}
      className={`block ${showMenu ? "z-50 relative" : ""}`}
    >
      <div
        className={`relative group cursor-pointer ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card transition-transform duration-300 ease-out hover:scale-105 card-border-gradient ">
          <Image src={thumbnail} alt={title} fill className="object-cover" />

          <div
            className={`absolute inset-0 transition-opacity duration-500 ${isHovered && isVideoLoaded ? "opacity-100" : "opacity-0"}`}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={() => setIsVideoLoaded(true)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300" />
        </div>

        {/* BOTTOM INFO */}
        <div className="mt-3 px-1 flex justify-between items-start gap-3">
          <div className="flex gap-3 flex-1 min-w-0 items-center">
            <Image
              src={"/avatars/default-avatar.jpeg"}
              alt={creator}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="btn2 text-white line-clamp-2 group-hover:text-primary-pink transition-colors duration-300">
                {title}
              </h3>
              <p className="text-text-gray footnote line-clamp-1">{creator}</p>
            </div>
          </div>

          {/* MENU */}
          <div className="relative flex items-start shrink-0">
            {showDeleteButton ? (
              <button
                onClick={handleDelete}
                className="text-red-500 hover:scale-110 p-2"
              >
                <Trash2 className="size-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleMenuToggle}
                  className="p-1 text-white hover:text-primary-pink transition-colors"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>

                {showMenu && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-card/95 backdrop-blur-sm rounded-lg shadow-xl border border-background-light z-50">
                    <button
                      onClick={handleBookmark}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-background/50 transition-colors ${
                        isBookmarked ? "text-primary-pink" : "text-white"
                      }`}
                    >
                      <Bookmark className="w-6 h-6" />
                      {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                    </button>

                    <button
                      onClick={handleShare}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-background/50 transition-colors"
                    >
                      <Share className="w-6 h-6" />
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
