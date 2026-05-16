"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/ui/Modal";
import ArtistProfileDetails from "@/components/artist/profile-setup/ArtistProfileDetails";
import PerformanceDetails from "@/components/artist/profile-setup/PerformanceDetails";
import ContactPricingDetails from "@/components/artist/profile-setup/ContactPricingDetails";
import ProfileReview from "@/components/artist/profile-setup/ProfileReview";
import Button from "@/components/ui/Button";
import YouTubeConnectModal from "@/components/modals/YouTubeConnectModal";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  useIntegrationStatus,
  useInstagramConnect,
  useInstagramDisconnect,
  useYouTubeConnectByChannel,
} from "@/hooks/use-integrations";
import { ArtistProfileSetupData, ArtistProfileSetupPreferences } from "@/types";

type Step =
  | "artistDetails"
  | "performanceDetails"
  | "contactPricing"
  | "review"
  | "integrations";

type WizardData = ArtistProfileSetupData & {
  avatarUrl?: string;
  artistProfileId?: string;
};

const initialData: WizardData = {
  profilePhoto: null,
  avatarUrl: "",
  artistProfileId: "",
  stageName: "",
  artistType: "",
  subArtistType: "",
  achievements: "",
  yearsOfExperience: "",
  shortBio: "",
  performingLanguages: [],
  performingEventTypes: [],
  performingStates: [],
  performingDurationFrom: "",
  performingDurationTo: "",
  performingMembers: "",
  offStageMembers: "",
  contactNumber: "",
  whatsappNumber: "",
  sameAsContact: false,
  email: "",
  soloCharges: "",
  soloDescription: "",
  backingCharges: "",
  backingDescription: "",
};

