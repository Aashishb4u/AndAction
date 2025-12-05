"use client";

import React, { useState, useEffect } from "react";
import ArtistDashboardLayout from "@/components/layout/ArtistDashboardLayout";
import ArtistProfileCard from "@/components/artist/ArtistProfileCard";
import ArtistProfileTabs from "@/components/artist/ArtistProfileTabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function ArtistProfile() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  const [activeTab, setActiveTab] = useState(tabParam || "about");
  const router = useRouter();
  const { data: session } = useSession();

  // Handle URL tab parameter changes
  useEffect(() => {
    if (
      tabParam &&
      ["about", "performance", "videos", "shorts", "integrations"].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle success/error messages from OAuth callbacks
  useEffect(() => {
    if (successParam === "youtube_connected") {
      toast.success("YouTube account connected successfully!");
      // Clear the URL params after showing notification
      router.replace("/artist/profile?tab=integrations", { scroll: false });
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        youtube_denied: "YouTube authorization was denied.",
        missing_params: "Missing authorization parameters.",
        invalid_state: "Invalid authorization state.",
        expired: "Authorization session expired. Please try again.",
        session_mismatch: "Session mismatch. Please try again.",
        token_exchange_failed: "Failed to exchange authorization token.",
        channel_fetch_failed: "Failed to fetch YouTube channel info.",
        no_channel: "No YouTube channel found for this account.",
        callback_failed: "Authorization callback failed.",
      };
      toast.error(errorMessages[errorParam] || "An error occurred.");
      router.replace("/artist/profile?tab=integrations", { scroll: false });
    }
  }, [successParam, errorParam, router]);

  const user = session?.user;
  const artistProfile = user?.artistProfile;

  if (!user || !artistProfile) {
    return (
      <ArtistDashboardLayout>
        <div className="flex items-center justify-center h-screen text-white">
          Loading artist profile...
        </div>
      </ArtistDashboardLayout>
    );
  }

  const artistData = {
    id: artistProfile.id || user.id || "",
    name:
      artistProfile.stageName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    category: artistProfile.artistType || "Artist",
    location: `${user.city || ""}${user.state ? `, ${user.state}` : ""}`,
    duration: "2-4 hours",
    startingPrice: 25000,
    languages: artistProfile.performingLanguage
      ? artistProfile.performingLanguage.split(",").map((lang) => lang.trim())
      : [],
    image: user.avatar || "/icons/images.jpeg",
    isBookmarked: false,
    gender: user.gender || "",
    subCategory: artistProfile.subArtistType || "",
    bio: artistProfile.shortBio || "",
    yearsOfExperience: artistProfile.yearsOfExperience || 0,
    subArtistTypes: artistProfile.subArtistType
      ? artistProfile.subArtistType.split(",").map((s) => s.trim())
      : [],
    achievements: artistProfile.achievements
      ? artistProfile.achievements.split(",").map((a) => a.trim())
      : [],
    phone: artistProfile.contactNumber || "",
    whatsapp: artistProfile.whatsappNumber || artistProfile.contactNumber || "",
    videos: [],
    shorts: [],
    performances: [],
    stageName: artistProfile.stageName || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    dateOfBirth: user.dob
      ? new Date(user.dob).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "",
    address: user.address || "",
    pinCode: user.zip || "",
    state: user.state || "",
    city: user.city || "",
    subArtistType: artistProfile.subArtistType || "",
    shortBio: artistProfile.shortBio || "",
    performingLanguage: artistProfile.performingLanguage || "",
    performingEventType: artistProfile.performingEventType || "",
    performingStates: artistProfile.performingStates || "",
    performingDurationFrom: artistProfile.performingDurationFrom || "",
    performingDurationTo: artistProfile.performingDurationTo || "",
    performingMembers: artistProfile.performingMembers || "",
    offStageMembers: artistProfile.offStageMembers || "",
    tags: [artistProfile.artistType || "", artistProfile.subArtistType || ""],
  };

  return (
    <ArtistDashboardLayout>
      <div className="flex flex-col lg:flex-row md:gap-5 md:p-6 min-h-screen">
        {/* Left Side - Artist Profile Card */}
        <div className="w-full lg:w-80 flex-shrink-0 max-w-screen overflow-hidden">
          <ArtistProfileCard onBack={() => router.push("/artist/dashboard")} artist={artistData} />
        </div>

        {/* Right Side - Tabs and Content */}
        <div className="flex-1 md:bg-card w-full md:rounded-lg">
          <ArtistProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            artist={artistData}
          />
        </div>
      </div>
    </ArtistDashboardLayout>
  );
}
