"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileOverview from "@/components/artist/profile-setup/ProfileOverview";
import ArtistProfileDetails from "@/components/artist/profile-setup/ArtistProfileDetails";
import PerformanceDetails from "@/components/artist/profile-setup/PerformanceDetails";
import ContactPricingDetails from "@/components/artist/profile-setup/ContactPricingDetails";
import ProfileReview from "@/components/artist/profile-setup/ProfileReview";
import VideosSocialMedia from "@/components/artist/profile-setup/VideosSocialMedia";
import SuccessModal from "@/components/artist/profile-setup/SuccessModal";
import { useSession } from "next-auth/react";

type ProfileSetupStep =
  | "overview"
  | "artistDetails"
  | "performanceDetails"
  | "contactPricing"
  | "review"
  | "videosSocialMedia";

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>("overview");
  // When a user clicks "Edit" from the Review page, we set this to the step
  // being edited so that after saving we can return to the review instead of
  // proceeding through the normal sequential flow.
  const [editingFromReview, setEditingFromReview] = useState<ProfileSetupStep | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin?redirect=/artist/profile-setup");
      return;
    }

    if (session?.user?.role !== "artist") {
      router.push("/");
      return;
    }
  }, [status, session, router]);

  // Form data states
  const [profileData, setProfileData] = useState({
    profilePhoto: null as File | null,
    avatarUrl: "",
    stageName: "",
    artistType: "",
    subArtistType: "",
    achievements: "",
    yearsOfExperience: "",
    shortBio: "",

    // Performance Details
    performingLanguages: [] as string[],
    performingEventTypes: [] as string[],
    performingStates: [] as string[],
    performingDurationFrom: "",
    performingDurationTo: "",
    performingMembers: "",
    offStageMembers: "",

    // Contact & Pricing Details
    contactNumber: "",
    whatsappNumber: "",
    sameAsContact: false,
    email: "",
    soloCharges: "",
    soloDescription: "",
    backingCharges: "",
    backingDescription: "",
  });

  // Pre-fill existing artist profile data when editing
  useEffect(() => {
    if (session?.user?.artistProfile) {
      const profile = session.user.artistProfile;
      const user = session.user;
      
      setProfileData((prev) => ({
        ...prev,
        avatarUrl: user.avatar || "",
        stageName: profile.stageName || "",
        artistType: profile.artistType || "",
        subArtistType: profile.subArtistType || "",
        achievements: profile.achievements || "",
        yearsOfExperience: profile.yearsOfExperience?.toString() || "",
        shortBio: profile.shortBio || "",
        performingLanguages: profile.performingLanguage 
          ? profile.performingLanguage.split(",").map((l: string) => l.trim())
          : [],
        performingEventTypes: profile.performingEventType
          ? profile.performingEventType.split(",").map((t: string) => t.trim())
          : [],
        performingStates: profile.performingStates
          ? profile.performingStates.split(",").map((s: string) => s.trim())
          : [],
        performingDurationFrom: profile.performingDurationFrom || "",
        performingDurationTo: profile.performingDurationTo || "",
        performingMembers: profile.performingMembers || "",
        offStageMembers: profile.offStageMembers || "",
        contactNumber: profile.contactNumber || user.phoneNumber || "",
        whatsappNumber: profile.whatsappNumber || user.phoneNumber || "",
        email: user.email || "",
      }));
    }
  }, [session]);

  // Pre-fill contact number from session if user signed up with phone
  useEffect(() => {
    if (session?.user?.phoneNumber) {
      const phone = session.user.phoneNumber;
      setProfileData((prev) => ({
        ...prev,
        contactNumber: prev.contactNumber || phone,
        whatsappNumber: prev.whatsappNumber || phone,
      }));
    }
    if (session?.user?.email) {
      setProfileData((prev) => ({
        ...prev,
        email: prev.email || session.user.email || "",
      }));
    }
  }, [session?.user?.phoneNumber, session?.user?.email]);

  const handleSubmitProfile = async () => {
    try {
      setIsSubmitting(true);
      const userId = session?.user?.id;

      if (!userId) {
        console.error("⚠️ No valid userId found in session");
        return;
      }

      const response = await fetch("/api/artists/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          stageName: profileData.stageName,
          artistType: profileData.artistType,
          subArtistType: profileData.subArtistType,
          achievements: profileData.achievements,
          yearsOfExperience: profileData.yearsOfExperience,
          shortBio: profileData.shortBio,
          performingLanguages: profileData.performingLanguages,
          performingEventTypes: profileData.performingEventTypes,
          performingStates: profileData.performingStates,
          performingDurationFrom: profileData.performingDurationFrom,
          performingDurationTo: profileData.performingDurationTo,
          performingMembers: profileData.performingMembers,
          offStageMembers: profileData.offStageMembers,
          contactNumber: profileData.contactNumber,
          whatsappNumber: profileData.whatsappNumber,
          contactEmail: profileData.email,
          soloChargesFrom: profileData.soloCharges,
          soloChargesTo: null,
          soloChargesDescription: profileData.soloDescription,
          chargesWithBacklineFrom: profileData.backingCharges,
          chargesWithBacklineTo: null,
          chargesWithBacklineDescription: profileData.backingDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Artist Profile Save Error:", data.message ?? data);
        return;
      }

      console.log("Artist Profile Created Successfully:", data);

      const updatedArtistProfile = data?.data?.artistProfile ?? null;
      const avatarToUse =
        (profileData as any).avatarUrl &&
        (profileData as any).avatarUrl.trim() !== ""
          ? (profileData as any).avatarUrl
          : (session?.user?.avatar ?? null);

      await update({
        avatar: avatarToUse,
        artistProfile: updatedArtistProfile,
        isArtistVerified: true,
      });

      // Navigate to Videos & Social Media step after successful save
      setCurrentStep("videosSocialMedia");
    } catch (err) {
      console.error("Unexpected Error Saving Artist Profile:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    // If we're editing a specific step initiated from the Review page,
    // then Save on that step should return to Review instead of continuing
    // the sequential flow.
    if (editingFromReview) {
      if (editingFromReview === currentStep) {
        // Clear editing flag and go back to review
        setEditingFromReview(null);
        setCurrentStep("review");
        return;
      }
    }

    switch (currentStep) {
      case "overview":
        setCurrentStep("artistDetails");
        break;
      case "artistDetails":
        setCurrentStep("performanceDetails");
        break;
      case "performanceDetails":
        setCurrentStep("contactPricing");
        break;
      case "contactPricing":
        setCurrentStep("review");
        break;
      case "review":
        await handleSubmitProfile();
        break;
      case "videosSocialMedia":
        setShowSuccessModal(true);
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "artistDetails":
        setCurrentStep("overview");
        break;
      case "performanceDetails":
        setCurrentStep("artistDetails");
        break;
      case "contactPricing":
        setCurrentStep("performanceDetails");
        break;
      case "review":
        setCurrentStep("contactPricing");
        break;
      case "videosSocialMedia":
        setCurrentStep("review");
        break;
      case "overview":
        router.push("/artist/dashboard");
        break;
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const updateProfileData = (data: Partial<typeof profileData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  const handleEdit = (step: string) => {
    switch (step) {
      case "artistDetails":
        setEditingFromReview("artistDetails");
        setCurrentStep("artistDetails");
        break;
      case "performanceDetails":
        setEditingFromReview("performanceDetails");
        setCurrentStep("performanceDetails");
        break;
      case "contactPricing":
        setEditingFromReview("contactPricing");
        setCurrentStep("contactPricing");
        break;
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    // Redirect to artist dashboard
    router.push("/artist/dashboard");
  };

  const handleAddAnotherProfile = () => {
    setShowSuccessModal(false);
    setCurrentStep("overview");
    setProfileData({
      profilePhoto: null,
      avatarUrl: "",
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
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "overview":
        return (
          <ProfileOverview
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
          />
        );
      case "artistDetails":
        return (
          <ArtistProfileDetails
            data={profileData}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            onUpdateData={updateProfileData}
          />
        );
      case "performanceDetails":
        return (
          <PerformanceDetails
            data={profileData}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            onUpdateData={updateProfileData}
          />
        );
      case "contactPricing":
        return (
          <ContactPricingDetails
            data={profileData}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            onUpdateData={updateProfileData}
          />
        );
      case "review":
        return (
          <ProfileReview
            data={profileData}
            onNext={handleNext}
            onBack={handleBack}
            onEdit={handleEdit}
          />
        );
      case "videosSocialMedia":
        return (
          <VideosSocialMedia
            onNext={handleNext}
            onSkip={handleNext}
            onBack={handleBack}
          />
        );
      default:
        return (
          <div className="text-center text-white">
            <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-text-gray mb-6">
              This step is under development.
            </p>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-linear-to-r from-primary-pink to-primary-orange text-white rounded-lg"
            >
              Continue
            </button>
          </div>
        );
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-pink mx-auto mb-4"></div>
          <p className="text-text-gray">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized (will redirect)
  if (!session || session.user?.role !== "artist") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {renderCurrentStep()}
      <SuccessModal
        isOpen={showSuccessModal}
        onGoToDashboard={handleGoToDashboard}
        onAddAnotherProfile={handleAddAnotherProfile}
      />
    </div>
  );
}
