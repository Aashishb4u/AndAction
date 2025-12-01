'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ArtistCardProps {
  id: string;
  name: string;
  location: string;
  thumbnail: string;
  videoUrl: string;
  className?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({
  id,
  name,
  location,
  thumbnail,
  videoUrl,
  className = '',
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle play error silently
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleClick = () => {
    router.push(`/artists/${id}`);
  };

  return (
    <div
      key={id}
      className={`relative flex-shrink-0 w-[150px] h-[225px] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-primary-pink/20 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0 transition-opacity duration-300 select-none">
        <Image
          src={thumbnail}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-110"
          sizes="230px"
          priority={false}
          unoptimized
        />
      </div>

      {/* Video Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${isHovered && isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={handleVideoLoad}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 hover:from-black/60" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform transition-transform duration-300 select-none">
        <h3 className={`font-semibold btn2 line-clamp-1 transition-colors duration-300 ${isHovered ? 'text-primary-pink' : 'text-white'}`}>
          {name}
        </h3>
        <p className={`footnote line-clamp-1 transition-colors duration-300 text-white`}>
          {location}
        </p>
      </div>

      {/* Hover Border Effect */}
      <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${isHovered ? 'border-primary-pink/50 shadow-[0_0_20px_rgba(232,4,126,0.3)]' : 'border-transparent'}`} />
    </div>
  );
};

export default ArtistCard;
