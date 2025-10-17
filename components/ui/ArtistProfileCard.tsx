"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Artist } from "@/types";
import Bookmark from "../icons/bookmark";

interface ArtistProfileCardProps {
  artist: Artist;
  onBookmark: (artistId: string) => void;
  layout?: "grid" | "list";
  className?: string;
}

const ArtistProfileCard: React.FC<ArtistProfileCardProps> = ({
  artist,
  onBookmark,
  layout = "grid",
  className = "",
}) => {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return `₹ ${price.toLocaleString()}`;
  };

  const handleClick = () => {
    router.push(`/artists/${artist.id}`);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark(artist.id);
  };

  if (layout === "list") {
    // Mobile list layout
    return (
      <div
        className={`md:bg-card relative rounded-2xl overflow-hidden hover:bg-gray-800/50 transition-all duration-300 cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <div className="flex p-4 gap-4">
          {/* Artist Image */}
          <div className="relative w-28 h-36 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={artist.image}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="120px"
            />
          </div>

          {/* Artist Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between relative">
              <h3 className="btn1 text-white truncate pr-2">
                {artist.name}
              </h3>
              <button
                onClick={handleBookmarkClick}
                className="p-2 hover:bg-gray-700 rounded-full bg-card border border-border-color transition-colors flex-shrink-0 absolute top-0 right-0"
              >
                <Bookmark
                  className="w-5 h-5"
                  active={artist.isBookmarked}
                />
              </button>
            </div>

            <p className="secondary-text text-text-gray mb-3">
              {artist.category} | {artist.location}
            </p>

            <div className="flex items-center gap-1.5 mb-1 secondary-text text-text-gray">
              <Image src="/icons/time.svg" alt="Time" width={16} height={16} />
              <span>{artist.duration}</span>
            </div>

            <div className="flex items-center gap-1.5 mb-1 secondary-text text-text-gray">

              <Image src="/icons/ruppe.svg" alt="Ruppe" width={16} height={16} />

              <span>
                Starting price - {formatPrice(artist.startingPrice)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1 secondary-text text-text-gray">
              <Image src="/icons/language.svg" alt="Language" width={16} height={16} />

              <span>
                {artist.languages.join(", ")}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>
    );
  }

  // Desktop grid layout
  return (
    <div
      className={`relative rounded-2xl overflow-hidden artist-card-hover artist-card-animate group cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {/* Artist Image - Full Background */}
      <div className="relative aspect-[6/8] overflow-hidden">
        <Image
          src={artist.image}
          alt={artist.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Bookmark Button */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm bookmark-btn z-10"
        >
          <Bookmark
            className="w-5 h-5"
            active={artist.isBookmarked}
          />
        </button>

        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

        {/* Artist Info - Positioned at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="h3 text-white group-hover:text-primary-pink transition-colors duration-300">
            {artist.name}
          </h3>

          <p className="secondary-text mb-2">
            {artist.category} | {artist.location}
          </p>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <svg
                className="size-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="secondary-text">{artist.duration}</span>
            </div>

            <div className="flex items-center gap-2">
              <svg
                className="size-4 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M6 4H10.5M10.5 4C12.9853 4 15 6.01472 15 8.5C15 10.9853 12.9853 13 10.5 13H6L13 20M10.5 4H18M6 8.5H18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>{" "}
                </g>
              </svg>
              <span className="secondary-text">
                Starting price - {formatPrice(artist.startingPrice)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Image src="/icons/language.svg" alt="Language" width={16} height={16} className="brightness-0 invert" />
              <span className="secondary-text line-clamp-1">
                {artist.languages.join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileCard;
