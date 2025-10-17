'use client';

import React, { useState } from 'react';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Info } from 'lucide-react';
import { Artist } from '@/types';

interface PerformanceTabProps {
  artist: Artist;
}

const performingLanguageOptions = [
  { value: 'english-hindi-gujarati', label: 'English, Hindi, Gujarati' },
  { value: 'english-hindi', label: 'English, Hindi' },
  { value: 'hindi-gujarati', label: 'Hindi, Gujarati' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'gujarati', label: 'Gujarati' },
];

const eventTypeOptions = [
  { value: 'party-concert-events', label: 'Party, Concert, Events' },
  { value: 'party-concert', label: 'Party, Concert' },
  { value: 'concert-events', label: 'Concert, Events' },
  { value: 'party', label: 'Party' },
  { value: 'concert', label: 'Concert' },
  { value: 'events', label: 'Events' },
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

const PerformanceTab: React.FC<PerformanceTabProps> = () => {
  const [formData, setFormData] = useState({
    performingLanguage: 'english-hindi-gujarati',
    eventType: 'party-concert-events',
    performingStates: 'gujarat-rajasthan-maharashtra',
    minDuration: '120',
    maxDuration: '160',
    performingMembers: '2',
    offStageMembers: '0',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    console.log('Saving performance data:', formData);
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
        <Select
          label="Performing states"
          options={performingStatesOptions}
          value={formData.performingStates}
          onChange={(value) => handleInputChange('performingStates', value)}
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
