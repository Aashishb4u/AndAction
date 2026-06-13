"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import Play from "@/components/icons/play";
import Pause from "@/components/icons/pause";
import Link from "next/link";
import { buildArtishProfileUrl } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/use-navigation-history";

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
  preloadYouTubePlayer?: boolean;
  onBookmark: (id: string) => void;
  onShare: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}

function extractYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = parsed.searchParams.get("v");
      if (watchId && watchId.length === 11) return watchId;

      const parts = parsed.pathname.split("/").filter(Boolean);
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]?.length === 11) {
        return parts[shortsIndex + 1];
      }

      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]?.length === 11) {
        return parts[embedIndex + 1];
      }
    }
    return null;
  } catch {
    const fallback = url.match(
      /(?:v=|youtu\.be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/,
    );
    return fallback ? fallback[1] : null;
  }
}

const ShortsPlayer: React.FC<ShortsPlayerProps> = ({
  short,
  isActive,
  shouldLoad = true,
  onBookmark,
  onShare,
  soundEnabled,
  setSoundEnabled,
  preloadYouTubePlayer = false,
}) => {
  const { setReturnPath } = useNavigationHistory();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [ytReady, setYtReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const nativeUnmuteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ytUnmuteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ytTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ytRetryTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const youtubeId = extractYouTubeId(short.videoUrl);
  const isYouTube = Boolean(youtubeId);
  const effectiveSoundEnabled = isActive ? soundEnabled : false;

  const avatarSrc = buildArtishProfileUrl(short.avatar ?? "");

  const clearYouTubeRetryTimeouts = useCallback(() => {
    ytRetryTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    ytRetryTimeoutsRef.current = [];
  }, []);

  const sendYouTubeCommand = useCallback((func: string) => {
    const iframe = document.getElementById(
      `yt-${short.id}`,
    ) as HTMLIFrameElement | null;

    iframe?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*",
    );
  }, [short.id]);

  const queueYouTubeCommand = useCallback((func: string, delays: number[]) => {
    clearYouTubeRetryTimeouts();
    ytRetryTimeoutsRef.current = delays.map((delay) =>
      setTimeout(() => sendYouTubeCommand(func), delay),
    );
  }, [clearYouTubeRetryTimeouts, sendYouTubeCommand]);

  // Immediately pause/mute when not active OR when component unmounts
  useEffect(() => {
    const pauseAndMuteEverything = () => {
      // Clear ALL timeouts
      if (nativeUnmuteTimeoutRef.current)
        clearTimeout(nativeUnmuteTimeoutRef.current);
      if (ytUnmuteTimeoutRef.current) clearTimeout(ytUnmuteTimeoutRef.current);
      if (ytTimerRef.current) clearTimeout(ytTimerRef.current);
      clearYouTubeRetryTimeouts();

      // Pause native video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.muted = true;
      }
      // Pause/mute YouTube iframe
      if (isYouTube) {
        sendYouTubeCommand("pauseVideo");
        sendYouTubeCommand("mute");
      }
      setIsPlaying(false);
    };

    if (!isActive) {
      pauseAndMuteEverything();
    }

    return () => {
      pauseAndMuteEverything();
    };
  }, [clearYouTubeRetryTimeouts, isActive, isYouTube, sendYouTubeCommand]);

  useEffect(() => {
    setIsVideoLoaded(false);
    setIsPlaying(false);
  }, [short.id]);
  /* ---------------- NATIVE VIDEO CONTROL ---------------- */

  useEffect(() => {
    if (!videoRef.current) return;

    if (shouldLoad) {
      videoRef.current.load(); // 🔥 load only when needed
    }
  }, [shouldLoad]);

  useEffect(() => {
    setYtReady(false);
  }, [isYouTube, youtubeId, shouldLoad]);

  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    // Clear any existing timeout
    if (nativeUnmuteTimeoutRef.current) {
      clearTimeout(nativeUnmuteTimeoutRef.current);
      nativeUnmuteTimeoutRef.current = null;
    }

    if (isActive && shouldLoad && isVideoLoaded) {
      if (video.paused) {
        video.muted = true;
        video
          .play()
          .then(() => {
            nativeUnmuteTimeoutRef.current = setTimeout(() => {
              // Only unmute if still active
              if (isActive) {
                video.muted = !effectiveSoundEnabled;
              }
            }, 50);

            setIsPlaying(true);
          })
          .catch(() => {});
      } else {
        video.muted = !effectiveSoundEnabled;
        setIsPlaying(true);
      }
    } else {
      video.pause();
      video.muted = true;
      setIsPlaying(false);
    }

    return () => {
      if (nativeUnmuteTimeoutRef.current) {
        clearTimeout(nativeUnmuteTimeoutRef.current);
        nativeUnmuteTimeoutRef.current = null;
      }
    };
  }, [effectiveSoundEnabled, isActive, isVideoLoaded, isYouTube, shouldLoad]);
  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    video.muted = !effectiveSoundEnabled;

    console.log("MUTE STATE", {
      video: short.id,
      muted: video.muted,
      effectiveSoundEnabled,
      isActive,
    });
  }, [effectiveSoundEnabled, isActive, isYouTube, short.id]);
  /* ------------- NATIVE VIDEO: sync muted property ------------- */

  useEffect(() => {
    if (isYouTube) return;
    const video = videoRef.current;
    if (video) video.muted = !effectiveSoundEnabled;
  }, [effectiveSoundEnabled, isYouTube]);

  /* ---------------- YOUTUBE CONTROL: play/pause ---------------- */
  useEffect(() => {
    if (!isYouTube) return;
    if (!ytReady) return;

    // Clear all existing YouTube timeouts
    if (ytUnmuteTimeoutRef.current) {
      clearTimeout(ytUnmuteTimeoutRef.current);
      ytUnmuteTimeoutRef.current = null;
    }
    if (ytTimerRef.current) {
      clearTimeout(ytTimerRef.current);
      ytTimerRef.current = null;
    }
    clearYouTubeRetryTimeouts();

    if (isActive) {
      queueYouTubeCommand("playVideo", [0, 250, 750]);

      if (soundEnabled) {
        ytUnmuteTimeoutRef.current = setTimeout(() => {
          // Only unmute if still active
          if (isActive) {
            sendYouTubeCommand("unMute");
          }
        }, 700);
      } else {
        sendYouTubeCommand("mute");
      }
    } else {
      sendYouTubeCommand("pauseVideo");
      sendYouTubeCommand("mute");
    }

    ytTimerRef.current = setTimeout(() => {
      sendYouTubeCommand(isActive ? "playVideo" : "pauseVideo");
    }, 300);

    setIsPlaying(isActive);
    return () => {
      // Clear all timeouts in cleanup
      if (ytUnmuteTimeoutRef.current) {
        clearTimeout(ytUnmuteTimeoutRef.current);
        ytUnmuteTimeoutRef.current = null;
      }
      if (ytTimerRef.current) {
        clearTimeout(ytTimerRef.current);
        ytTimerRef.current = null;
      }
      clearYouTubeRetryTimeouts();
      sendYouTubeCommand("pauseVideo");
      sendYouTubeCommand("mute");
    };
  }, [
    clearYouTubeRetryTimeouts,
    isActive,
    isYouTube,
    queueYouTubeCommand,
    sendYouTubeCommand,
    soundEnabled,
    ytReady,
  ]);

  /* ---------------- YOUTUBE CONTROL: mute/unmute ---------------- */
  /* ---------------- YOUTUBE CONTROL: mute/unmute ---------------- */
  //   useEffect(() => {
  //     if (!isYouTube || !ytReady) return;

  //     const iframe = document.getElementById(
  //       `yt-${short.id}`
  //     ) as HTMLIFrameElement | null;

  //     if (!iframe?.contentWindow) return;

  //     const send = (func: string) => {
  //       iframe.contentWindow?.postMessage(
  //         JSON.stringify({
  //           event: "command",
  //           func,
  //           args: [],
  //         }),
  //         "*"
  //       );
  //     };

  //     if (!isActive) {
  //       send("pauseVideo");
  //       send("mute");
  //       return;
  //     }

  //     send("playVideo");

  //     if (soundEnabled) {
  //       setTimeout(() => {
  //         send("unMute");
  //       }, 800);
  //     } else {
  //       send("mute");
  //     }
  // }, [soundEnabled, ytReady, isActive, isYouTube, short.id]);
  useEffect(() => {
    if (!isYouTube || !ytReady || !isActive) return;

    sendYouTubeCommand(soundEnabled ? "unMute" : "mute");
  }, [isActive, isYouTube, sendYouTubeCommand, soundEnabled, ytReady]);
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

  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;

    console.log("ACTIVE VIDEO", {
      short: short.id,
      active: isActive,
      muted: video?.muted,
      volume: video?.volume,
      currentTime: video?.currentTime,
      paused: video?.paused,
    });
  }, [isActive, isYouTube, short.id]);
  const handleVideoClick = () => {
    if (isYouTube) {
      sendYouTubeCommand(isPlaying ? "pauseVideo" : "playVideo");

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
      sendYouTubeCommand(newState ? "unMute" : "mute");
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

      {isYouTube
        ? (shouldLoad || preloadYouTubePlayer) && (
            <iframe
              id={`yt-${short.id}`}
              className="absolute inset-0 w-full h-full"
              loading={isActive ? "eager" : "lazy"}
              src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&playsinline=1&controls=0&autoplay=${
                isActive ? 1 : 0
              }&mute=1&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}&origin=${
                typeof window !== "undefined" ? window.location.origin : ""
              }&nohistory=1`}
              onLoad={() => {
                setYtReady(true);
                if (isActive) {
                  queueYouTubeCommand("playVideo", [100, 400, 1000]);
                }
              }}
              allow="autoplay; encrypted-media; fullscreen"
            />
          )
        : shouldLoad && (
            <video
              key={short.id}
              ref={videoRef}
              src={short.videoUrl}
              preload={isActive ? "auto" : "metadata"}
              playsInline
              muted={!isActive || !soundEnabled}
              onLoadedData={() => setIsVideoLoaded(true)}
              onCanPlay={() => setIsVideoLoaded(true)}
            />
          )}

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
            onClick={() => setReturnPath()}
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
