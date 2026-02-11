'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Share2, X, Copy, MessageCircle, Facebook, Twitter, Mail, Linkedin } from 'lucide-react';
import { toast } from 'react-toastify';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  poster?: string;
  videoId?: string;
}

/* ---------------------------
   YOUTUBE HELPERS
---------------------------- */

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeId(url: string) {
  const regex = /(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : "";
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title = 'Video player',
  className = '',
  autoplay = false,
  muted = false,
  poster,
  videoId,
}) => {

  const isYT = isYouTube(videoUrl);
  const ytId = isYT ? getYouTubeId(videoUrl) : null;

  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  /* -------------------------------------------------
     ONLY ATTACH EVENTS FOR MP4 — NOT FOR YOUTUBE
  --------------------------------------------------- */
  useEffect(() => {
    if (isYT) return; // YT iframe does not use HTML5 video events

    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [isYT]);

  /* ---------------------------
      MP4 Controls Only
  ---------------------------- */
  const togglePlay = () => {
    if (isYT) return; // YouTube has its own controls

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) video.pause();
    else video.play();

    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (isYT) return; // YT has internal mute

    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isYT) return;

    const video = videoRef.current;
    if (!video) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isYT) return;

    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value) / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const container = document.documentElement;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Share functionality
  const getShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return videoId ? `${baseUrl}/videos/${videoId}` : (typeof window !== 'undefined' ? window.location.href : '');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast.success('Link copied to clipboard');
      setShareModalOpen(false);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${title} - ${getShareUrl()}`)}`;
        window.open(url, '_blank');
        setShareModalOpen(false);
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
        setShareModalOpen(false);
      },
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
        setShareModalOpen(false);
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
        setShareModalOpen(false);
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        const url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this video: ${getShareUrl()}`)}`;
        window.location.href = url;
        setShareModalOpen(false);
      },
    },
  ];

  return (
    <div className={`relative w-full group ${className}`}>
      <div className="relative w-full aspect-video md:rounded-xl overflow-hidden bg-black shadow-lg">

        {/* -------------------------------------
            YOUTUBE PLAYER (iframe)
        ------------------------------------- */}
        {isYT ? (
          <iframe
            className="w-full h-full object-cover"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* ------------------------------
             MP4 PLAYER (Custom Controls)
          ------------------------------- */
          <video
            ref={videoRef}
            src={videoUrl}
            poster={poster}
            className="w-full h-full object-cover"
            autoPlay={autoplay}
            muted={muted}
            playsInline
            onClick={togglePlay}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          />
        )}

        {/* -------------------------------------
            MP4 Play Button Overlay
        ------------------------------------- */}
        {!isYT && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300"
            >
              <Play className="w-8 h-8 text-white ml-1" />
            </button>
          </div>
        )}

        {/* -------------------------------------
            CUSTOM CONTROLS — MP4 ONLY
        ------------------------------------- */}
        {!isYT && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 lg:p-4 transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Progress Bar */}
            <div className="mb-2 lg:mb-3">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>

                {/* Volume */}
                <button onClick={toggleMute} className="text-white hover:text-primary-pink">
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded-lg cursor-pointer"
                />

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <button onClick={toggleFullscreen} className="text-white hover:text-primary-pink">
                <Maximize className="w-6 h-6" />
              </button>

              <button onClick={() => setShareModalOpen(true)} className="text-white hover:text-primary-pink">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SLIDER STYLE */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #E8047E;
          cursor: pointer;
        }
      `}</style>

      {/* Share Modal */}
      {shareModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Share Video</h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Video Title */}
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{title}</p>

            {/* Share Options Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl ${option.color} transition-all transform hover:scale-105`}
                >
                  <option.icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium">{option.name}</span>
                </button>
              ))}
            </div>

            {/* Copy Link Section */}
            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-transparent text-gray-300 text-sm outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-primary-pink hover:bg-primary-pink/80 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
