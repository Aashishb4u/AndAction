'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { ArtistProfileSetupData } from '@/types';

interface ArtistProfileDetailsProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<ArtistProfileSetupData>) => void;
}

const ArtistProfileDetails: React.FC<ArtistProfileDetailsProps> = ({
  data,
  onNext,
  onSkip,
  onBack,
  onUpdateData
}) => {

  const [formData, setFormData] = useState({
    profilePhoto: data.profilePhoto || null,
    avatarUrl: (data as any).avatarUrl || "", // allow avatar url injection
    stageName: data.stageName || '',
    artistType: data.artistType || '',
    subArtistType: data.subArtistType || '',
    achievements: data.achievements || '',
    yearsOfExperience: data.yearsOfExperience || '',
    shortBio: data.shortBio || ''
  });

  const [preview, setPreview] = useState<string | null>(
    formData.profilePhoto
      ? URL.createObjectURL(formData.profilePhoto)
      : formData.avatarUrl || null
  );

  const [uploading, setUploading] = useState<boolean>(false);

  const artistTypes = [
    { value: 'singer', label: 'Singer' },
    { value: 'dancer', label: 'Dancer' },
    { value: 'musician', label: 'Musician' },
    { value: 'comedian', label: 'Comedian' },
    { value: 'magician', label: 'Magician' },
    { value: 'actor', label: 'Actor' },
    { value: 'other', label: 'Other' }
  ];

  const subArtistTypes = [
    { value: 'classical', label: 'Classical' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'folk', label: 'Folk' },
    { value: 'bollywood', label: 'Bollywood' },
    { value: 'western', label: 'Western' },
    { value: 'fusion', label: 'Fusion' }
  ];

  const experienceYears = [
    { value: '1', label: '0-1 years' },
    { value: '2', label: '1-3 years' },
    { value: '3', label: '3-5 years' },
    { value: '4', label: '5-10 years' },
    { value: '5', label: '10+ years' }
  ];

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdateData(updatedData);
  };

  const handleProfilePhotoUpload = async (file: File) => {
    console.log("⬆️ Uploading file to /api/media/upload...");
    try {
      setUploading(true);
      setPreview(URL.createObjectURL(file));

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const json = await res.json();

      if (!res.ok) {
        console.error(json.message);
        setUploading(false);
        return;
      }

      const imageUrl = json?.data?.imageUrl;

      const updatedData = {
        profilePhoto: file,
        avatarUrl: imageUrl,
      };

      setFormData((prev) => ({ ...prev, ...updatedData }));

      onUpdateData(updatedData);

      setUploading(false);
    } catch (error) {
      console.error("Profile photo upload failed:", error);
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("📸 File selected:", file);
    handleProfilePhotoUpload(file);
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

            <div className="w-full bg-[#2D2D2D] rounded-full h-1 mb-6">
              <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-1/4"></div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0">
                <Image src="/icons/user.svg" alt="Artist Profile" width={25} height={25} />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Artist Profile Details</h2>
              </div>
            </div>

            <p className="text-text-gray text-sm text-left">
              Build your artist profile to get discovered.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">

            {/* Profile Photo Upload */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="max-w-[150px] bg-card border border-dashed border-border-color rounded-md flex flex-col gap-3 text-center items-center justify-center px-3 py-10">

                  {preview ? (
                    <Image
                      src={preview}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      width={100}
                      height={100}
                    />
                  ) : (
                    <Image src={`/icons/user-icon.svg`} alt="Profile" width={50} height={50} />
                  )}

                  {uploading ? (
                    <p className="text-text-gray text-sm">Uploading...</p>
                  ) : (
                    <p className="text-text-gray secondary-text">Upload Profile Photo</p>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Stage Name */}
            <div>
              <Input
                label="Stage name*"
                placeholder="Enter your stage name"
                value={formData.stageName}
                onChange={(e) => handleInputChange('stageName', e.target.value)}
                variant="filled"
              />
            </div>

            {/* Artist Type */}
            <div>
              <Select
                label="Artist type*"
                placeholder="Select or write artist type"
                value={formData.artistType}
                onChange={(value) => handleInputChange('artistType', value)}
                options={artistTypes}
              />
            </div>

            {/* Sub Artist Type */}
            <div>
              <Select
                label="Sub-Artist type"
                placeholder="Select sub-artist type"
                value={formData.subArtistType}
                onChange={(value) => handleInputChange('subArtistType', value)}
                options={subArtistTypes}
              />
            </div>

            {/* Achievements + Experience */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Achievements / Awards"
                placeholder="Enter achievements"
                value={formData.achievements}
                onChange={(e) => handleInputChange('achievements', e.target.value)}
                variant="filled"
              />

              <Select
                label="Years of experience*"
                placeholder="Select no. of years"
                value={formData.yearsOfExperience}
                onChange={(value) => handleInputChange('yearsOfExperience', value)}
                options={experienceYears}
              />
            </div>

            {/* Short Bio */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Short bio*</label>
              <textarea
                placeholder="Write a short bio about yourself..."
                value={formData.shortBio}
                onChange={(e) => handleInputChange('shortBio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color md:px-6 px-5 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <Button variant="secondary" size="md" onClick={onSkip} className="gradient-text hover:bg-card">
            Skip & Next
          </Button>
          <Button variant="primary" size="md" onClick={handleNext}>
            Save & Next
          </Button>
        </div>
      </div>

    </div>
  );
};

export default ArtistProfileDetails;
