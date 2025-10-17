'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Info } from 'lucide-react';
import { Artist } from '@/types';

// Extended artist type for profile management
type ExtendedArtist = Artist & {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  pinCode?: string;
  state?: string;
  city?: string;
  shortBio?: string;
};

interface AboutTabProps {
  artist: Artist;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const stateOptions = [
  { value: 'gujarat', label: 'Gujarat' },
  { value: 'maharashtra', label: 'Maharashtra' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'karnataka', label: 'Karnataka' },
  { value: 'tamil-nadu', label: 'Tamil Nadu' },
];

const cityOptions = [
  { value: 'surat', label: 'Surat' },
  { value: 'ahmedabad', label: 'Ahmedabad' },
  { value: 'vadodara', label: 'Vadodara' },
  { value: 'rajkot', label: 'Rajkot' },
];

const subArtistTypeOptions = [
  { value: 'example1', label: 'Example, example, example' },
  { value: 'example2', label: 'Another example' },
  { value: 'example3', label: 'Third example' },
];

const experienceOptions = [
  { value: '1', label: '1 Year' },
  { value: '2', label: '2 Years' },
  { value: '3', label: '3 Years' },
  { value: '4', label: '4 Years' },
  { value: '5', label: '5+ Years' },
];

const AboutTab: React.FC<AboutTabProps> = ({ artist }) => {
  const [formData, setFormData] = useState({
    stageName: artist.name,
    firstName: (artist as ExtendedArtist).firstName || '',
    lastName: (artist as ExtendedArtist).lastName || '',
    dateOfBirth: (artist as ExtendedArtist).dateOfBirth || '',
    gender: artist.gender?.toLowerCase() || '',
    address: (artist as ExtendedArtist).address || '',
    pinCode: (artist as ExtendedArtist).pinCode || '',
    state: (artist as ExtendedArtist).state?.toLowerCase() || '',
    city: (artist as ExtendedArtist).city?.toLowerCase() || '',
    subArtistType: 'example1',
    achievements: Array.isArray(artist.achievements) ? artist.achievements.join(', ') : (artist.achievements || ''),
    yearsOfExperience: artist.yearsOfExperience?.toString() || '4',
    shortBio: artist.bio || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically save the data to your backend
    console.log('Saving artist data:', formData);
    // You can add validation and API calls here
  };

  const handleReset = () => {
    setFormData({
      stageName: artist.name,
      firstName: (artist as ExtendedArtist).firstName || '',
      lastName: (artist as ExtendedArtist).lastName || '',
      dateOfBirth: (artist as ExtendedArtist).dateOfBirth || '',
      gender: artist.gender?.toLowerCase() || '',
      address: (artist as ExtendedArtist).address || '',
      pinCode: (artist as ExtendedArtist).pinCode || '',
      state: (artist as ExtendedArtist).state?.toLowerCase() || '',
      city: (artist as ExtendedArtist).city?.toLowerCase() || '',
      subArtistType: 'example1',
      achievements: Array.isArray(artist.achievements) ? artist.achievements.join(', ') : (artist.achievements || ''),
      yearsOfExperience: artist.yearsOfExperience?.toString() || '4',
      shortBio: artist.bio || '',
    });
  };

  return (
    <div className="md:space-y-5 space-y-4 pb-24 md:pb-0">
      {/* Stage Name */}
      <div className="relative">
        <Input
          label="Stage name"
          value={formData.stageName}
          onChange={(e) => handleInputChange('stageName', e.target.value)}
          required
        />
        <Info size={16} className="absolute top-0 right-0 text-blue" />
      </div>

      {/* First Name and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First name"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          required
        />
        <Input
          label="Last name"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          required
        />
      </div>

      {/* Date of Birth and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Date of birth"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          placeholder="DD / MM / YYYY"
          required
        />
        <Select
          label="Gender"
          options={genderOptions}
          value={formData.gender}
          onChange={(value) => handleInputChange('gender', value)}
          required
        />
      </div>

      {/* Address */}
      <Input
        label="Office/Home full address"
        value={formData.address}
        onChange={(e) => handleInputChange('address', e.target.value)}
        required
      />

      {/* PIN Code, State, City */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="PIN code"
          value={formData.pinCode}
          onChange={(e) => handleInputChange('pinCode', e.target.value)}
          required
        />
        <Select
          label="State"
          options={stateOptions}
          value={formData.state}
          onChange={(value) => handleInputChange('state', value)}
          required
        />
        <Select
          label="City"
          options={cityOptions}
          value={formData.city}
          onChange={(value) => handleInputChange('city', value)}
          required
        />
      </div>

      {/* Sub-Artist Type */}
      <div className="relative">
        <Select
          label="Sub-Artist type"
          options={subArtistTypeOptions}
          value={formData.subArtistType}
          onChange={(value) => handleInputChange('subArtistType', value)}
          required
        />
        <Info size={16} className="absolute top-11 right-11 text-text-gray" />
      </div>

      {/* Achievements and Years of Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Achievements / Awards"
          value={formData.achievements}
          onChange={(e) => handleInputChange('achievements', e.target.value)}
        />
        <div className="relative">
          <Select
            label="Years of experience"
            options={experienceOptions}
            value={formData.yearsOfExperience}
            onChange={(value) => handleInputChange('yearsOfExperience', value)}
            required
          />
          <Info size={16} className="absolute top-11 right-11 text-text-gray" />
        </div>
      </div>

      {/* Short Bio */}
      <Textarea
        label="Short bio"
        value={formData.shortBio}
        onChange={(e) => handleInputChange('shortBio', e.target.value)}
        placeholder="Tell us about yourself..."
        required
        rightIcon={<Info size={16} />}
      />

      {/* Save Button */}
      <div className="flex md:justify-end gap-4 items-center md:pt-5 p-4 fixed md:static bottom-0 left-0 right-0 bg-card md:bg-transparent z-50">
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

export default AboutTab;
