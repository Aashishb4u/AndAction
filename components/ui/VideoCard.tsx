"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MoreVertical from "@/components/icons/more-vertical";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import { Trash2 } from "lucide-react";
import { useMobileVideoAutoplay } from "@/hooks/use-mobile-video-autoplay";

interface VideoCardProps {
  id: string;
  title: string;
  creator: string;
  creatorImage?: string;
  thumbnail: string;
  videoUrl: string;
  className?: string;
  artistType?: string;
  enableMobileAutoplay?: boolean; // New prop

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
  artistType,
  thumbnail,
  videoUrl,
  className = "",
  bookmarkId,
  onBookmark,
  onShare,
  onDelete,
  isBookmarked = false,
  showDeleteButton = false,
  enableMobileAutoplay = false, // Default false
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

  // Mobile scroll-based autoplay
  const mobileAutoplayContainerRef = useMobileVideoAutoplay({
    videoRef,
    iframeRef,
    isYouTube,
    enabled: enableMobileAutoplay,
    onPlayStateChange: (isPlaying) => {
      // Update video visibility when mobile autoplay triggers
      setShouldPlayVideo(isPlaying);
    },
  });

  // Debounce hover to play video (desktop)
  useEffect(() => {
    if (isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShouldPlayVideo(true);
        if (isYouTube && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            "*",
          );
        } else if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 500); // 500ms debounce delay
    } else {
      // Clear timeout if hover ends before delay
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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowMenu(false);
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
    <div
      ref={mobileAutoplayContainerRef}
      className={`relative group ${className} ${showMenu ? "z-50" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Player - Interactive area (NOT clickable for navigation) */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden transition-transform duration-300 ease-out hover:scale-105">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />

        {/* YouTube iframe */}
        {isYouTube && youtubeVideoId && (
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${shouldPlayVideo ? "opacity-100" : "opacity-0"}`}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full object-cover"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=0&mute=1&loop=1&playlist=${youtubeVideoId}&controls=1`}
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
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              controls
              preload="metadata"
              onLoadedData={() => setIsVideoLoaded(true)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* BOTTOM INFO - Only this area is clickable for navigation */}
      <div className="mt-3 px-1 flex justify-between items-start gap-3">
        <Link href={`/videos/${id}`} className="flex gap-3 flex-1 min-w-0 items-center group/link">
            <Image
              src={"/avatars/default.jpg"}
              alt={creator}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3
                className="btn2 text-white line-clamp-2 transition-colors duration-300 group-hover/link:text-primary-pink"
                style={{ fontSize: "16px" }}
              >
                {title}
              </h3>
              <p
                className="text-text-gray footnote line-clamp-1"
                style={{ fontSize: "14px" }}
              >
                <span className="align-middle">{creator}</span>
                {artistType ? (
                  <span className="inline-flex items-center ml-2 text-text-gray">
                    <span
                      className="w-2 h-2 bg-text-gray rounded-full inline-block mr-2"
                      aria-hidden="true"
                    />
                    <span className="align-middle">{artistType}</span>
                  </span>
                ) : null}
              </p>
            </div>
          </Link>

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
  );
};

export default VideoCard;
