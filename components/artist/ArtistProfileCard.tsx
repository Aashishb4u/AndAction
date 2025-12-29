'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Artist } from '@/types';
import { useSession } from "next-auth/react";

interface ArtistProfileCardProps {
  artist: any;
  onBack?: () => void;
  onEdit?: () => void;
}

const ArtistProfileCard: React.FC<ArtistProfileCardProps> = ({
  artist,
  onBack,
  onEdit
}) => {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { update } = useSession();
  const [uploading, setUploading] = useState(false);

  const handleProfilePhotoUpload = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const imageUrl = json.data.imageUrl;

      // update session with new avatar
      await update({
        update: {
          avatar: imageUrl
        }
      });

      setUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
    }
  };

  /** -------------------------
   *  Edit Button → Trigger file input
   * ------------------------- **/
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative md:rounded-2xl overflow-hidden h-[85vh] lg:h-[500px]">
      {/* hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleProfilePhotoUpload(e.target.files[0]);
          }
        }}
      />

      {/* Full Background Image */}
      <div className="absolute inset-0">
        <Image
          src={
            artist.image && /^\d+$/.test(String(artist.image))
              ? `/avatars/${artist.image}.png`
              : artist.image || "/default-avatar.png"
          }
          alt={artist.name}
          fill
          unoptimized
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={triggerFilePicker}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70"
          >
            {uploading ? "..." : <Edit size={20} />}
          </button>
        </div>

        <div className="flex-1" />

        {/* Artist Info (unchanged UI) */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="t1 text-white mb-2 drop-shadow-lg">{artist.name}</h2>

            <div className="flex justify-between gap-4 flex-col">
              <div className="flex flex-wrap gap-2">
                {[artist.category, artist.subCategory]
                  .filter((tag): tag is string => Boolean(tag))
                  .map((tag, index) => (
                    <span
                      key={index}
                      className={`px-4 md:py-2 py-1.5 rounded-full btn2 backdrop-blur-sm ${
                        tag === artist.category
                          ? "bg-white text-primary-pink"
                          : "bg-card border border-border-color text-white"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              <Button
                variant="primary"
                size="sm"
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
