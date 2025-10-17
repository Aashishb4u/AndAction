'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { ArtistProfileSetupData } from '@/types';

interface PerformanceDetailsProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<ArtistProfileSetupData>) => void;
}

const PerformanceDetails: React.FC<PerformanceDetailsProps> = ({
  data,
  onNext,
  onSkip,
  onBack,
  onUpdateData
}) => {
  const [formData, setFormData] = useState({
    performingLanguages: data.performingLanguages || [],
    performingEventTypes: data.performingEventTypes || [],
    performingStates: data.performingStates || [],
    performingDurationFrom: data.performingDurationFrom || '',
    performingDurationTo: data.performingDurationTo || '',
    performingMembers: data.performingMembers || '',
    offStageMembers: data.offStageMembers || ''
  });

  const languages = [
    { value: 'hindi', label: 'Hindi' },
    { value: 'english', label: 'English' },
    { value: 'marathi', label: 'Marathi' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'punjabi', label: 'Punjabi' }
  ];

  const eventTypes = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'birthday', label: 'Birthday Party' },
    { value: 'festival', label: 'Festival' },
    { value: 'concert', label: 'Concert' },
    { value: 'private-party', label: 'Private Party' },
    { value: 'cultural', label: 'Cultural Event' },
    { value: 'religious', label: 'Religious Event' }
  ];

  const states = [
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'tamil-nadu', label: 'Tamil Nadu' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'uttar-pradesh', label: 'Uttar Pradesh' },
    { value: 'west-bengal', label: 'West Bengal' },
    { value: 'punjab', label: 'Punjab' },
    { value: 'haryana', label: 'Haryana' }
  ];

  const memberOptions = [
    { value: '1', label: '1 Member' },
    { value: '2-5', label: '2-5 Members' },
    { value: '6-10', label: '6-10 Members' },
    { value: '11-20', label: '11-20 Members' },
    { value: '20+', label: '20+ Members' }
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdateData(updatedData);
  };

  const handleNext = () => {
    onUpdateData(formData);
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className='hidden md:block'>Back</span>
          <span className='md:hidden h2'>Profile Setup</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-32">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="h2 text-white mb-2 hidden md:block">Profile setup</h1>

            {/* Progress Bar */}
            <div className="w-full bg-[#2D2D2D] rounded-full h-1 mb-6">
              <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-2/4"></div>
            </div>

            {/* Step Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0">
                <Image src="/icons/play.svg" alt="Artist Profile" width={25} height={25} />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Performance Details</h2>
              </div>
            </div>
            <p className="text-text-gray text-sm text-left">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Performing Languages */}
            <div className="relative">
              <Select
                label="Performing language*"
                placeholder="Select languages"
                value={formData.performingLanguages[0] || ''}
                onChange={(value) => handleInputChange('performingLanguages', [value])}
                options={languages}
              />
              <button className="absolute top-0 right-0 text-blue p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Performing Event Type */}
            <div className="relative">
              <Select
                label="Performing event type*"
                placeholder="Select event type"
                value={formData.performingEventTypes[0] || ''}
                onChange={(value) => handleInputChange('performingEventTypes', [value])}
                options={eventTypes}
              />
              <button className="absolute top-0 right-0 text-blue p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Performing States */}
            <div className="relative">
              <Select
                label="Performing states*"
                placeholder="Select states"
                value={formData.performingStates[0] || ''}
                onChange={(value) => handleInputChange('performingStates', [value])}
                options={states}
              />
              <button className="absolute top-0 right-0 text-blue p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Performing Duration */}
            <div className="relative">
              <label className="block text-sm font-medium text-white mb-2">
                Performing duration (in minutes)
                <button className="ml-2 text-blue">
                  <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="From"
                  value={formData.performingDurationFrom}
                  onChange={(e) => handleInputChange('performingDurationFrom', e.target.value)}
                  variant="filled"
                />
                <Input
                  placeholder="To"
                  value={formData.performingDurationTo}
                  onChange={(e) => handleInputChange('performingDurationTo', e.target.value)}
                  variant="filled"
                />
              </div>
            </div>

            {/* Performing Members */}
            <div className="relative">
              <Select
                label="Performing members"
                placeholder="Select members"
                value={formData.performingMembers}
                onChange={(value) => handleInputChange('performingMembers', value)}
                options={memberOptions}
              />
              <button className="absolute top-0 right-0 text-blue p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Off Stage Members */}
            <div className="relative">
              <Select
                label="Off stage members"
                placeholder="Select members"
                value={formData.offStageMembers}
                onChange={(value) => handleInputChange('offStageMembers', value)}
                options={memberOptions}
              />
              <button className="absolute top-0 right-0 text-blue p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color md:px-6 px-5 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="md"
            onClick={onSkip}
            className="gradient-text hover:bg-card"
          >
            Skip & Next
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
          >
            Save & Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetails;
