"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { ArtistProfileSetupData } from "@/types";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { useArtistCategories } from "@/hooks/use-artist-categories";

interface ArtistProfileDetailsProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<ArtistProfileSetupData>) => void;
}

// Helper function to create cropped image
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

const ArtistProfileDetails: React.FC<ArtistProfileDetailsProps> = ({
  data,
  onNext,
  onSkip,
  onBack,
  onUpdateData,
}) => {
  const { categories: artistTypes } = useArtistCategories();

  const [formData, setFormData] = useState({
    profilePhoto: data.profilePhoto || null,
    avatarUrl: (data as any).avatarUrl || "",
    stageName: data.stageName || "",
    artistType: data.artistType || "",
    subArtistType: data.subArtistType || "",
    achievements: data.achievements || "",
    yearsOfExperience: data.yearsOfExperience || "",
    shortBio: data.shortBio || "",
  });

  const [preview, setPreview] = useState<string | null>(
    formData.profilePhoto
      ? URL.createObjectURL(formData.profilePhoto)
      : formData.avatarUrl || null,
  );

  const [uploading, setUploading] = useState<boolean>(false);

  // Multi-select tags for sub-artist types (UI). Backend expects comma-separated string.
  const initialSubTypes = (() => {
    const raw = data.subArtistType || formData.subArtistType || "";
    if (!raw) return [] as string[];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  })();

  const [selectedSubTypes, setSelectedSubTypes] =
    useState<string[]>(initialSubTypes);
  const [subTypeInput, setSubTypeInput] = useState<string>("");

  // Cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-artist suggestions (persisted in localStorage)
  const defaultSubTypes = [
    "Classical",
    "Contemporary",
    "Folk",
    "Bollywood",
    "Western",
    "Fusion",
  ];
  const [subArtistSuggestions, setSubArtistSuggestions] =
    useState<string[]>(defaultSubTypes);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const subArtistTypes = [
    { value: "classical", label: "Classical" },
    { value: "contemporary", label: "Contemporary" },
    { value: "folk", label: "Folk" },
    { value: "bollywood", label: "Bollywood" },
    { value: "western", label: "Western" },
    { value: "fusion", label: "Fusion" },
  ];

  const experienceYears = [
    { value: "1", label: "0-1 years" },
    { value: "2", label: "1-3 years" },
    { value: "3", label: "3-5 years" },
    { value: "4", label: "5-10 years" },
    { value: "5", label: "10+ years" },
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    const stringValue = Array.isArray(value) ? value.join(',') : value;
    const updatedData = { ...formData, [field]: stringValue };
    setFormData(updatedData);
    onUpdateData(updatedData);
  };

  // Persist suggestions to localStorage
  const persistSuggestions = (items: string[]) => {
    try {
      localStorage.setItem("subArtistTypes", JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  };

  // Add new suggestion if not exists
  const addSuggestionIfNew = (value: string) => {
    const v = value?.trim();
    if (!v) return;
    if (!subArtistSuggestions.includes(v)) {
      const next = [v, ...subArtistSuggestions].slice(0, 50);
      setSubArtistSuggestions(next);
      persistSuggestions(next);
    }
  };

  // Load suggestions on mount (ensure merged with defaults)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("subArtistTypes");
      if (raw) {
        const items: string[] = JSON.parse(raw);
        // merge saved and defaults
        const merged = Array.from(new Set([...items, ...defaultSubTypes]));
        setSubArtistSuggestions(merged);
      }
    } catch (e) {
      // On error, keep defaults
      setSubArtistSuggestions(defaultSubTypes);
    }
  }, []);

  // Sync formData when data prop changes (for editing existing profiles)
  useEffect(() => {
    if (data.artistType || data.stageName || data.subArtistType) {
      setFormData({
        profilePhoto: data.profilePhoto || null,
        avatarUrl: (data as any).avatarUrl || "",
        stageName: data.stageName || "",
        artistType: data.artistType || "",
        subArtistType: data.subArtistType || "",
        achievements: data.achievements || "",
        yearsOfExperience: data.yearsOfExperience || "",
        shortBio: data.shortBio || "",
      });

      // Update preview if there's an avatar URL
      if ((data as any).avatarUrl) {
        setPreview((data as any).avatarUrl);
      }

      // Update selected sub types
      const raw = data.subArtistType || "";
      if (raw) {
        const subTypes = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        setSelectedSubTypes(subTypes);
      }
    }
  }, [data.artistType, data.stageName, data.subArtistType, data.achievements, data.yearsOfExperience, data.shortBio, (data as any).avatarUrl, data.profilePhoto]);

  const handleProfilePhotoUpload = async (file: File) => {
    console.log("⬇️ Original file:", file);

    try {
      setUploading(true);

      // 1️⃣ Compress the file before uploading
      const options = {
        maxSizeMB: 1, // compress to ~1MB
        maxWidthOrHeight: 800, // resize if larger
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      console.log("📦 Compressed file:", compressedFile);

      // 2️⃣ Show preview using compressed file
      setPreview(URL.createObjectURL(compressedFile));

      // 3️⃣ Build form data
      const formDataUpload = new FormData();
      formDataUpload.append("file", compressedFile);

      // 4️⃣ Upload compressed image
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const json = await res.json();

      if (!res.ok) {
        console.error(json.message);
        setUploading(false);
        return;
      }

      const imageUrl = json?.data?.imageUrl;

      const updatedData = {
        profilePhoto: compressedFile,
        avatarUrl: imageUrl,
      };

      setFormData((prev) => ({ ...prev, ...updatedData }));
      onUpdateData(updatedData);

      setUploading(false);
    } catch (error) {
      console.error("Profile photo upload failed:", error);
      setUploading(false);
    }
  };

  // Handle file selection - opens crop modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("📸 File selected:", file);

    // Create URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropModal(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle crop completion
  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) return;

      // Convert blob to file
      const croppedFile = new File([croppedBlob], "cropped-profile.jpg", {
        type: "image/jpeg",
      });

      setShowCropModal(false);
      setImageToCrop(null);

      // Upload the cropped image
      handleProfilePhotoUpload(croppedFile);
    } catch (error) {
      console.error("Crop failed:", error);
    }
  };

  // Cancel cropping
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNext = () => {
    // Validate required fields: only stageName and artistType
    const newErrors: Record<string, string> = {};

    if (!formData.stageName?.trim()) {
      newErrors.stageName = "Stage name is required";
    }
    if (!formData.artistType) {
      newErrors.artistType = "Artist type is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return; // Don't proceed if there are errors
    }

    // Persist sub-artist type into suggestions if new
    if (formData.subArtistType) {
      addSuggestionIfNew(formData.subArtistType);
    }

    onUpdateData(formData);
    onNext();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-primary-pink transition-colors duration-200"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden md:block">Back</span>
          <span className="md:hidden h2">Profile Setup</span>
        </button>

        {/* <div>
          <button
            onClick={onSkip}
            className="text-primary-pink hover:text-primary-orange transition-colors duration-200"
          >
            Skip
          </button>
        </div> */}
      </div>
      <div className="h-px bg-border-line mb-4" />

      {/* Content */}
      <div className="flex-1 px-6 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="h1-heading text-white mb-2 md:mb-8 hidden md:block">
              Profile setup
            </h1>

            <div className="w-full bg-[#2D2D2D] rounded-full h-1 mb-6">
              <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-1/4"></div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0">
                <Image
                  src="/icons/user.svg"
                  alt="Artist Profile"
                  width={32}
                  height={32}
                />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Artist Profile Details</h2>
              </div>
            </div>

            <p className="text-text-gray secondary-grey-text text-left">
              Build your artist profile to get discovered.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Profile Photo Upload */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-[150px] h-[200px] bg-card border border-dashed border-border-color rounded-md flex flex-col gap-3 text-center items-center justify-center overflow-hidden">
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      width={150}
                      height={200}
                      unoptimized
                    />
                  ) : (
                    <>
                      <Image
                        src={`/icons/user-icon.svg`}
                        alt="Profile"
                        width={50}
                        height={50}
                      />
                      <p className="text-text-gray secondary-text px-2">
                        Upload Profile Photo
                      </p>
                    </>
                  )}
                </div>

                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md z-10">
                    <p className="text-white text-sm">Uploading...</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                />
              </div>

              <div className="ml-3 self-start mt-2">
                <Tooltip content="Recommended: portrait JPG/PNG. Aspect ratio 3:4 (e.g. 600x800). Use a clear headshot.">
                  <svg
                    className="w-4 h-4 text-blue cursor-help"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Tooltip>
              </div>
            </div>

            {/* Stage Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block secondary-text text-white">
                  Stage name*
                </label>
                <Tooltip content="Your stage name or artist alias that fans will recognize you by. This will be displayed on your public profile.">
                  <svg
                    className="w-4 h-4 text-blue cursor-help"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Tooltip>
              </div>
              <Input
                placeholder="Enter your stage name"
                value={formData.stageName}
                onChange={(e) => handleInputChange("stageName", e.target.value)}
                variant="filled"
              />
              {errors.stageName && (
                <p className="text-red-500 text-sm mt-1">{errors.stageName}</p>
              )}
            </div>

            {/* Artist Type */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block secondary-text text-white">
                  Artist type*
                </label>
                <Tooltip content="Select the primary category that best describes your art form, such as Singer, Dancer, Musician, etc.">
                  <svg
                    className="w-4 h-4 text-blue cursor-help"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Tooltip>
              </div>
              <Select
                placeholder="Select or write artist type"
                value={formData.artistType}
                onChange={(value) => handleInputChange("artistType", value)}
                options={artistTypes}
              />
              {errors.artistType && (
                <p className="text-red-500 text-sm mt-1">{errors.artistType}</p>
              )}
            </div>

            {/* Sub Artist Type (text input with suggestions) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block secondary-text text-white">
                  Sub-Artist type
                </label>
                <Tooltip content="Specify your specialty within your art form. For example, if you're a singer, you might specialize in Classical, Bollywood, or Fusion music.">
                  <svg
                    className="w-4 h-4 text-blue cursor-help"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Tooltip>
              </div>

              <div className="w-full bg-card border border-border-color rounded-lg px-3 py-2 text-white flex flex-wrap gap-2">
                {selectedSubTypes.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-2 border border-border-color text-sm px-3 py-1 rounded-full">
                    <span className="text-white">{tag}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = selectedSubTypes.filter((t) => t !== tag);
                        setSelectedSubTypes(next);
                        // update local formData and parent as comma-separated string
                        const csv = next.length ? next.join(",") : "";
                        setFormData((prev) => ({
                          ...prev,
                          subArtistType: csv,
                        }));
                        onUpdateData({ subArtistType: csv });
                        // persist suggestion list
                        persistSuggestions(next);
                      }}
                      className="text-text-gray hover:text-white"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  placeholder="e.g. Classical, Bollywood, Fusion"
                  value={subTypeInput}
                  onChange={(e) => setSubTypeInput(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const v = subTypeInput.trim().replace(/,$/, "");
                      if (v) {
                        if (!selectedSubTypes.includes(v)) {
                          const next = [v, ...selectedSubTypes];
                          setSelectedSubTypes(next);
                          const csv = next.join(",");
                          // update local formData and parent
                          setFormData((prev) => ({
                            ...prev,
                            subArtistType: csv,
                          }));
                          onUpdateData({ subArtistType: csv });
                          addSuggestionIfNew(v);
                        }
                        setSubTypeInput("");
                      }
                    } else if (e.key === "Backspace" && !subTypeInput) {
                      // remove last tag
                      const next = selectedSubTypes.slice(0, -1);
                      setSelectedSubTypes(next);
                      const csv = next.length ? next.join(",") : "";
                      setFormData((prev) => ({ ...prev, subArtistType: csv }));
                      onUpdateData({ subArtistType: csv });
                    }
                  }}
                  className="flex-1 bg-transparent focus:outline-none px-2 py-1 text-sm placeholder-text-gray"
                />
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-48 overflow-auto">
                  {subArtistSuggestions.filter((s) =>
                    s
                      .toLowerCase()
                      .includes((subTypeInput || "").toLowerCase()),
                  ).length === 0 ? (
                    <div className="px-3 py-2 text-sm text-text-gray">
                      No suggestions
                    </div>
                  ) : (
                    subArtistSuggestions
                      .filter((s) =>
                        s
                          .toLowerCase()
                          .includes((subTypeInput || "").toLowerCase()),
                      )
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => {
                            // add suggestion as a tag
                            if (!selectedSubTypes.includes(s)) {
                              const next = [s, ...selectedSubTypes];
                              setSelectedSubTypes(next);
                              const csv = next.join(",");
                              setFormData((prev) => ({
                                ...prev,
                                subArtistType: csv,
                              }));
                              onUpdateData({ subArtistType: csv });
                              addSuggestionIfNew(s);
                            }
                            setSubTypeInput("");
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm"
                        >
                          {s}
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Achievements + Experience */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block secondary-text text-white">
                    Achievements / Awards
                  </label>
                  <Tooltip content="List any notable achievements, awards, or recognitions you have received in your career. This helps build credibility with potential clients.">
                    <svg
                      className="w-4 h-4 text-blue cursor-help"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Tooltip>
                </div>
                <Input
                  placeholder="Enter achievements"
                  value={formData.achievements}
                  onChange={(e) =>
                    handleInputChange("achievements", e.target.value)
                  }
                  variant="filled"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block secondary-text text-white">Years of experience</label>
                  <Tooltip content="Select how many years you have been performing professionally. This helps clients understand your experience level.">
                    <svg
                      className="w-4 h-4 text-blue cursor-help"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Tooltip>
                </div>
                <Select
                  placeholder="Select no. of years"
                  value={formData.yearsOfExperience}
                  onChange={(value) =>
                    handleInputChange("yearsOfExperience", value)
                  }
                  options={experienceYears}
                />
                {errors.yearsOfExperience && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.yearsOfExperience}
                  </p>
                )}
              </div>
            </div>

            {/* Short Bio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block secondary-text text-white">Short bio</label>
                <Tooltip content="Write a compelling description about yourself, your journey, and what makes you unique. This is your chance to tell your story to potential clients.">
                  <svg
                    className="w-4 h-4 text-blue cursor-help"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Tooltip>
              </div>
              <textarea
                placeholder="Write a short bio about yourself..."
                value={formData.shortBio}
                onChange={(e) => handleInputChange("shortBio", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none"
              />
              {errors.shortBio && (
                <p className="text-red-500 text-sm mt-1">{errors.shortBio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color px-5 md:px-0 py-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            className="w-full"
          >
            Save & Next
          </Button>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-card border border-border-color rounded-xl w-[90vw] max-w-md overflow-hidden">
            {/* Modal Header */}
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

            {/* Crop Area */}
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

            {/* Zoom Slider */}
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

            {/* Modal Footer */}
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

export default ArtistProfileDetails;
