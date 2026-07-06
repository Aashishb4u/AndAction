"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { buildArtishProfileUrl } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import ArtistCardSkeleton from "@/components/ui/ArtistCardSkeleton";

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
  className = "",
}) => {
  const router = useRouter();
  const { setReturnPath, setReturnTarget } = useNavigationHistory();
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    setIsImageLoading(true);
  }, [thumbnail]);

  const handleClick = () => {
    if (typeof window !== "undefined") {
      setReturnPath(window.location.pathname + window.location.search);
      setReturnTarget(id);
    }
    router.push(`/artists/${id}`);
  };

  return (
    <div
      key={id}
      id={`artist-card-${id}`}
      data-artist-id={id}
      className={`relative flex-shrink-0  w-[150px] h-[237px] md:w-[190px] md:h-[300px] rounded-lg overflow-hidden cursor-pointer bg-text-light-gray/10 transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-primary-pink/20 ${className}`}
      onClick={handleClick}
    >
      {isImageLoading && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <ArtistCardSkeleton />
        </div>
      )}

      {/* Background Image */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 select-none ${
          isImageLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src={buildArtishProfileUrl(thumbnail)}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-110"
          sizes="230px"
          priority={false}
          unoptimized
          onLoad={() => setIsImageLoading(false)}
          onError={() => setIsImageLoading(false)}
        />
      </div>

      {/* Video Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          /*isHovered && isVideoLoaded ? 'opacity-100' : */ "opacity-0"
        }`}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 hover:from-black/60" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform transition-transform duration-300 select-none">
        <h3
          className={`font-semibold signup line-clamp-1 transition-colors duration-300 ${isHovered ? "text-primary-pink" : "text-white"}`}
        >
          {name}
        </h3>
        <p
          className={`footnote line-clamp-1 transition-colors duration-300 text-white`}
        >
          {location}
        </p>
      </div>

      {/* Hover Border Effect */}
      <div
        className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${isHovered ? "border-primary-pink/50 shadow-[0_0_20px_rgba(232,4,126,0.3)]" : "border-transparent"}`}
      />
    </div>
  );
};

export default ArtistCard;
