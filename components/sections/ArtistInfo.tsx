"use client";

import React from "react";
import Image from "next/image";
import Bookmark from "@/components/icons/bookmark";
import Share from "@/components/icons/share";
import Link from "next/link";
import { buildArtishProfileUrl } from "@/lib/utils";

interface ArtistInfoProps {
  artist: {
    id: string;
    name: string;
    location: string;
    avatar: string;
    bio?: string;
    category: string;
    followers?: number;
    verified?: boolean;
  };
  video: {
    id: string;
    title: string;
    description?: string;
    views?: number;
    uploadDate?: string;
  };
  isBookmarked?: boolean;
  bookmarkId?: string;
  onBookmark?: () => void;
  onShare?: () => void;
  className?: string;
}

const ArtistInfo: React.FC<ArtistInfoProps> = ({
  artist,
  video,
  isBookmarked = false,
  onBookmark,
  onShare,
  className = "",
}) => {
  return (
    <div className={`${className}`}>
      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-6">
        {/* Left Side: Avatar + Title + Artist Name */}
        <div className="flex gap-2 sm:gap-3 flex-1 min-w-0">
          <Link href={`/artists/${artist.id}`} className="shrink-0">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={buildArtishProfileUrl(artist.avatar)}
                alt={artist.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </Link>

          <div className="flex flex-col min-w-0">
            <h1 className="btn2 text-white line-clamp-2">{video.title}</h1>
            <div className="flex items-center gap-2">
              <Link href={`/artists/${artist.id}`}>
                <span className="footnote text-text-gray hover:text-white transition-colors">
                  {artist.name}
                </span>
              </Link>
            </div>
            {video.description && (
              <p className="footnote text-text-gray mt-2 line-clamp-3">
                {video.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          <button
            onClick={onBookmark}
            className={`rounded-full flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border border-border-color bg-background-light text-white transition-all duration-300 hover:bg-background ${
              isBookmarked ? "text-primary-pink" : ""
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
          >
            <Bookmark
              className={`w-5 h-5 sm:w-6 sm:h-6 ${isBookmarked ? "fill-current" : ""}`}
            />
          </button>

          <button
            onClick={onShare}
            className="rounded-full flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border border-border-color bg-background-light text-white transition-all duration-300 hover:bg-background"
            title="Share"
          >
            <Share className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistInfo;
