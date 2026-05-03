"use client";

import React, { useState, useEffect, Suspense } from "react";
import ArtistDashboardLayout from "@/components/layout/ArtistDashboardLayout";
import ArtistProfileCard from "@/components/artist/ArtistProfileCard";
import ArtistProfileTabs from "@/components/artist/ArtistProfileTabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import { findCategoryLabel } from "@/lib/artist-category-utils";
import AdditionalProfileModal from "@/components/artist/profile-setup/AdditionalProfileModal";
import { useQueryClient } from "@tanstack/react-query";
import { integrationKeys } from "@/hooks/use-integrations";
import { videoKeys } from "@/hooks/use-youtube-videos";

function ArtistProfileContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");
  const profileIdParam = searchParams.get("profileId");

  const [activeTab, setActiveTab] = useState(tabParam || "about");
  const [selectedArtistProfile, setSelectedArtistProfile] = useState<any | null>(null);
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { categories } = useArtistCategories();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({
        queryKey: integrationKeys.status(profileIdParam),
      });
      queryClient.setQueryData(videoKeys.list("videos", profileIdParam), []);
      queryClient.setQueryData(videoKeys.list("shorts", profileIdParam), []);
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      queryClient.invalidateQueries({ queryKey: ["instagram-videos"] });
      queryClient.refetchQueries({ queryKey: videoKeys.all });
      // Clear the URL params after showing notification
      router.replace(
        profileIdParam
          ? `/artist/profile?tab=integrations&profileId=${profileIdParam}`
          : "/artist/profile?tab=integrations",
        { scroll: false },
      );
    } else if (successParam === "instagram_connected") {
      toast.success("Instagram account connected successfully!");
      queryClient.invalidateQueries({
        queryKey: integrationKeys.status(profileIdParam),
      });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["instagram-videos"] });
      router.replace(
        profileIdParam
          ? `/artist/profile?tab=integrations&profileId=${profileIdParam}`
          : "/artist/profile?tab=integrations",
        { scroll: false },
      );
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
        instagram_denied: "Instagram authorization was denied.",
      };
      toast.error(errorMessages[errorParam] || "An error occurred.");
      router.replace(
        profileIdParam
          ? `/artist/profile?tab=integrations&profileId=${profileIdParam}`
          : "/artist/profile?tab=integrations",
        { scroll: false },
      );
    }
  }, [successParam, errorParam, router, profileIdParam, queryClient]);

  const user = session?.user;
  const primaryArtistProfile = user?.artistProfile;

  const refreshSelectedProfile = async () => {
    if (!user?.id) return;
    if (!profileIdParam || profileIdParam === primaryArtistProfile?.id) return;
    try {
      const response = await fetch(`/api/artists/profiles/${profileIdParam}`);
      const json = await response.json();
      if (!response.ok || !json?.success) return;
      setSelectedArtistProfile(json?.data?.profile ?? null);
    } catch {
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    if (!profileIdParam || profileIdParam === primaryArtistProfile?.id) {
      setSelectedArtistProfile(primaryArtistProfile ?? null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/artists/profiles/${profileIdParam}`);
        const json = await response.json();
        if (!response.ok || !json?.success) {
          setSelectedArtistProfile(primaryArtistProfile ?? null);
          return;
        }
        if (!cancelled) setSelectedArtistProfile(json?.data?.profile ?? null);
      } catch {
        setSelectedArtistProfile(primaryArtistProfile ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profileIdParam, primaryArtistProfile]);

  const displayArtistType = (() => {
    const rawType = selectedArtistProfile?.artistType?.trim() || "";
    if (!rawType) return "Artist";
    return findCategoryLabel(categories, rawType) || rawType;
  })();


  if (!user || !primaryArtistProfile) {
    return (
      <ArtistDashboardLayout>
        <div className="flex items-center justify-center h-screen text-white">
          Loading artist profile...
        </div>
      </ArtistDashboardLayout>
    );
  }

  const artistProfile = selectedArtistProfile ?? primaryArtistProfile;

  const artistData = {
    id: artistProfile.id || user.id || "",
    name:
      artistProfile.stageName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    category: displayArtistType,
    location: `${user.state || ""}`,
    duration: "2-4 hours",
    startingPrice: 25000,
    languages: artistProfile.performingLanguage
      ? artistProfile.performingLanguage.split(",").map((lang) => lang.trim())
      : [],
    image: artistProfile.profileImage || user.avatar || "/avatars/default.jpg",
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
    contactNumber: artistProfile.contactNumber || "",
    whatsappNumber: artistProfile.whatsappNumber || artistProfile.contactNumber || "",
    contactEmail: artistProfile.contactEmail || user.email || "",
    email: user.email || "",
    videos: [],
    shorts: [],
    performances: [],
    stageName: artistProfile.stageName || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    dateOfBirth: user.dob
      ? new Date(user.dob).toISOString().split('T')[0]
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
    soloChargesFrom:
      artistProfile.soloChargesFrom !== null &&
      artistProfile.soloChargesFrom !== undefined
        ? Number(artistProfile.soloChargesFrom)
        : undefined,
    soloChargesTo:
      artistProfile.soloChargesTo !== null &&
      artistProfile.soloChargesTo !== undefined
        ? Number(artistProfile.soloChargesTo)
        : undefined,
    soloChargesDescription: artistProfile.soloChargesDescription || "",
    chargesWithBacklineFrom:
      artistProfile.chargesWithBacklineFrom !== null &&
      artistProfile.chargesWithBacklineFrom !== undefined
        ? Number(artistProfile.chargesWithBacklineFrom)
        : undefined,
    chargesWithBacklineTo:
      artistProfile.chargesWithBacklineTo !== null &&
      artistProfile.chargesWithBacklineTo !== undefined
        ? Number(artistProfile.chargesWithBacklineTo)
        : undefined,
    chargesWithBacklineDescription: artistProfile.chargesWithBacklineDescription || "",
    tags: [artistProfile.artistType || "", artistProfile.subArtistType || ""],
    userId: user.id
  };

  return (
    <ArtistDashboardLayout hideNavbar={true}>
      <div className="flex flex-col lg:flex-row md:gap-5 md:p-6 min-h-screen">
        {/* Left Side - Artist Profile Card */}
          <div className="w-full lg:w-80 flex-shrink-0 max-w-screen overflow-hidden">
          <ArtistProfileCard
            onBack={() => router.push("/artist/dashboard")}
            onEdit={() => setIsAddProfileOpen(true)}
            artist={artistData}
          />
        </div>

        {/* Right Side - Tabs and Content */}
        <div className="flex-1 md:bg-card w-full md:rounded-lg">
          <ArtistProfileTabs
            key={artistData.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            artist={artistData}
            onProfileUpdated={refreshSelectedProfile}
          />
        </div>
      </div>

      <AdditionalProfileModal
        isOpen={isAddProfileOpen}
        onClose={() => setIsAddProfileOpen(false)}
        onCreated={(created) => {
          router.push(`/artist/profile?profileId=${created.id}`);
        }}
      />
    </ArtistDashboardLayout>
  );
}


export default function ArtistProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArtistProfileContent />
    </Suspense>
  );
}
