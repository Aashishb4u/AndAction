"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { ArtistProfileSetupData, ArtistProfileSetupPreferences } from "@/types";
import { useArtistCategories } from "@/hooks/use-artist-categories";

interface ProfileReviewProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onBack: () => void;
  onEdit: (step: string) => void;
  preferences: ArtistProfileSetupPreferences | null;
}

import { useState } from "react";

const ProfileReview: React.FC<ProfileReviewProps> = ({
  data,
  onNext,
  onBack,
  onEdit,
  preferences,
}) => {
  const [error, setError] = useState<string | null>(null);
  const { categories: artistCategories } = useArtistCategories();

  const [greetingName, setGreetingName] = useState<string>(data.stageName || "");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    const avatarUrl = (data as any)?.avatarUrl;
    if (avatarUrl) {
      setPreviewUrl(avatarUrl);
      return;
    }

    if (!data?.profilePhoto) {
      setPreviewUrl(null);
      return;
    }

    try {
      // profilePhoto can be a File/Blob or a string URL
      const url = typeof data.profilePhoto === "string" ? data.profilePhoto : URL.createObjectURL(data.profilePhoto as Blob);
      setPreviewUrl(url);
      return () => {
        if (typeof data.profilePhoto !== "string") {
          URL.revokeObjectURL(url);
        }
      };
    } catch (e) {
      setPreviewUrl(null);
    }
  }, [data.profilePhoto, (data as any)?.avatarUrl]);

  React.useEffect(() => {
    if (greetingName) return;
    try {
      const stored = localStorage.getItem("firstName");
      if (stored) setGreetingName(stored);
    } catch (e) {
      // ignore
    }
  }, [greetingName]);

  // Helper to parse values saved as array, CSV string, or JSON array string
  const parseList = (value: any): string[] => {
    if (!value && value !== 0) return [];
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    if (typeof value === "string") {
      const trimmed = value.trim();
      // JSON array string like '["A","B"]'
      if ((trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
        } catch (e) {
          // fallthrough to CSV parsing
        }
      }
      // CSV separated
      return trimmed.split(",").map((s) => s.replace(/^[\[\]"]+/g, "").replace(/[\[\]"]+$/g, "").trim()).filter(Boolean);
    }
    return [String(value)];
  };

  const subArtistTypes = parseList((data as any).subArtistTypes ?? data.subArtistType);
  const achievementsList = parseList((data as any).achievements ?? data.achievements);

  const artistTypeLabel = React.useMemo(() => {
    const rawArtistType = (data.artistType || "").trim();
    if (!rawArtistType) return "N/A";

    const normalize = (value: string) => value.toLowerCase().trim().replace(/[\s_]+/g, "-");

    const normalizedRaw = normalize(rawArtistType);
    const matchedCategory = artistCategories.find((category) => {
      const normalizedValue = normalize(category.value);
      const normalizedLabel = normalize(category.label);
      return normalizedRaw === normalizedValue || normalizedRaw === normalizedLabel;
    });

    return matchedCategory?.label || rawArtistType;
  }, [data.artistType, artistCategories]);

  const getExperienceLabel = (value: string) => {
    const list = preferences?.experienceYears ?? [];
    return list.find((o) => o.value === value)?.label || value;
  };

  const mapLabels = (values: string[], list: { value: string; label: string }[]) =>
    values.map((v) => list.find((o) => o.value === v)?.label || v);

  // Validate performance duration before submit
  const handleNext = () => {
    if (
      data.performingDurationFrom &&
      data.performingDurationTo &&
      Number(data.performingDurationTo) < Number(data.performingDurationFrom)
    ) {
      setError("End time cannot be less than start time.");
      return;
    }
    setError(null);
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
            className="w-6 h-6"
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
        <h1 className="h1-heading hidden md:block text-white">Profile Setup</h1>
        <div className="w-12"></div>
      </div>

      <div className="h-px bg-border-line mb-6" />

      {/* Content */}
      <div className="flex-1 md:px-4 pb-32">
        <div className="max-w-xl mx-auto">
          {error && (
            <div className="mb-4 px-4">
              <p className="text-red-500 text-sm font-semibold">{error}</p>
            </div>
          )}
          {/* Title */}
          <div className=" mb-8 px-4">
            <h2 className="h1 text-white mb-6 md:mb-8">
              All done! Preview profile
            </h2>

            {/* Success Badge */}
            <div className="flex justify-center mb-6">
              <Image
                src="/complete-illustration.svg"
                alt="Success"
                width={200}
                height={200}
              />
            </div>

            <div className="mb-6">
              <p className="text-white btn1 mb-1">Looking good, {greetingName || 'there'}!</p>
              <p className="text-text-gray secondary-text">
                Here&apos;s how your profile looks to users. You can edit it
                anytime.
              </p>
            </div>
          </div>

          {/* Profile Sections */}
          <div className="space-y-6">
            {/* Artist Profile Section */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-card border-y border-border-color px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Image
                        src="/icons/user.svg"
                        alt="Artist Profile"
                        width={25}
                        height={25}
                      />
                    </div>
                    <h3 className="text-white h2">Artist Profile</h3>
                  </div>
                  <Image
                    onClick={() => onEdit("artistDetails")}
                    src="/icons/edit.svg"
                    alt="Verified"
                    width={25}
                    height={25}
                  />
                </div>
              </div>

              {/* Profile Photo - Full Width */}
              <div className="flex justify-center px-4">
                <div className="w-36 h-52 rounded-xl flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    // Use native img for blob/object URLs to avoid Next/Image optimization issues
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <Image
                      src="/user.png"
                      alt="Artist Profile"
                      width={128}
                      height={128}
                      className="rounded-xl"
                    />
                  )}
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3 text-sm px-4">
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">
                    Stage Name
                  </span>
                  <span className="text-white text-base">
                    {data.stageName || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">
                    Artist type
                  </span>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-white text-base">{artistTypeLabel}</span>
                      </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">
                    Sub artist type
                  </span>
                      <div className="flex gap-2 flex-wrap">
                        {subArtistTypes.length > 0 && subArtistTypes.map((tag, i) => (
                          <Button
                            key={i}
                            variant="secondary"
                            size="xs"
                            className="px-2 py-1 !font-normal text-white text-xs"
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">
                    Achievements / Awards
                  </span>
                    <div>
                      <p className="text-white text-base">
                        {achievementsList.length ? achievementsList.join(", ") : String(data.achievements || "N/A")}
                      </p>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">
                    Years of experience
                  </span>
                  <span className="text-white text-base">
                    {data.yearsOfExperience
                      ? getExperienceLabel(data.yearsOfExperience)
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Short Bio */}
              <div className="space-y-2 px-4">
                <p className="text-text-gray text-sm">Short bio</p>
                <p className="text-white text-base leading-relaxed">
                  {data.shortBio || "N/A"}
                </p>
              </div>
            </div>

            {/* Performance Details Section */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-card border-y border-border-color px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-white h2">Performance Details</h3>
                  </div>

                  <Image
                    onClick={() => onEdit("performanceDetails")}
                    src="/icons/edit.svg"
                    alt="Verified"
                    width={25}
                    height={25}
                  />
                </div>
              </div>

              {/* Performance Details Content */}
              <div className="space-y-3 md:space-y-4 text-sm px-4">
                <div>
                  <p className="text-text-gray mb-1">Performing Languages</p>
                  <div className="flex gap-2 flex-wrap">
                    {data.performingLanguages?.length ? (
                      mapLabels(
                        data.performingLanguages,
                        preferences?.languages ?? [],
                      ).map((language, index) => (
                          <Button
                            key={index}
                            variant="secondary"
                            size="xs"
                            className="px-2 py-1 !font-normal text-white text-xs"
                          >
                            {language}
                          </Button>
                        ))
                    ) : (
                      <p className="text-white text-base">N/A</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing Event types</p>
                  <div className="flex gap-2 flex-wrap">
                    {data.performingEventTypes?.length ? (
                      mapLabels(
                        data.performingEventTypes,
                        preferences?.eventTypes ?? [],
                      ).map((language, index) => (
                          <Button
                            key={index}
                            variant="secondary"
                            size="xs"
                            className="px-2 py-1 !font-normal text-white text-xs"
                          >
                            {language}
                          </Button>
                        ))
                    ) : (
                      <p className="text-white text-base">N/A</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing States</p>
                  <div className="flex gap-2 flex-wrap">
                    {data.performingStates?.length ? (
                      mapLabels(
                        data.performingStates,
                        preferences?.states ?? [],
                      ).map((language, index) => (
                          <Button
                            key={index}
                            variant="secondary"
                            size="xs"
                            className="px-2 py-1 !font-normal text-white text-xs"
                          >
                            {language}
                          </Button>
                        ))
                    ) : (
                      <p className="text-white text-base">N/A</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing Duration</p>
                  <p className="text-white text-base">
                    {data.performingDurationFrom && data.performingDurationTo
                      ? `${data.performingDurationFrom} - ${data.performingDurationTo} mins`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing members</p>
                  <p className="text-white text-base">
                    {(data.performingMembers !== undefined && data.performingMembers !== null && String(data.performingMembers).trim() !== "")
                      ? `${data.performingMembers} members`
                      : "N/A"}
                    
                  </p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Off stage members</p>
                  <p className="text-white text-base">
                    {(data.offStageMembers !== undefined && data.offStageMembers !== null && String(data.offStageMembers).trim() !== "")
                      ? `${data.offStageMembers} members`
                      : "N/A"}
                   
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Pricing Details Section */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-card border-y border-border-color px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-white h2">Contact & Pricing Details</h3>
                  </div>
                  <Image
                    onClick={() => onEdit("contactPricing")}
                    src="/icons/edit.svg"
                    alt="Verified"
                    width={25}
                    height={25}
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 md:space-y-4 text-sm px-4">
                <div>
                  <p className="text-text-gray mb-1">Contact number</p>
                  <p className="text-white text-base">
                    {data.contactNumber ? `+91 - ${data.contactNumber}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">WhatsApp number</p>
                  <p className="text-white text-base">
                    {data.whatsappNumber ? `+91 - ${data.whatsappNumber}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Email ID</p>
                  <p className="text-white text-base">
                    {data.email || "N/A"}
                  </p>
                </div>
              </div>
              <div className="h-px border-gradient-dark-bg mt-6" />


              {/* Pricing */}
              <div className="space-y-4 px-4">
                <div>
                  <p className="text-text-gray text-sm mb-1">Solo Charges</p>
                  <p className="text-white font-medium text-lg">
                    Starting from ₹ {data.soloCharges || "N/A"}
                  </p>
                  {data.soloDescription && data.soloDescription.trim() && (
                    <p className="text-twhite text-xs mt-1">{data.soloDescription}</p>
                  )}
                </div>

                <div>
                  <p className="text-text-gray text-sm mb-1">
                    Charges with backline
                  </p>
                  <p className="text-white font-medium text-lg">
                    Starting from ₹ {data.backingCharges || "N/A"}
                  </p>
                  {data.backingDescription && data.backingDescription.trim() && (
                    <p className="text-white text-xs mt-1">{data.backingDescription}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 px-3 py-2`}
        style={{ backgroundColor: '#0F0F0FCC', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="max-w-md mx-auto">
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            className="w-full py-3"
          >
            Save & Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileReview;
