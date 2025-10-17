'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { ArtistProfileSetupData } from '@/types';

interface VideosSocialMediaProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<ArtistProfileSetupData>) => void;
}

const VideosSocialMedia: React.FC<VideosSocialMediaProps> = ({
  data,
  onNext,
  onSkip,
  onBack,
  onUpdateData
}) => {
  const [formData, setFormData] = useState({
    youtubeConnected: data.youtubeConnected || false,
    instagramConnected: data.instagramConnected || false,
    youtubeChannelId: data.youtubeChannelId || '',
    instagramAccountId: data.instagramAccountId || ''
  });

  const handleConnect = (platform: 'youtube' | 'instagram') => {
    // Simulate connection process
    const updatedData = {
      ...formData,
      [`${platform}Connected`]: true,
      [`${platform}ChannelId`]: `mock_${platform}_id_${Date.now()}`
    };

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
          <div className="text-center mb-12">
            <h1 className="h2 text-white mb-2 hidden md:block">Profile setup</h1>

            {/* Progress Bar */}
            <div className="w-full bg-[#2D2D2D] rounded-full h-1 mb-6">
              <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-full"></div>
            </div>

            {/* Step Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0">
                <Image src="/icons/video.svg" alt="Videos & Social Media" width={25} height={25} />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Videos & Social media</h2>
              </div>
            </div>
            <p className="text-text-gray text-sm text-left">
              Connect your YouTube and Instagram account to import your videos & reels.
            </p>
          </div>

          {/* Social Media Connections */}
          <div className="space-y-6">
            {/* YouTube Channel */}
            <div className="bg-card border border-border-color rounded-xl p-6">
              <div className="flex items-start gap-4">
                {/* YouTube Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-white btn1 mb-1">YouTube Channel</h3>
                  <p className="text-text-gray secondary-text mb-4">
                    Import all videos & shorts from your YouTube channel
                  </p>


                </div>

              </div>
              {formData.youtubeConnected ? (
                <div className="flex items-center justify-center text-center gap-2 text-green-500 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Connected
                </div>
              ) : (
                <button
                  onClick={() => handleConnect('youtube')}
                  className="w-full py-2 text-sm bg-white rounded-full font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  <span className='gradient-text'>
                    Connect YouTube
                  </span>
                </button>
              )}
            </div>

            {/* Instagram Account */}
            <div className="bg-card border border-border-color rounded-xl p-6">
              <div className="flex items-start gap-4">
                {/* Instagram Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-white btn1 mb-1">Instagram Account</h3>
                  <p className="text-text-gray secondary-text mb-4">
                    Import all reels from your Instagram account
                  </p>

                </div>
              </div>
              {formData.instagramConnected ? (
                <div className="flex items-center justify-center text-center gap-2 text-green-500 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Connected
                </div>
              ) : (
                <button
                  onClick={() => handleConnect('instagram')}
                  className="w-full py-2 text-sm bg-white rounded-full font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  <span className='gradient-text'>
                    Connect Instagram
                  </span>
                </button>
              )}
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

export default VideosSocialMedia;
