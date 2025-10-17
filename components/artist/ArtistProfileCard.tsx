'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Artist } from '@/types';

interface ArtistProfileCardProps {
  artist: Artist;
  onBack?: () => void;
  onEdit?: () => void;
}

const ArtistProfileCard: React.FC<ArtistProfileCardProps> = ({
  artist,
  onBack,
  onEdit
}) => {
  return (
    <div className="relative md:rounded-2xl overflow-hidden h-[85vh] lg:h-[500px]">
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <Image
          src={artist.image}
          alt={artist.name}
          fill
          className="object-cover"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header with Back and Edit buttons */}
        <div className="flex justify-between items-center p-6">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={onEdit}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200"
          >
            <Edit size={20} />
          </button>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Artist Info at Bottom */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="t1 text-white mb-2 drop-shadow-lg">{artist.name}</h2>

            <div className='flex justify-between gap-4 flex-col'>
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {[artist.category, artist.subCategory].filter((tag): tag is string => Boolean(tag)).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className={`px-4 md:py-2 py-1.5 rounded-full btn2 transition-all duration-200 backdrop-blur-sm ${tag === artist.category
                      ? 'bg-white text-primary-pink hover:bg-white/80'
                      : 'bg-card border border-border-color text-white hover:bg-background'
                      }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {/* Add Profile Button */}
              <Button
                variant="primary"
                size='sm'
                onClick={onEdit}
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                 Add Profile
              </Button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default ArtistProfileCard;
