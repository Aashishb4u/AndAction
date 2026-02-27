"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MoreVertical from "@/components/icons/more-vertical";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import { Trash2 } from "lucide-react";

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

const ShortsCard: React.FC<ShortsCardProps> = ({
  id,
  title,
  creator,
  thumbnail,
  videoUrl,
  className = "",
  bookmarkId, // ⭐ NEW
  onBookmark,
  onShare,
  onDelete,
  isBookmarked = false,
  showDeleteButton = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to check if URL is YouTube
  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );
    return match ? match[1] : null;
  };

  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null;

  useEffect(() => {
    if (isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShouldPlayVideo(true);
        if (isYouTube && iframeRef.current) {
          // Play YouTube video via postMessage
          iframeRef.current.contentWindow?.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            "*",
          );
        } else if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 500);
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setShouldPlayVideo(false);

      // Stop YouTube video
      if (isYouTube && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*",
        );
      }

      // Stop MP4 video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovered, isYouTube]);

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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowMenu(false);
  };

  return (
    <Link href={`/shorts/${id}`} className="block">
      <div
        className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-card">
          <Image
            src={thumbnail}
            alt={`${title} ${creator}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* YouTube iframe */}
          {isYouTube && youtubeVideoId && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${shouldPlayVideo ? "opacity-100" : "opacity-0"}`}
            >
              <iframe
                ref={iframeRef}
                className="w-full h-full object-cover"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=0&mute=1&loop=1&playlist=${youtubeVideoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsVideoLoaded(true)}
              />
            </div>
          )}

          {/* MP4 video */}
          {!isYouTube && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${shouldPlayVideo && isVideoLoaded ? "opacity-100" : "opacity-0"}`}
            >
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
          )}

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
