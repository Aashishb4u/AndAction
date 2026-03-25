"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MoreVertical from "@/components/icons/more-vertical";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import { Trash2 } from "lucide-react";
import { useMobileVideoAutoplay } from "@/hooks/use-mobile-video-autoplay";
import Volume2 from "@/components/icons/volume-2";
import VolumeX from "@/components/icons/volume-x";

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
  artistId?: string; // For profile navigation

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
  artistId,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Tracks approximate current time for YouTube (updated every second while playing)
  const ytCurrentTimeRef = useRef(0);
  const ytTickerRef = useRef<NodeJS.Timeout | null>(null);

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
      setIsMuted(true);
      // Reset YouTube time tracker
      if (ytTickerRef.current) clearInterval(ytTickerRef.current);
      ytCurrentTimeRef.current = 0;

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

  useEffect(() => {
    if (!shouldPlayVideo || !isVideoLoaded) return;
    setTimeout(()=>{
    if (isYouTube && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        "*",
      );
      // Start ticking to track approximate YouTube current time
      ytCurrentTimeRef.current = 0;
      if (ytTickerRef.current) clearInterval(ytTickerRef.current);
      ytTickerRef.current = setInterval(() => {
        ytCurrentTimeRef.current += 1;
      }, 1000);
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  },200);
  }, [isVideoLoaded, shouldPlayVideo, isYouTube]);

  useEffect(() => {
    if (!shouldPlayVideo) return;
    if (isYouTube && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"${isMuted ? 'mute' : 'unMute'}","args":""}`,
        "*",
      );
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isYouTube, shouldPlayVideo]);

  const handleSeek = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (isYouTube && iframeRef.current) {
      const target = Math.max(0, ytCurrentTimeRef.current + delta);
      ytCurrentTimeRef.current = target;
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"seekTo","args":[${target}, true]}`,
        "*",
      );
    } else if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime + delta,
      );
    }
  };

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
      {/* overflow-hidden clips any scale/transform overflow */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
        {/* Thumbnail image - hidden once video starts playing */}
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-opacity duration-500 ${shouldPlayVideo ? "opacity-0" : "opacity-100"}`}
        />

        {/* Video overlay wrapper - sits exactly over thumbnail */}
        <div className="absolute inset-0 overflow-hidden">

        {/* YouTube iframe */}
        {isYouTube && youtubeVideoId && (
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${shouldPlayVideo ? "opacity-100" : "opacity-0"}`}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full object-cover"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=0&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0`}
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
              preload="metadata"
              onLoadedData={() => setIsVideoLoaded(true)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        )}

        {/* Transparent navigation overlay - sits above iframe/video but below mute button */}
        <Link href={`/videos/${id}`} className="absolute inset-0 z-10" aria-label={title} />

        {/* Mute / Unmute button */}
        {shouldPlayVideo && (
          <>
            {/* Back 10s — center left */}
            <button
              onClick={(e) => handleSeek(e, -10)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="12" y="16" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="sans-serif">10</text>
              </svg>
            </button>

            {/* Forward 10s — center right */}
            <button
              onClick={(e) => handleSeek(e, 10)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                <text x="12" y="16" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="sans-serif">10</text>
              </svg>
            </button>

            {/* Mute toggle — bottom right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsMuted((m) => !m);
              }}
              className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </>
        )}
        </div>{/* end scale overlay */}
      </div>{/* end clip wrapper */}

      {/* BOTTOM INFO - Only this area is clickable for navigation */}
      <div className="mt-3 px-1 flex justify-between items-start gap-3">
        <Link href={artistId ? `/artists/${artistId}?tab=about` : `/videos/${id}`} className="flex gap-3 flex-1 min-w-0 items-center group/link">
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
