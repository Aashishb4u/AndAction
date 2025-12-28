'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

interface ProfileOverviewProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({ onNext, onSkip, onBack }) => {
  const profileSteps = [
    {
      icon: (
        <Image src="/icons/user.svg" alt="Artist Profile" width={30} height={30} />
      ),
      title: 'Artist Profile Details',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc'
    },
    {
      icon: (
        <Image src="/icons/play.svg" alt="Artist Profile" width={30} height={30} />
      ),
      title: 'Performance Details',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc'
    },
    {
      icon: (
        <Image src="/icons/phone.svg" alt="Artist Profile" width={30} height={30} />
      ),
      title: 'Contact & Pricing Details',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc'
    },
    {
      icon: (
        <Image src="/icons/video.svg" alt="Artist Profile" width={30} height={30} />
      ),
      title: 'Videos & Social Media',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-primary-pink transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className='hidden md:block'>Back</span>
          <span className='md:hidden h2'>Profile Setup</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center md:justify-center px-6 pb-32">
        <div className="max-w-md w-full md:text-center space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-white hidden md:block">Profile setup</h1>
            <p className="h1">Hello are you ready to Setup your profile
            </p>
          </div>

          {/* Profile Steps */}
          <div className="space-y-5">
            {profileSteps.map((step, index) => (
              <div key={index}>
                <div className="flex items-start gap-4 text-left">
                  <div className="flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{step.title}</h3>
                    <p className="text-text-gray text-sm">{step.description}</p>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mt-5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color px-5 py-4">
        <p className="text-text-gray footnote mb-4">It only takes 5-10 min and you can edit it later. We’ll save as you go.</p>
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="md"
            onClick={onSkip}
          >
            <span className='gradient-text'>Skip & Next</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onNext}
          >
            Save & Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;
