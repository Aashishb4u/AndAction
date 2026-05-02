"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import Play from "@/components/icons/play";
import Pause from "@/components/icons/pause";
import Link from "next/link";
import { buildArtishProfileUrl } from "@/lib/utils";

const SoundOnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 9v6h4l5 5V4L9 9H5z" />
    <path
      d="M16.5 8.5a4.5 4.5 0 010 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const SoundOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M5 9v6h4l5 5V4L9 9H5z" fill="currentColor" />
    <path d="M19 5L5 19" stroke="currentColor" strokeWidth="2" />
  </svg>
);

interface Short {
  id: string;
  title: string;
  creator: string;
  creatorId: string;
  category: string;
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

  const avatarSrc = buildArtishProfileUrl(short.avatar ?? "");

  /* ---------------- NATIVE VIDEO CONTROL ---------------- */

  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    if (isActive && isVideoLoaded) {
      video.muted = !soundEnabled;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, isVideoLoaded, isYouTube]);

  /* ------------- NATIVE VIDEO: sync muted property ------------- */

  useEffect(() => {
    if (isYouTube) return;
    const video = videoRef.current;
    if (video) video.muted = !soundEnabled;
  }, [soundEnabled, isYouTube]);

  /* ---------------- YOUTUBE CONTROL: play/pause ---------------- */
  useEffect(() => {
    if (!isYouTube) return;

    const iframe = document.getElementById(
      `yt-${short.id}`
    ) as HTMLIFrameElement | null;
    if (!iframe?.contentWindow) return;

    const sendCommand = (func: string) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*"
      );
    };

    // Send immediately and again after a delay to catch late-loading iframes
    if (isActive) {
      sendCommand("playVideo");
    } else {
      sendCommand("pauseVideo");
      sendCommand("mute");
    }

    const timer = setTimeout(() => {
      if (isActive) {
        sendCommand("playVideo");
        sendCommand(soundEnabled ? "unMute" : "mute");
      } else {
        sendCommand("pauseVideo");
        sendCommand("mute");
      }
    }, 300);

    setIsPlaying(isActive);
    return () => clearTimeout(timer);
  }, [isActive, isYouTube, short.id]);

  /* ---------------- YOUTUBE CONTROL: mute/unmute ---------------- */
  useEffect(() => {
    if (!isYouTube) return;

    const iframe = document.getElementById(
      `yt-${short.id}`
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

  /* ---------------- PROGRESS BAR ---------------- */

  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;

    if (isPlaying && video) {
      progressInterval.current = setInterval(() => {
        if (!video.duration) return;
        setProgress((video.currentTime / video.duration) * 100);
      }, 100);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, isYouTube]);

  /* ---------------- CLICK PLAY / PAUSE ---------------- */

  const handleVideoClick = () => {
    if (isYouTube) {
      const iframe = document.getElementById(
        `yt-${short.id}`
      ) as HTMLIFrameElement | null;

      if (!iframe?.contentWindow) return;

      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isPlaying ? "pauseVideo" : "playVideo",
          args: [],
        }),
        "*"
      );

      setIsPlaying(!isPlaying);
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

    if (isYouTube) {
      const iframe = document.getElementById(
        `yt-${short.id}`
      ) as HTMLIFrameElement | null;

      iframe?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: newState ? "unMute" : "mute",
          args: [],
        }),
        "*"
      );
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">

      <Image
        src={short.thumbnail}
        alt={short.title}
        fill
        className="absolute inset-0 object-cover"
      />

      {shouldLoad &&
        (isYouTube ? (
<iframe
  id={`yt-${short.id}`}
  className="absolute inset-0 w-full h-full pointer-events-none"
  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&playsinline=1&controls=0&autoplay=${isActive ? 1 : 0}&mute=${isActive && soundEnabled ? 0 : 1}&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}&origin=${
    typeof window !== "undefined" ? window.location.origin : ""
  }`}
  allow="autoplay; encrypted-media"
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
          />
        ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {showControls && !isYouTube && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-black/50 rounded-full p-4">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white" />
            )}
          </div>
        </div>
      )}

      {!isYouTube && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div
        className="absolute inset-0 z-10"
        onClick={handleVideoClick}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      <div className="absolute inset-0 flex z-20 pointer-events-none">

        <div className="flex-1 flex flex-col justify-end p-4 pb-8">
          <Link
            href={`/artists/${short.creatorId}`}
            className="pointer-events-auto"
            data-shorts-interactive="true"
          >
            <div className="flex items-center gap-3 mb-4 cursor-pointer">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Image
                  src={avatarSrc}
                  alt={short.creator}
                  width={40}
                  height={40}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold leading-tight line-clamp-1">
                  {short.creator}
                </div>
                {short.title ? (
                  <div className="text-white/80 text-sm leading-snug line-clamp-1">
                    {short.title}
                  </div>
                ) : null}
                {short.category ? (
                  <div className="text-white/70 text-xs leading-snug line-clamp-1">
                    {short.category}
                  </div>
                ) : null}
              </div>
            </div>
          </Link>
        </div>

        <div
          className="absolute right-4 bottom-16 z-30 flex flex-col items-center space-y-4 pointer-events-auto"
          data-shorts-interactive="true"
        >

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(short.id);
            }}
            className="p-3 rounded-full bg-black/30 text-white"
          >
            <Share className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(short.id);
            }}
            className="p-3 rounded-full bg-black/30 text-white"
          >
            <Bookmark className="w-6 h-6" active={short.isBookmarked} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSoundToggle();
            }}
            className="p-3 rounded-full bg-black/30 text-white"
          >
            {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>

        </div>
      </div>
    </div>
  );
};

export default ShortsPlayer;
