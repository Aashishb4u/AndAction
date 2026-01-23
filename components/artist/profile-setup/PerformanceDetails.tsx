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

  // State dropdown visibility
  const [showStatesDropdown, setShowStatesDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Toggle a single state selection
  const toggleStateSelection = (stateValue: string) => {
    const current = formData.performingStates;
    let updated: string[];
    if (current.includes(stateValue)) {
      updated = current.filter((s) => s !== stateValue);
    } else {
      updated = [...current, stateValue];
    }
    handleInputChange('performingStates', updated);
  };

  // Toggle all states
  const toggleAllStates = () => {
    const allValues = states.map((s) => s.value);
    if (formData.performingStates.length === states.length) {
      // Deselect all
      handleInputChange('performingStates', []);
    } else {
      // Select all
      handleInputChange('performingStates', allValues);
    }
  };

  const handleNext = () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    
    if (!formData.performingLanguages || formData.performingLanguages.length === 0) {
      newErrors.performingLanguages = 'Performing language is required';
    }
    if (!formData.performingEventTypes || formData.performingEventTypes.length === 0) {
      newErrors.performingEventTypes = 'Performing event type is required';
    }
    if (!formData.performingStates || formData.performingStates.length === 0) {
      newErrors.performingStates = 'Performing states is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return; // Don't proceed if there are errors
    }

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
              Tell us about your performance preferences, including languages, event types, and team size.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Performing Languages */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block section-text">Performing language*</label>
                <button className="text-blue">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <Select
                placeholder="Select languages"
                value={formData.performingLanguages[0] || ''}
                onChange={(value) => handleInputChange('performingLanguages', [value])}
                options={languages}
              />
              {errors.performingLanguages && <p className="text-red-500 text-sm mt-1">{errors.performingLanguages}</p>}
            </div>

            {/* Performing Event Type */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block section-text">Performing event type*</label>
                <button className="text-blue">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <Select
                placeholder="Select event type"
                value={formData.performingEventTypes[0] || ''}
                onChange={(value) => handleInputChange('performingEventTypes', [value])}
                options={eventTypes}
              />
              {errors.performingEventTypes && <p className="text-red-500 text-sm mt-1">{errors.performingEventTypes}</p>}
            </div>

            {/* Performing States - Multi-select */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <label className="block section-text">Performing states*</label>
                <button className="text-blue">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setShowStatesDropdown(!showStatesDropdown)}
                className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
              >
                <span className={formData.performingStates.length > 0 ? 'text-white' : 'text-text-gray'}>
                  {formData.performingStates.length > 0
                    ? formData.performingStates.length === states.length
                      ? 'All States'
                      : `${formData.performingStates.length} state${formData.performingStates.length > 1 ? 's' : ''} selected`
                    : 'Select states'}
                </span>
                <svg
                  className={`w-5 h-5 text-text-gray transition-transform ${showStatesDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {showStatesDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-64 overflow-auto">
                  {/* All States checkbox */}
                  <label className="flex items-center gap-3 px-4 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
                    <input
                      type="checkbox"
                      checked={formData.performingStates.length === states.length}
                      onChange={toggleAllStates}
                      className="w-4 h-4 accent-primary-pink rounded"
                    />
                    <span className="text-white font-medium">All States</span>
                  </label>
                  
                  {/* Individual state checkboxes */}
                  {states.map((state) => (
                    <label
                      key={state.value}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-background-light cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.performingStates.includes(state.value)}
                        onChange={() => toggleStateSelection(state.value)}
                        className="w-4 h-4 accent-primary-pink rounded"
                      />
                      <span className="text-white text-sm">{state.label}</span>
                    </label>
                  ))}
                </div>
              )}              {errors.performingStates && <p className="text-red-500 text-sm mt-1">{errors.performingStates}</p>}            </div>

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
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="From"
                    value={formData.performingDurationFrom}
                    onChange={(e) => handleInputChange('performingDurationFrom', e.target.value)}
                    variant="filled"
                  />
                </div>
                <span className="mx-2 text-lg text-gray-400 select-none">—</span>
                <div className="flex-1">
                  <Input
                    placeholder="To"
                    value={formData.performingDurationTo}
                    onChange={(e) => handleInputChange('performingDurationTo', e.target.value)}
                    variant="filled"
                  />
                </div>
              </div>
            </div>

            {/* Performing Members */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block section-text">Performing members</label>
                <button className="text-blue">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <Select
                placeholder="Select members"
                value={formData.performingMembers}
                onChange={(value) => handleInputChange('performingMembers', value)}
                options={memberOptions}
              />
            </div>

            {/* Off Stage Members */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block section-text">Off stage members</label>
                <button className="text-blue">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <Select
                placeholder="Select members"
                value={formData.offStageMembers}
                onChange={(value) => handleInputChange('offStageMembers', value)}
                options={memberOptions}
              />
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
