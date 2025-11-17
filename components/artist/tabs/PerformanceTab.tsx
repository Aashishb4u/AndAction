'use client';

import React, { useState } from 'react';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Info } from 'lucide-react';
import { Artist } from '@/types';
import { useSession } from "next-auth/react";
import { updateArtistProfile } from '@/lib/helper';

interface PerformanceTabProps {
  artist: Artist;
}

const performingLanguageOptions = [
  { value: 'hindi', label: 'Hindi' },
  { value: 'english', label: 'English' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'punjabi', label: 'Punjabi' }
];

const eventTypeOptions = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'birthday', label: 'Birthday Party' },
  { value: 'festival', label: 'Festival' },
  { value: 'concert', label: 'Concert' },
  { value: 'private-party', label: 'Private Party' },
  { value: 'cultural', label: 'Cultural Event' },
  { value: 'religious', label: 'Religious Event' }
];

const performingStatesOptions = [
  { value: 'gujarat-rajasthan-maharashtra', label: 'Gujarat, Rajasthan, Maharashtra' },
  { value: 'gujarat-maharashtra', label: 'Gujarat, Maharashtra' },
  { value: 'gujarat-rajasthan', label: 'Gujarat, Rajasthan' },
  { value: 'gujarat', label: 'Gujarat' },
  { value: 'rajasthan', label: 'Rajasthan' },
  { value: 'maharashtra', label: 'Maharashtra' },
];

const performingMembersOptions = [
  { value: '1', label: '1 member' },
  { value: '2', label: '2 members' },
  { value: '3', label: '3 members' },
  { value: '4', label: '4 members' },
  { value: '5', label: '5+ members' },
];

const offStageMembersOptions = [
  { value: '0', label: '0 members' },
  { value: '1', label: '1 member' },
  { value: '2', label: '2 members' },
  { value: '3', label: '3 members' },
  { value: '4', label: '4+ members' },
];

const PerformanceTab: React.FC<PerformanceTabProps> = ({ artist }) => {
  const { data: session, update } = useSession();
  const [formData, setFormData] = useState({
    performingLanguage: artist.performingLanguage || "",
    eventType: artist.performingEventType || "",
    performingStates: artist.performingStates
    ? artist.performingStates.charAt(0).toUpperCase() +
      artist.performingStates.slice(1).toLowerCase()
    : "",
    minDuration: artist.performingDurationFrom || "",
    maxDuration: artist.performingDurationTo || "",
    performingMembers: artist.performingMembers || "",
    offStageMembers: artist.offStageMembers || "",
  });


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
  try {
    const payload = {
      userId: session?.user?.id,

      performingLanguage: formData.performingLanguage,
      performingEventType: formData.eventType,
      performingStates: formData.performingStates,
      performingDurationFrom: formData.minDuration,
      performingDurationTo: formData.maxDuration,
      performingMembers: formData.performingMembers,
      offStageMembers: formData.offStageMembers,
    };

    await updateArtistProfile(payload);

    // refresh session
    await update({
      user: {
        ...session!.user,
        artistProfile: {
          ...session!.user.artistProfile,
          ...payload,
        },
      },
    });

    alert("Performance details updated!");
  } catch (error) {
    alert("Failed to update performance details");
  }
};
  const handleReset = () => {
    setFormData({
      performingLanguage: 'english-hindi-gujarati',
      eventType: 'party-concert-events',
      performingStates: 'gujarat-rajasthan-maharashtra',
      minDuration: '120',
      maxDuration: '160',
      performingMembers: '2',
      offStageMembers: '0',
    });
  };

  return (
    <div className="md:space-y-5 space-y-4 pb-24 md:pb-0">
      {/* Performing Language */}
      <div className="relative">
        <Select
          label="Performing language"
          options={performingLanguageOptions}
          value={formData.performingLanguage}
          onChange={(value) => handleInputChange('performingLanguage', value)}
          required
        />
        <Info size={16} className="absolute top-0 right-0 text-blue" />
      </div>

      {/* Performing Event Type */}
      <div className="relative">
        <Select
          label="Performing event type"
          options={eventTypeOptions}
          value={formData.eventType}
          onChange={(value) => handleInputChange('eventType', value)}
          required
        />
        <Info size={16} className="absolute top-0 right-0 text-blue" />
      </div>

      {/* Performing States */}
      <div className="relative">
        <Input
          label="Performing states"
          value={formData.performingStates}
          onChange={(e) => handleInputChange('performingStates', e.target.value)}
          placeholder="Enter state(s)"
          required
        />

        <Info size={16} className="absolute top-0 right-0 text-blue" />
      </div>

      {/* Performing Duration */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Performing duration <span className="text-text-gray">(in minutes)</span>
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="grid grid-cols-2 gap-6">
            <Input
              value={formData.minDuration}
              onChange={(e) => handleInputChange('minDuration', e.target.value)}
              placeholder="120 mins"
              required
            />
            <Input
              value={formData.maxDuration}
              onChange={(e) => handleInputChange('maxDuration', e.target.value)}
              placeholder="160 mins"
              required
            />
          </div>
          <Info size={16} className="absolute top-4 right-4 text-text-gray" />
        </div>
      </div>

      {/* Performing Members and Off Stage Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performing Members */}
        <div className="relative">
          <Select
            label="Performing members"
            options={performingMembersOptions}
            value={formData.performingMembers}
            onChange={(value) => handleInputChange('performingMembers', value)}
            required
          />
          <Info size={16} className="absolute top-0 right-0 text-blue" />
        </div>

        {/* Off Stage Members */}
        <div className="relative">
          <Select
            label="Off stage members"
            options={offStageMembersOptions}
            value={formData.offStageMembers}
            onChange={(value) => handleInputChange('offStageMembers', value)}
            required
          />
          <Info size={16} className="absolute top-0 right-0 text-blue" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex md:justify-end gap-4 items-center md:pt-5 p-4 fixed md:static bottom-0 left-0 right-0 bg-card md:bg-transparent">
        <Button
          variant="secondary"
          onClick={handleReset}
          className='w-full md:w-auto text-xs! md:text-base'

        >
          <span className='gradient-text'>Reset</span>
        </Button>

        <Button
          variant="primary"
          onClick={handleSave}
          className="w-full md:w-auto text-xs! md:text-base"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default PerformanceTab;