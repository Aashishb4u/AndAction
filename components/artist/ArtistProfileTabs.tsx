"use client";

import React, { useEffect, useState } from "react";
import AboutTab from "./tabs/AboutTab";
import PerformanceTab from "./tabs/PerformanceTab";
import VideosTab from "./tabs/VideosTab";
import ShortsTab from "./tabs/ShortsTab";
import IntegrationsTab from "./tabs/IntegrationsTab";
import { Artist } from "@/types";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { mapUserForSession, updateArtistProfile } from "@/lib/helper";
import { normalizeArtistCategoryValue } from "@/lib/artist-category-utils";
import {
  createAboutDraft,
  createPerformanceDraft,
  type AboutDraft,
  type PerformanceDraft,
} from "./tabs/profileDraftTypes";

interface ArtistProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  artist: Artist;
  onProfileUpdated?: () => void;
}

const tabs = [
  { id: "about", label: "About" },
  { id: "performance", label: "Performance" },
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "integrations", label: "Integrations" },
];

const ArtistProfileTabs: React.FC<ArtistProfileTabsProps> = ({
  activeTab,
  onTabChange,
  artist,
  onProfileUpdated,
}) => {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const [aboutDraft, setAboutDraft] = useState<AboutDraft>(() =>
    createAboutDraft(artist),
  );
  const [performanceDraft, setPerformanceDraft] = useState<PerformanceDraft>(() =>
    createPerformanceDraft(artist),
  );

  useEffect(() => {
    setAboutDraft(createAboutDraft(artist));
    setPerformanceDraft(createPerformanceDraft(artist));
  }, [artist.id, (artist as any).contactNumber, (artist as any).whatsappNumber]);

  const resetAboutDraft = () => setAboutDraft(createAboutDraft(artist));
  const resetPerformanceDraft = () =>
    setPerformanceDraft(createPerformanceDraft(artist));

  const handleSaveAll = async () => {
    try {
      if (!session?.user?.id) {
        toast.error("Not authenticated");
        return;
      }

      setIsSaving(true);

      const payload = {
        userId: session.user.id,

        // About
        stageName: aboutDraft.stageName,
        artistType: normalizeArtistCategoryValue(aboutDraft.artistType),
        firstName: aboutDraft.firstName,
        lastName: aboutDraft.lastName,
        gender: aboutDraft.gender,
        dob: aboutDraft.dateOfBirth,
        address: aboutDraft.address,
        pinCode: aboutDraft.pinCode,
        city: aboutDraft.city,
        state: aboutDraft.state,
        contactNumber: aboutDraft.contactNumber,
        whatsappNumber: aboutDraft.whatsappNumber,
        contactEmail: aboutDraft.email,
        shortBio: aboutDraft.shortBio,
        achievements: aboutDraft.achievements,
        yearsOfExperience: aboutDraft.yearsOfExperience,
        subArtistType: aboutDraft.subArtistTypes.join(","),

        // Performance
        performingLanguage: performanceDraft.performingLanguages.join(","),
        performingEventType: performanceDraft.eventTypes.join(","),
        performingStates: performanceDraft.performingStates.join(","),
        performingDurationFrom: performanceDraft.minDuration,
        performingDurationTo: performanceDraft.maxDuration,
        performingMembers: performanceDraft.performingMembers,
        offStageMembers: performanceDraft.offStageMembers,
        soloChargesFrom: performanceDraft.soloChargesFrom,
        soloChargesDescription: performanceDraft.soloChargesDescription,
        chargesWithBacklineFrom: performanceDraft.chargesWithBacklineFrom,
        chargesWithBacklineDescription: performanceDraft.chargesWithBacklineDescription,
      };

      const res = await updateArtistProfile(payload);
      const refreshedUser = res.data.user;
      const refreshedArtist = res.data.artistProfile;
      const sessionPayload = mapUserForSession(refreshedUser, refreshedArtist);

      await update({
        update: sessionPayload,
      });

      // Ensure home/category listings fetch fresh data after profile updates.
      await queryClient.cancelQueries({ queryKey: ["artists"] });
      queryClient.removeQueries({ queryKey: ["artists"] });

      onProfileUpdated?.();
      toast.success("Profile updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <AboutTab
            draft={aboutDraft}
            setDraft={setAboutDraft}
            isSaving={isSaving}
            onSave={handleSaveAll}
            onReset={resetAboutDraft}
          />
        );
      case "performance":
        return (
          <PerformanceTab
            draft={performanceDraft}
            setDraft={setPerformanceDraft}
            isSaving={isSaving}
            onSave={handleSaveAll}
            onReset={resetPerformanceDraft}
          />
        );
      case "videos":
        return <VideosTab artist={artist} />;
      case "shorts":
        return <ShortsTab artist={artist} />;
      case "integrations":
        return <IntegrationsTab artist={artist} />;
      default:
        return (
          <AboutTab
            draft={aboutDraft}
            setDraft={setAboutDraft}
            isSaving={isSaving}
            onSave={handleSaveAll}
            onReset={resetAboutDraft}
          />
        );
    }
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-border-color mb-4 bg-card md:bg-transparent">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-6 md:px-8 border-b-2 font-medium text-base whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-primary-pink text-white"
                  : "border-transparent text-text-gray hover:text-white hover:border-[#404040]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-125 md:p-5 p-4 pt-0">{renderTabContent()}</div>
    </div>
  );
};

export default ArtistProfileTabs;
