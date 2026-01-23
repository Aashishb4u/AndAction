'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import imageCompression from "browser-image-compression";
import { ArtistProfileSetupData } from '@/types';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';

interface ArtistProfileDetailsProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<ArtistProfileSetupData>) => void;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};

const ArtistProfileDetails: React.FC<ArtistProfileDetailsProps> = ({
  data,
  onNext,
  onSkip,
  onBack,
  onUpdateData
}) => {

  const [formData, setFormData] = useState({
    profilePhoto: data.profilePhoto || null,
    avatarUrl: (data as any).avatarUrl || "",
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

  // Cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-artist suggestions (persisted in localStorage)
  const defaultSubTypes = ['Classical', 'Contemporary', 'Folk', 'Bollywood', 'Western', 'Fusion'];
  const [subArtistSuggestions, setSubArtistSuggestions] = useState<string[]>(defaultSubTypes);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const artistTypes = [
    { value: 'singer', label: 'Singer' },
    { value: 'dancer', label: 'Dancer' },
    { value: 'musician', label: 'Musician' },
    { value: 'comedian', label: 'Comedian' },
    { value: 'magician', label: 'Magician' },
    { value: 'actor', label: 'Actor' },
    { value: 'anchor', label: 'Anchor'},
    { value: 'band', label: 'Live Band'},
    { value: 'dj', label: 'DJ'},
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

  // Persist suggestions to localStorage
  const persistSuggestions = (items: string[]) => {
    try {
      localStorage.setItem('subArtistTypes', JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  };

  // Add new suggestion if not exists
  const addSuggestionIfNew = (value: string) => {
    const v = value?.trim();
    if (!v) return;
    if (!subArtistSuggestions.includes(v)) {
      const next = [v, ...subArtistSuggestions].slice(0, 50);
      setSubArtistSuggestions(next);
      persistSuggestions(next);
    }
  };

  // Load suggestions on mount (ensure merged with defaults)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('subArtistTypes');
      if (raw) {
        const items: string[] = JSON.parse(raw);
        // merge saved and defaults
        const merged = Array.from(new Set([...items, ...defaultSubTypes]));
        setSubArtistSuggestions(merged);
      }
    } catch (e) {
      // On error, keep defaults
      setSubArtistSuggestions(defaultSubTypes);
    }
  }, []);

  const handleProfilePhotoUpload = async (file: File) => {
  console.log("⬇️ Original file:", file);

  try {
    setUploading(true);

    // 1️⃣ Compress the file before uploading
    const options = {
      maxSizeMB: 1,            // compress to ~1MB
      maxWidthOrHeight: 800,   // resize if larger
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);

    console.log("📦 Compressed file:", compressedFile);

    // 2️⃣ Show preview using compressed file
    setPreview(URL.createObjectURL(compressedFile));

    // 3️⃣ Build form data
    const formDataUpload = new FormData();
    formDataUpload.append("file", compressedFile);

    // 4️⃣ Upload compressed image
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
      profilePhoto: compressedFile,
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

  // Handle file selection - opens crop modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("📸 File selected:", file);
    
    // Create URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropModal(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle crop completion
  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) return;
      
      // Convert blob to file
      const croppedFile = new File([croppedBlob], 'cropped-profile.jpg', { type: 'image/jpeg' });
      
      setShowCropModal(false);
      setImageToCrop(null);
      
      // Upload the cropped image
      handleProfilePhotoUpload(croppedFile);
    } catch (error) {
      console.error('Crop failed:', error);
    }
  };

  // Cancel cropping
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNext = () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    
    if (!formData.stageName?.trim()) {
      newErrors.stageName = 'Stage name is required';
    }
    if (!formData.artistType) {
      newErrors.artistType = 'Artist type is required';
    }
    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = 'Years of experience is required';
    }
    if (!formData.shortBio?.trim()) {
      newErrors.shortBio = 'Short bio is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return; // Don't proceed if there are errors
    }

    // Persist sub-artist type into suggestions if new
    if (formData.subArtistType) {
      addSuggestionIfNew(formData.subArtistType);
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
                <div className="w-[150px] h-[150px] bg-card border border-dashed border-border-color rounded-md flex flex-col gap-3 text-center items-center justify-center overflow-hidden">

                  {preview ? (
                    <Image
                      src={preview}
                      alt="Profile"
                      className="w-full h-full object-contain"
                      width={150}
                      height={150}
                      unoptimized
                    />
                  ) : (
                    <>
                      <Image src={`/icons/user-icon.svg`} alt="Profile" width={50} height={50} />
                      <p className="text-text-gray secondary-text px-2">Upload Profile Photo</p>
                    </>
                  )}
                </div>

                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                    <p className="text-white text-sm">Uploading...</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
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
              {errors.stageName && <p className="text-red-500 text-sm mt-1">{errors.stageName}</p>}
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
              {errors.artistType && <p className="text-red-500 text-sm mt-1">{errors.artistType}</p>}
            </div>

            {/* Sub Artist Type (text input with suggestions) */}
            <div className="relative">
              <label className="block text-sm font-medium text-white mb-2">Sub-Artist type</label>
              <input
                type="text"
                placeholder="e.g. Classical, Bollywood, Fusion"
                value={formData.subArtistType}
                onChange={(e) => {
                  const v = e.target.value;
                  handleInputChange('subArtistType', v);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-48 overflow-auto">
                  {subArtistSuggestions.filter(s => s.toLowerCase().includes((formData.subArtistType || '').toLowerCase())).length === 0 ? (
                    <div className="px-3 py-2 text-sm text-text-gray">No suggestions</div>
                  ) : (
                    subArtistSuggestions
                      .filter(s => s.toLowerCase().includes((formData.subArtistType || '').toLowerCase()))
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); }}
                          onClick={() => {
                            handleInputChange('subArtistType', s);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm"
                        >
                          {s}
                        </button>
                      ))
                  )}
                </div>
              )}
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
              {errors.yearsOfExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience}</p>}
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
              {errors.shortBio && <p className="text-red-500 text-sm mt-1">{errors.shortBio}</p>}
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

      {/* Crop Modal */}
      {showCropModal && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-card border border-border-color rounded-xl w-[90vw] max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-color">
              <h3 className="text-white font-semibold">Crop Image</h3>
              <button 
                onClick={handleCropCancel}
                className="text-text-gray hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Crop Area */}
            <div className="relative h-[300px] bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom Slider */}
            <div className="p-4 border-t border-border-color">
              <label className="block text-text-gray text-sm mb-2">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-[#2D2D2D] rounded-lg appearance-none cursor-pointer accent-primary-pink"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 border-t border-border-color">
              <Button 
                variant="secondary" 
                size="md" 
                onClick={handleCropCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="md" 
                onClick={handleCropSave}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ArtistProfileDetails;
