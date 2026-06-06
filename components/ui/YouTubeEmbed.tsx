'use client';

import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  title = 'YouTube video player',
  className = '',
  autoplay = false,
  muted = false,
}) => {
  // Construct YouTube embed URL with parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    rel: '0', // Don't show related videos from other channels
    modestbranding: '1', // Reduce YouTube branding
    playsinline: '1', // Play inline on mobile
    enablejsapi: '1', // Enable JavaScript API
  }).toString()}`;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Responsive container with 16:9 aspect ratio */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card shadow-2xl">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default YouTubeEmbed;
