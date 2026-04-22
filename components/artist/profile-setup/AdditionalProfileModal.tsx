"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/ui/Modal";
import ArtistProfileDetails from "@/components/artist/profile-setup/ArtistProfileDetails";
import PerformanceDetails from "@/components/artist/profile-setup/PerformanceDetails";
import ContactPricingDetails from "@/components/artist/profile-setup/ContactPricingDetails";
import ProfileReview from "@/components/artist/profile-setup/ProfileReview";
import { ArtistProfileSetupData, ArtistProfileSetupPreferences } from "@/types";

type Step = "artistDetails" | "performanceDetails" | "contactPricing" | "review";

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
    else if (currentStep === "review") await submit();
  };

  const goBack = () => {
    if (currentStep === "review") setCurrentStep("contactPricing");
    else if (currentStep === "contactPricing") setCurrentStep("performanceDetails");
    else if (currentStep === "performanceDetails") setCurrentStep("artistDetails");
    else onClose();
  };

  const submit = async () => {
    if (!userId || submitting) return;
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
      if (!response.ok || !json?.success) return;

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
      }
      onClose();
    } catch {
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
      </div>
    </Modal>
  );
}
