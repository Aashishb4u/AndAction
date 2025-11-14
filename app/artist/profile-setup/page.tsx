'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileOverview from '@/components/artist/profile-setup/ProfileOverview';
import ArtistProfileDetails from '@/components/artist/profile-setup/ArtistProfileDetails';
import PerformanceDetails from '@/components/artist/profile-setup/PerformanceDetails';
import ContactPricingDetails from '@/components/artist/profile-setup/ContactPricingDetails';
import VideosSocialMedia from '@/components/artist/profile-setup/VideosSocialMedia';
import ProfileReview from '@/components/artist/profile-setup/ProfileReview';
import SuccessModal from '@/components/artist/profile-setup/SuccessModal';
import { useSession } from 'next-auth/react';


type ProfileSetupStep =
  | 'overview'
  | 'artistDetails'
  | 'performanceDetails'
  | 'contactPricing'
  | 'videosSocial'
  | 'review';

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>('overview');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session, update } = useSession();


  // Form data states
  const [profileData, setProfileData] = useState({
    profilePhoto: null as File | null,
    avatarUrl: "",
    stageName: '',
    artistType: '',
    subArtistType: '',
    achievements: '',
    yearsOfExperience: '',
    shortBio: '',

    // Performance Details
    performingLanguages: [] as string[],
    performingEventTypes: [] as string[],
    performingStates: [] as string[],
    performingDurationFrom: '',
    performingDurationTo: '',
    performingMembers: '',
    offStageMembers: '',

    // Contact & Pricing Details
    contactNumber: '',
    whatsappNumber: '',
    sameAsContact: false,
    email: '',
    soloChargesFrom: '',
    soloChargesTo: '',
    soloDescription: '',
    backingChargesFrom: '',
    backingChargesTo: '',
    backingDescription: '',

    // Videos & Social Media
    youtubeConnected: false,
    instagramConnected: false,
    youtubeChannelId: '',
    instagramAccountId: '',
  });

  const handleSubmitProfile = async () => {
    try {
      setIsSubmitting(true);
      const userId = session?.user?.id;

      if (!userId) {
        console.error('⚠️ No valid userId found in session');
        return;
      }

      const response = await fetch('/api/artists/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          soloChargesFrom: profileData.soloChargesFrom,
          soloChargesTo: profileData.soloChargesTo,
          soloChargesDescription: profileData.soloDescription,
          chargesWithBacklineFrom: profileData.backingChargesFrom,
          chargesWithBacklineTo: profileData.backingChargesTo,
          chargesWithBacklineDescription: profileData.backingDescription,
          youtubeChannelId: profileData.youtubeChannelId,
          instagramId: profileData.instagramAccountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Artist Profile Save Error:', data.message ?? data);
        return;
      }

      console.log('Artist Profile Created Successfully:', data);

      const updatedArtistProfile = data?.data?.artistProfile ?? null;
      const avatarToUse =
        (profileData as any).avatarUrl && (profileData as any).avatarUrl.trim() !== ""
          ? (profileData as any).avatarUrl
          : session.user.avatar;


      await update({
        update: {
          avatar: avatarToUse,
          artistProfile: updatedArtistProfile,
          isArtistVerified: true,
        },
      });




      setShowSuccessModal(true);
    } catch (err) {
      console.error('Unexpected Error Saving Artist Profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleNext = async () => {
    switch (currentStep) {
      case 'overview':
        setCurrentStep('artistDetails');
        break;
      case 'artistDetails':
        setCurrentStep('performanceDetails');
        break;
      case 'performanceDetails':
        setCurrentStep('contactPricing');
        break;
      case 'contactPricing':
        setCurrentStep('videosSocial');
        break;
      case 'videosSocial':
        setCurrentStep('review');
        break;
      case 'review':
        await handleSubmitProfile();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'artistDetails':
        setCurrentStep('overview');
        break;
      case 'performanceDetails':
        setCurrentStep('artistDetails');
        break;
      case 'contactPricing':
        setCurrentStep('performanceDetails');
        break;
      case 'videosSocial':
        setCurrentStep('contactPricing');
        break;
      case 'review':
        setCurrentStep('videosSocial');
        break;
      case 'overview':
        router.push('/artist/dashboard');
        break;
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const updateProfileData = (data: Partial<typeof profileData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
  };

  const handleEdit = (step: string) => {
    switch (step) {
      case 'artistDetails':
        setCurrentStep('artistDetails');
        break;
      case 'performanceDetails':
        setCurrentStep('performanceDetails');
        break;
      case 'contactPricing':
        setCurrentStep('contactPricing');
        break;
      case 'videosSocial':
        setCurrentStep('videosSocial');
        break;
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    router.push('/artist/dashboard');
  };

  const handleAddAnotherProfile = () => {
    setShowSuccessModal(false);
    setCurrentStep('overview');
    setProfileData({
      profilePhoto: null,
      avatarUrl: "",
      stageName: '',
      artistType: '',
      subArtistType: '',
      achievements: '',
      yearsOfExperience: '',
      shortBio: '',
      performingLanguages: [],
      performingEventTypes: [],
      performingStates: [],
      performingDurationFrom: '',
      performingDurationTo: '',
      performingMembers: '',
      offStageMembers: '',
      contactNumber: '',
      whatsappNumber: '',
      sameAsContact: false,
      email: '',
      soloChargesFrom: '',
      soloChargesTo: '',
      soloDescription: '',
      backingChargesFrom: '',
      backingChargesTo: '',
      backingDescription: '',
      youtubeConnected: false,
      instagramConnected: false,
      youtubeChannelId: '',
      instagramAccountId: '',
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <ProfileOverview
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
          />
        );
      case 'artistDetails':
        return (
          <ArtistProfileDetails
            data={profileData}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            onUpdateData={updateProfileData}
          />
        );
      case 'performanceDetails':
        return (
          <PerformanceDetails
            data={profileData}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            onUpdateData={updateProfileData}
          />
        );
      case 'contactPricing':
        return (
          <ContactPricingDetails
            data={profileData}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            onUpdateData={updateProfileData}
          />
        );
      case 'videosSocial':
        return (
          <VideosSocialMedia
            data={profileData}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            onUpdateData={updateProfileData}
          />
        );
      case 'review':
        return (
          <ProfileReview
            data={profileData}
            onNext={handleNext}
            onBack={handleBack}
            onEdit={handleEdit}
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
              className="px-6 py-2 bg-gradient-to-r from-primary-pink to-primary-orange text-white rounded-lg"
            >
              Continue
            </button>
          </div>
        );
    }
  };

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
