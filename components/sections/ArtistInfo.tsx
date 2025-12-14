'use client';

import React from 'react';
import Image from 'next/image';
import Bookmark from '@/components/icons/bookmark';
import Share from '@/components/icons/share';
import Link from 'next/link';

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
  className = '',
}) => {
  return (
    <div className={`${className}`}>
      {/* Video Title */}
      <div className="mb-4">
        <h1 className="btn1 text-white mb-2 line-clamp-2">
          {video.title}
        </h1>
      </div>

      {/* Artist Info and Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Artist Details */}
        <Link href={`/artists/${artist.id}`} className="flex-1">
          <div className='flex items-center gap-3'>
            <div className="relative">
              <Image
                src={artist.avatar}
                alt={artist.name}
                width={48}
                height={48}
                unoptimized
                className="rounded-full object-cover lg:w-[60px] lg:h-[60px]"
              />
            </div>

            <div>
              <h2 className="btn2 font-semibold text-white -bottom-2">
                {artist.name}
              </h2>
              <span className="capitalize footnote text-text-gray">{artist.category}</span>
            </div>
          </div>
        </Link>

        <div className='flex items-center gap-2 lg:gap-3'>
          <button
            onClick={onBookmark}
            className={`rounded-full flex items-center gap-3 md:py-2 md:px-5 p-2.5 lg:p-3 border border-border-color bg-card text-white transition-all duration-300 hover:bg-background ${isBookmarked
              ? 'bg-primary-pink text-white' : ''
              }`}
          >
            <Bookmark className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden md:inline">
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </span>
          </button>

          <button
            onClick={onShare}
            className="rounded-full flex items-center gap-3 md:py-2 md:px-5 p-2.5 lg:p-3 border border-border-color bg-card text-white transition-all duration-300 hover:bg-background"
          >
            <Share className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden md:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistInfo;