function IntegrationsStep(props: {
  artistProfileId: string;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const { artistProfileId, onNext, onSkip, onBack } = props;

  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);

  const { data: integrationStatus, isLoading: isLoadingStatus } =
    useIntegrationStatus(artistProfileId);

  const youtubeConnectByChannelMutation =
    useYouTubeConnectByChannel(artistProfileId);

  const instagramConnectMutation = useInstagramConnect({
    returnUrl: `/artist/profile?tab=integrations&profileId=${artistProfileId}`,
    artistProfileId,
  });
  const instagramDisconnectMutation = useInstagramDisconnect(artistProfileId);

  const youtubeConnected = integrationStatus?.youtube.connected ?? false;
  const instagramConnected = integrationStatus?.instagram.connected ?? false;

  const isYouTubeLoading = youtubeConnectByChannelMutation.isPending;
  const isInstagramLoading =
    instagramConnectMutation.isPending || instagramDisconnectMutation.isPending;

  const handleYouTubeConnect = () => {
    setYoutubeModalOpen(true);
  };

  const handleYouTubeConnectConfirm = async (channelId: string) => {
    await youtubeConnectByChannelMutation.mutateAsync(channelId);
    setYoutubeModalOpen(false);
  };

  const connectInstagram = () => {
    instagramConnectMutation.mutate();
  };

  const disconnectInstagram = () => {
    instagramDisconnectMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-white h3 mb-2">Videos & Social media</h2>
        <p className="text-text-gray text-sm">
          Connect your YouTube and Instagram account to import your videos &
          reels.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border-color rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="text-white btn1 mb-1">YouTube Channel</h3>
              <p className="text-text-gray secondary-text mb-4">
                Import all videos & shorts from your YouTube channel
              </p>
            </div>
          </div>

          {isLoadingStatus ? (
            <div className="flex items-center justify-center gap-2 text-text-gray text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking status...
            </div>
          ) : youtubeConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center text-center gap-2 text-green-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                Connected
                {integrationStatus?.youtube.channelName && (
                  <span className="text-text-gray ml-1">
                    ({integrationStatus.youtube.channelName})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleYouTubeConnect}
                className="w-full py-2 text-sm border border-border-color text-white rounded-full font-medium hover:bg-card transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span className="gradient-text">Change YouTube Channel</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleYouTubeConnect}
              disabled={isYouTubeLoading}
              className="w-full py-2 text-sm bg-white rounded-full font-medium hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isYouTubeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="gradient-text">Connecting...</span>
                </>
              ) : (
                <span className="gradient-text">Connect YouTube</span>
              )}
            </button>
          )}
        </div>

        <div className="bg-card border border-border-color rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="text-white btn1 mb-1">Instagram Account</h3>
              <p className="text-text-gray secondary-text mb-4">
                Import all reels from your Instagram account
              </p>
            </div>
          </div>

          {instagramConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center text-center gap-2 text-green-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                Connected
                {integrationStatus?.instagram.username && (
                  <span className="text-text-gray ml-1">
                    (@{integrationStatus.instagram.username})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={disconnectInstagram}
                disabled={isInstagramLoading}
                className="w-full py-2 text-sm border border-red-400/30 text-red-400 rounded-full font-medium hover:bg-red-400/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isInstagramLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={connectInstagram}
              disabled={isInstagramLoading}
              className="w-full py-2 text-sm bg-white rounded-full font-medium hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInstagramLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="gradient-text">Connecting...</span>
                </>
              ) : (
                <span className="gradient-text">Connect Instagram</span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={onBack}
          className="w-full"
        >
          Back
        </Button>
        <Button variant="outline" size="md" onClick={onSkip} className="w-full">
          Skip
        </Button>
        <Button variant="primary" size="md" onClick={onNext} className="w-full">
          Finish
        </Button>
      </div>

      <YouTubeConnectModal
        isOpen={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
        onConnect={handleYouTubeConnectConfirm}
      />
    </div>
  );
}

export default function AdditionalProfileModal(props: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (profile: { id: string }) => void;
}) {
  const { isOpen, onClose, onCreated } = props;
  const { data: session } = useSession();
  const userId = session?.user?.id || null;

  const [currentStep, setCurrentStep] = useState<Step>("artistDetails");
  const [submitting, setSubmitting] = useState(false);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>(initialData);
  const [preferences, setPreferences] =
    useState<ArtistProfileSetupPreferences | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/preferences/artist-profile", {
          cache: "no-store",
        });
        const json = await res.json();
        const prefs = json?.data?.preferences as ArtistProfileSetupPreferences;
        if (!isActive) return;
        if (prefs && typeof prefs === "object") setPreferences(prefs);
        else setPreferences(null);
      } catch {
        if (!isActive) return;
        setPreferences(null);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep("artistDetails");
    setSubmitting(false);
    setCreatedProfileId(null);
    setData((prev) => ({
      ...initialData,
      email: session?.user?.email || "",
      contactNumber: session?.user?.phoneNumber || "",
      whatsappNumber: session?.user?.phoneNumber || "",
      avatarUrl: session?.user?.avatar || "",
    }));
  }, [isOpen, session?.user?.email, session?.user?.phoneNumber, session?.user?.avatar]);

  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case "artistDetails":
        return "Add New Profile";
      case "performanceDetails":
        return "Performance Details";
      case "contactPricing":
        return "Contact & Pricing";
      case "review":
        return "Review";
      case "integrations":
        return "Integrations";
      default:
        return "Add New Profile";
    }
  }, [currentStep]);

  const onUpdateData = (patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  const goNext = async () => {
    if (currentStep === "artistDetails") setCurrentStep("performanceDetails");
    else if (currentStep === "performanceDetails") setCurrentStep("contactPricing");
    else if (currentStep === "contactPricing") setCurrentStep("review");
    else if (currentStep === "review") {
      const createdId = await submit();
      if (createdId) {
        setCreatedProfileId(createdId);
        setCurrentStep("integrations");
      }
    } else if (currentStep === "integrations") onClose();
  };

  const goBack = () => {
    if (currentStep === "integrations") setCurrentStep("review");
    else if (currentStep === "review") setCurrentStep("contactPricing");
    else if (currentStep === "contactPricing") setCurrentStep("performanceDetails");
    else if (currentStep === "performanceDetails") setCurrentStep("artistDetails");
    else onClose();
  };

  const submit = async (): Promise<string | null> => {
    if (!userId || submitting) return null;
    setSubmitting(true);
    try {
      const response = await fetch("/api/artists/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          createNewProfile: true,
          stageName: data.stageName,
          artistType: data.artistType,
          subArtistType: data.subArtistType,
          achievements: data.achievements,
          yearsOfExperience: data.yearsOfExperience,
          shortBio: data.shortBio,
          performingLanguages: data.performingLanguages,
          performingEventTypes: data.performingEventTypes,
          performingStates: data.performingStates,
          performingDurationFrom: data.performingDurationFrom,
          performingDurationTo: data.performingDurationTo,
          performingMembers: data.performingMembers,
          offStageMembers: data.offStageMembers,
          contactNumber: data.contactNumber,
          whatsappNumber: data.whatsappNumber,
          contactEmail: data.email,
          soloChargesFrom: data.soloCharges,
          soloChargesTo: null,
          soloChargesDescription: data.soloDescription,
          chargesWithBacklineFrom: data.backingCharges,
          chargesWithBacklineTo: null,
          chargesWithBacklineDescription: data.backingDescription,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json?.success) return null;

      const created = json?.data?.artistProfile;
      if (created?.id) {
        if (data.profilePhoto) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", data.profilePhoto);
            formDataUpload.append("artistProfileId", String(created.id));
            await fetch("/api/media/upload", {
              method: "POST",
              body: formDataUpload,
            });
          } catch {
          }
        }

        onCreated?.({ id: created.id });
        return created.id;
      }
      return null;
    } catch {
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stepTitle}
      size="xl"
      variant="bottom-sheet"
      className="bg-card"
    >
      <div className="p-4 sm:p-6">
        {currentStep === "artistDetails" && (
          <ArtistProfileDetails
            data={data}
            onNext={goNext}
            onSkip={goNext}
            onBack={goBack}
            onUpdateData={onUpdateData}
            preferences={preferences}
          />
        )}

        {currentStep === "performanceDetails" && (
          <PerformanceDetails
            data={data}
            onNext={goNext}
            onSkip={goNext}
            onBack={goBack}
            onUpdateData={onUpdateData}
            preferences={preferences}
          />
        )}

        {currentStep === "contactPricing" && (
          <ContactPricingDetails
            data={data}
            onNext={goNext}
            onSkip={goNext}
            onBack={goBack}
            onUpdateData={onUpdateData}
          />
        )}

        {currentStep === "review" && (
          <ProfileReview
            data={data}
            onNext={goNext}
            onBack={goBack}
            onEdit={(step: any) => {
              if (step === "artistDetails") setCurrentStep("artistDetails");
              else if (step === "performanceDetails") setCurrentStep("performanceDetails");
              else if (step === "contactPricing") setCurrentStep("contactPricing");
            }}
            preferences={preferences}
          />
        )}

        {currentStep === "integrations" && createdProfileId && (
          <IntegrationsStep
            artistProfileId={createdProfileId}
            onNext={goNext}
            onSkip={onClose}
            onBack={goBack}
          />
        )}
      </div>
    </Modal>
  );
}
