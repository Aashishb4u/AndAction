'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import DateInput from '@/components/ui/DateInput';
import Button from '@/components/ui/Button';

export interface FindArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  artistCategory: string;
  subCategory: string;
  artistGender: string;
  budget: string;
  eventState: string;
  eventDate: string;
  eventType: string;
  performingLanguage: string;
}

const FindArtistModal: React.FC<FindArtistModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    artistCategory: '',
    subCategory: '',
    artistGender: '',
    budget: '',
    eventState: '',
    eventDate: '',
    eventType: '',
    performingLanguage: '',
  });

  // Form options
  const artistCategories = [
    { value: 'singer', label: 'Singer' },
    { value: 'dancer', label: 'Dancer' },
    { value: 'musician', label: 'Musician' },
    { value: 'comedian', label: 'Comedian' },
    { value: 'magician', label: 'Magician' },
  ];

  const subCategories = [
    { value: 'bollywood', label: 'Bollywood' },
    { value: 'classical', label: 'Classical' },
    { value: 'folk', label: 'Folk' },
    { value: 'western', label: 'Western' },
    { value: 'fusion', label: 'Fusion' },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'any', label: 'Any' },
  ];

  const budgetOptions = [
    { value: '0-10000', label: '₹0 - ₹10,000' },
    { value: '10000-25000', label: '₹10,000 - ₹25,000' },
    { value: '25000-50000', label: '₹25,000 - ₹50,000' },
    { value: '50000-100000', label: '₹50,000 - ₹1,00,000' },
    { value: '100000+', label: '₹1,00,000+' },
  ];

  const stateOptions = [
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'punjab', label: 'Punjab' },
  ];

  const eventTypes = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'birthday', label: 'Birthday Party' },
    { value: 'festival', label: 'Festival' },
    { value: 'concert', label: 'Concert' },
    { value: 'other', label: 'Other' },
  ];

  const languages = [
    { value: 'hindi', label: 'Hindi' },
    { value: 'english', label: 'English' },
    { value: 'marathi', label: 'Marathi' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'punjabi', label: 'Punjabi' },
    { value: 'tamil', label: 'Tamil' },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setFormData({
      artistCategory: '',
      subCategory: '',
      artistGender: '',
      budget: '',
      eventState: '',
      eventDate: '',
      eventType: '',
      performingLanguage: '',
    });
  };

  const handleViewResults = () => {
  const params = new URLSearchParams();

  if (formData.artistCategory) params.set("type", formData.artistCategory);
  if (formData.subCategory) params.set("subType", formData.subCategory);
  if (formData.artistGender) params.set("gender", formData.artistGender);
  if (formData.budget) params.set("budget", formData.budget);
  if (formData.eventState) params.set("state", formData.eventState);
  if (formData.eventType) params.set("eventType", formData.eventType);
  if (formData.performingLanguage) params.set("language", formData.performingLanguage);

  // eventDate not used in API but we still pass it
  if (formData.eventDate) params.set("eventDate", formData.eventDate);

  router.push(`/artists?${params.toString()}`);
};


  const isFormValid = formData.artistCategory && formData.eventDate;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Find your artist"
      size="lg"
      className="max-w-2xl"
      headerClassName="md:px-8 md:py-6 px-4! py-4!"
    >
      <div className="md:px-8 px-4 md:pb-8 pb-4 md:pt-4 pt-4 md:space-y-6 space-y-4">
        {/* Artist Category */}
        <Select
          label="Artist Category"
          placeholder="Select Category"
          options={artistCategories}
          value={formData.artistCategory}
          onChange={(value) => handleInputChange('artistCategory', value)}
          required
        />

        {/* Sub-Category */}
        <Select
          label="Sub-Category"
          placeholder="Select sub-category"
          options={subCategories}
          value={formData.subCategory}
          onChange={(value) => handleInputChange('subCategory', value)}
        />

        {/* Artist Gender and Budget - Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Artist gender"
            placeholder="Select gender"
            options={genderOptions}
            value={formData.artistGender}
            onChange={(value) => handleInputChange('artistGender', value)}
          />

          <Select
            label="Budget"
            placeholder="Select budget"
            options={budgetOptions}
            value={formData.budget}
            onChange={(value) => handleInputChange('budget', value)}
          />
        </div>

        {/* Event State and Event Date - Row */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Event State"
            placeholder="Select State"
            options={stateOptions}
            value={formData.eventState}
            onChange={(value) => handleInputChange('eventState', value)}
          />

          <DateInput
            label="Event date"
            placeholder="DD/MM/YYYY"
            value={formData.eventDate || null}
            onChange={(value) => handleInputChange("eventDate", value)}
            minDate={new Date()}
            required
          />
        </div>

        {/* Event Type */}
        <Select
          label="Event type"
          placeholder="Select event type"
          options={eventTypes}
          value={formData.eventType}
          onChange={(value) => handleInputChange('eventType', value)}
        />

        {/* Performing Language */}
        <Select
          label="Performing language"
          placeholder="Select language"
          options={languages}
          value={formData.performingLanguage}
          onChange={(value) => handleInputChange('performingLanguage', value)}
        />

        {/* Action Buttons */}
        <div className="hidden md:flex gap-4 pt-4 sticky bottom-4 bg-background py-4">
          <Button
            variant="secondary"
            size="md"
            onClick={handleReset}
            className="md:flex-1 text-primary-pink bg-[#1B1B1B]!"
          >
            <span className='gradient-text'>Reset</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleViewResults}
            disabled={!isFormValid}
            className="md:flex-1"
          >
            View result
          </Button>
        </div>
        <div className="flex whitespace-nowrap md:hidden gap-4 pt-4 sticky bottom-4 bg-background py-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="flex-1 text-primary-pink bg-[#1B1B1B]!"
          >
            <span className='gradient-text'>Reset</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleViewResults}
            disabled={!isFormValid}
            className="flex-1"
          >
            View result
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FindArtistModal;
