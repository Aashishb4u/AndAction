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

type ProfileSetupStep = 'overview' | 'artistDetails' | 'performanceDetails' | 'contactPricing' | 'videosSocial' | 'review';

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>('overview');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  // Form data states
  const [profileData, setProfileData] = useState({
    // Artist Profile Details
    profilePhoto: null as File | null,
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

  const handleNext = () => {
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
        // Show success modal
        setShowSuccessModal(true);
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
    // Reset form and start over
    setCurrentStep('overview');
    setProfileData({
      profilePhoto: null,
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
            <p className="text-text-gray mb-6">This step is under development.</p>
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        // onClose={() => setShowSuccessModal(false)}
        onGoToDashboard={handleGoToDashboard}
        onAddAnotherProfile={handleAddAnotherProfile}
      />
    </div>
  );
}
