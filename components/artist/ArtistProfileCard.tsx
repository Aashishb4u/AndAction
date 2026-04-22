"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Edit, Pencil, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { Artist } from "@/types";
import { useSession } from "next-auth/react";
import { buildArtishProfileUrl } from '@/lib/utils';
import Cropper, { Area } from "react-easy-crop";

interface ArtistProfileCardProps {
  artist: any;
  onBack?: () => void;
  onEdit?: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.95,
    );
  });
};

const ArtistProfileCard: React.FC<ArtistProfileCardProps> = ({
  artist,
  onBack,
  onEdit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { update } = useSession();
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const onCropComplete = (_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleProfilePhotoUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadMessage("");
      setUploadError("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to upload profile photo.");

      const imageUrl = json.data.imageUrl;

      // update session with new avatar
      await update({
        update: {
          avatar: imageUrl,
        },
      });

      setUploadMessage(json?.message || "Profile photo uploaded successfully.");

      setUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload profile photo. Please try again.",
      );
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropModal(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) return;

      const croppedFile = new File([croppedBlob], "cropped-profile.jpg", {
        type: "image/jpeg",
      });

      setShowCropModal(false);
      setImageToCrop(null);

      await handleProfilePhotoUpload(croppedFile);
    } catch (error) {
      console.error("Crop failed:", error);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /** -------------------------
   *  Edit Button → Trigger file input
   * ------------------------- **/
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const categoryParts = artist.category
    ? artist.category.split(",").map((s: string) => s.trim())
    : [];
  const categoryTags = Array.from(new Set(categoryParts.filter(Boolean)));
  const hasLongCategory =
    categoryTags.some((tag) => tag.length > 16) ||
    (artist.category?.length ?? 0) > 18;

  return (
    <div className="relative md:rounded-2xl overflow-hidden h-[85vh] lg:h-[500px]">
      {/* hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Full Background Image */}
      <div className="absolute inset-0">
        <Image
          src={buildArtishProfileUrl(artist.image || '')}
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
          <div className="flex flex-col items-start gap-3">
            {uploadMessage && (
              <p className="text-green-400 text-sm">{uploadMessage}</p>
            )}
            {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
            <h2 className="t1-heading text-white mb-2 drop-shadow-lg">{artist.name}</h2>

            <div className="flex w-full flex-wrap items-center gap-3">
              <div
                className={`flex min-w-0 flex-wrap items-center justify-start gap-2 ${
                  hasLongCategory ? "w-full flex-none" : "flex-1"
                }`}
              >
                {categoryTags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-4 md:py-2 py-1.5 rounded-full btn2 backdrop-blur-sm ${
                      tag === (artist.category || "")
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
                className="shrink-0 self-start rounded-full px-3 py-1.5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-card border border-border-color rounded-xl w-[90vw] max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-color">
              <h3 className="text-white font-semibold">Crop Image</h3>
              <button
                onClick={handleCropCancel}
                className="text-text-gray hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="relative h-[360px] bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-4 border-t border-border-color">
              <label className="block text-text-gray text-sm mb-2">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-[#2D2D2D] rounded-lg appearance-none cursor-pointer accent-primary-pink"
              />
            </div>

            <div className="flex gap-3 p-4 border-t border-border-color">
              <Button
                variant="secondary"
                size="md"
                onClick={handleCropCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCropSave}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistProfileCard;
