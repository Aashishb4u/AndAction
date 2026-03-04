"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import Play from "@/components/icons/play";
import Pause from "@/components/icons/pause";
import Link from "next/link";

const SoundOnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5 9v6h4l5 5V4L9 9H5z" />
    <path d="M16.5 8.5a4.5 4.5 0 010 7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SoundOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 9v6h4l5 5V4L9 9H5z" fill="currentColor" />
    <path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}

// Extract YouTube ID
function extractYouTubeId(url: string) {
  const regExp = /(?:v=|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

const ShortsPlayer: React.FC<ShortsPlayerProps> = ({
  short,
  isActive,
  shouldLoad = true,
  onBookmark,
  onShare,
  soundEnabled,
  setSoundEnabled,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const youtubeId = extractYouTubeId(short.videoUrl);
  const isYouTube = Boolean(youtubeId);

  // Normalize avatar: numeric ids map to /avatars/{id}.png, otherwise use provided URL, fallback to /default.jpg
  const avatarSrc = short.avatar && /^\d+$/.test(String(short.avatar))
    ? `/avatars/${short.avatar}.png`
    : (short.avatar || '/default.jpg');

  /**
   * NATIVE VIDEO: play/pause only (sound handled by `muted` prop)
   */
  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    if (isActive && isVideoLoaded) {
      const t = setTimeout(() => {
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }, 100);

      return () => clearTimeout(t);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isVideoLoaded, isYouTube]);

  /**
   * YOUTUBE IFRAME: control via postMessage
   * - soundEnabled -> mute / unMute
   * - isActive     -> playVideo / pauseVideo
   */
useEffect(() => {
  if (!isYouTube) return;

  const iframe = document.getElementById(
    `yt-${short.id}`,
  ) as HTMLIFrameElement | null;
  if (!iframe || !iframe.contentWindow) return;

  const commands = [
    {
      event: "command",
      func: soundEnabled ? "unMute" : "mute",
      args: [],
    },
    {
      event: "command",
      func: isActive ? "playVideo" : "pauseVideo",
      args: [],
    },
  ];

  commands.forEach((cmd) => {
    iframe.contentWindow?.postMessage(JSON.stringify(cmd), "*");
  });

  setIsPlaying(isActive);
}, [isActive, soundEnabled, isYouTube, short.id]);


useEffect(() => {
  if (!isYouTube) return;

  const iframe = document.getElementById(
    `yt-${short.id}`,
  ) as HTMLIFrameElement | null;

  if (!iframe?.contentWindow) return;

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: isActive ? "playVideo" : "pauseVideo",
      args: [],
    }),
    "*"
  );

  setIsPlaying(isActive);
}, [isActive, isYouTube, short.id]);

useEffect(() => {
  if (!isYouTube) return;

  const iframe = document.getElementById(
    `yt-${short.id}`,
  ) as HTMLIFrameElement | null;

  if (!iframe?.contentWindow) return;

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: soundEnabled ? "unMute" : "mute",
      args: [],
    }),
    "*"
  );
}, [soundEnabled, isYouTube, short.id]);

  /**
   * NATIVE VIDEO PROGRESS
   */
  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (isPlaying && video) {
      progressInterval.current = setInterval(() => {
        if (!video.duration) return;
        setProgress((video.currentTime / video.duration) * 100);
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [isPlaying, isYouTube]);

  const handleVideoClick = () => {
    if (isYouTube) {
      const iframe = document.getElementById(
        `yt-${short.id}`,
      ) as HTMLIFrameElement | null;
      if (!iframe || !iframe.contentWindow) return;

      const cmd = {
        event: "command",
        func: isPlaying ? "pauseVideo" : "playVideo",
        args: [] as unknown[],
      };

      try {
        iframe.contentWindow.postMessage(JSON.stringify(cmd), "*");
        setIsPlaying((prev) => !prev);
      } catch (err) {
        // ignore postMessage errors
      }

      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true));
    }
  };

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    try {
      sessionStorage.setItem("shorts_sound", newState ? "on" : "off");
    } catch {
      // ignore if sessionStorage isn't available
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background thumbnail */}
      <Image
        src={short.thumbnail}
        alt={short.title}
        fill
        className="absolute inset-0 object-cover"
        priority={isActive}
      />

      {/* -------- VIDEO / YOUTUBE -------- */}
      {shouldLoad &&
        (isYouTube ? (
          <iframe
            id={`yt-${short.id}`}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=0&playsinline=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={short.videoUrl}
            loop
            playsInline
            muted={!soundEnabled}
            onLoadedData={() => setIsVideoLoaded(true)}
            onClick={handleVideoClick}
          />
        ))}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Play/Pause overlay */}
      {showControls && !isYouTube && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!isYouTube && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Click overlay for toggling play/pause (captures clicks for both native video and YouTube iframe) */}
      <div
        className="absolute inset-0 z-10"
        onClick={handleVideoClick}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex z-20 pointer-events-none">
        <div className="flex-1 flex flex-col justify-end p-4 pb-4 md:pb-8">
          <Link
            href={`/artists/${short.creatorId}`}
            className="pointer-events-auto"
          >
            <div className="flex items-center space-x-2 mb-4 cursor-pointer">
              <Image
                src={avatarSrc}
                alt={short.creator}
                width={40}
                height={40}
                className="rounded-full"
              />
              
              <div>
                <h3 className="text-white">{short.creator}</h3>
                <p className="text-gray-300">@{short.creatorId}</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-end space-y-4 p-4 pb-4 md:pb-8">
          {/* Sound button (above Share) */}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(short.id);
            }}
            className="p-3 rounded-full bg-black/30 text-white pointer-events-auto"
          >
            <Share className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(short.id);
            }}
            className="p-3 rounded-full bg-black/30 text-white pointer-events-auto"
            aria-label={short.isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className="w-6 h-6" active={short.isBookmarked} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSoundToggle();
            }}
            className="p-3 rounded-full bg-black/30 text-white pointer-events-auto"
            aria-label={soundEnabled ? "Sound on" : "Sound off"}
          >
            {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-3 rounded-full bg-black/30 text-white pointer-events-auto"
          ></button>
        </div>
      </div>
    </div>
  );
};

export default ShortsPlayer;
