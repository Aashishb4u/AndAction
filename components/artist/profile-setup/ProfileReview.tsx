'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { ArtistProfileSetupData } from '@/types';

interface ProfileReviewProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onBack: () => void;
  onEdit: (step: string) => void;
}

const ProfileReview: React.FC<ProfileReviewProps> = ({
  data,
  onNext,
  onBack,
  onEdit
}) => {
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
        <h1 className="h2 hidden md:block text-white">Profile Setup</h1>
        <div className="w-12"></div>
      </div>

      {/* Content */}
      <div className="flex-1 md:px-6 pb-32">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="md:text-center mb-8 px-6">
            <h2 className="h1 text-white mb-6">All done! Preview profile</h2>

            {/* Success Badge */}
            <div className="flex justify-center mb-6">
              <Image src="/complete-illustration.svg" alt="Success" width={200} height={200} />
            </div>

            <div className="mb-6">
              <p className="text-white btn1 mb-1">Looking good, Harsh!</p>
              <p className="text-text-gray secondary-text">
                Here&apos;s how your profile looks to users. You can edit it anytime.
              </p>
            </div>
          </div>

          {/* Profile Sections */}
          <div className="space-y-6">
            {/* Artist Profile Section */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-card border-y border-border-color px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Image src="/icons/user.svg" alt="Artist Profile" width={25} height={25} />
                    </div>
                    <h3 className="text-white h2">Artist Profile</h3>
                  </div>
                  <Image onClick={() => onEdit('artistDetails')} src="/icons/edit.svg" alt="Verified" width={25} height={25} />
                </div>
              </div>

              {/* Profile Photo - Full Width */}
              <div className="flex justify-center px-6">
                <div className="w-28 h-40 brounded-xl flex items-center justify-center overflow-hidden">
                  {data.profilePhoto ? (
                    <Image
                      src={URL.createObjectURL(data.profilePhoto)}
                      alt="Profile"
                      className="w-full h-full object-cover object-center"
                      width={350}
                      height={650}
                    />
                  ) : (
                    <Image src="/user.png" alt="Artist Profile" width={96} height={96} className="rounded-xl" />
                  )}
                </div>
              </div>


              {/* Details List */}
              <div className="space-y-3 text-sm px-6">
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">Stage Name</span>
                  <span className="text-white">{data.stageName || 'MJ Singer'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">Artist type</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                      {data.artistType || 'Singer'}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">Sub artist type</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                      {data.subArtistType || 'DJ'}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">Achievements / Awards</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                      {data.achievements || 'Singer'}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-gray secondary-text">Years of experience</span>
                  <span className="text-white">{data.yearsOfExperience || '4 years'}</span>
                </div>
              </div>

              {/* Short Bio */}
              <div className="space-y-2 px-6">
                <p className="text-text-gray text-sm">Short bio</p>
                <p className="text-white text-sm leading-relaxed">
                  {data.shortBio || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'}
                </p>
              </div>
            </div>

            {/* Performance Details Section */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-card border-y border-border-color px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-white h2">Performance Details</h3>
                  </div>

                  <Image onClick={() => onEdit('performanceDetails')} src="/icons/edit.svg" alt="Verified" width={25} height={25} />

                </div>
              </div>

              {/* Performance Details Content */}
              <div className="space-y-3 text-sm px-6">
                <div>
                  <p className="text-text-gray mb-1">Performing Languages</p>
                  <div className="flex gap-2 flex-wrap">
                    {data.performingLanguages?.length ? data.performingLanguages?.map((language, index) => (
                      <Button key={index} variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                        {language}
                      </Button>
                    )) : ['English', 'Hindi', 'Gujarati'].map((language, index) => (
                      <Button key={index} variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                        {language}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing Event types</p>
                  {data.performingEventTypes?.length ? data.performingEventTypes?.map((language, index) => (
                    <Button key={index} variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                      {language}
                    </Button>
                  )) : ['Concert', 'Party', 'Events'].map((language, index) => (
                    <Button key={index} variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                      {language}
                    </Button>
                  ))}
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing States</p>
                  <div className="flex gap-2 flex-wrap">
                    {data.performingStates?.length ? data.performingStates?.map((language, index) => (
                      <Button key={index} variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                        {language}
                      </Button>
                    )) : ['Gujarat', 'Maharashtra', 'Rajasthan'].map((language, index) => (
                      <Button key={index} variant="secondary" size="xs" className='px-4 font-normal! text-white! text-sm'>
                        {language}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing Duration</p>
                  <p className="text-white">
                    {data.performingDurationFrom && data.performingDurationTo
                      ? `${data.performingDurationFrom} - ${data.performingDurationTo} mins`
                      : '45 - 90 mins'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Performing members</p>
                  <p className="text-white">{data.performingMembers || '1 - members'}</p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Off stage members</p>
                  <p className="text-white">{data.offStageMembers || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Contact & Pricing Details Section */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-card border-y border-border-color px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h3 className="text-white h2">Contact & Pricing Details</h3>
                  </div>
                  <Image onClick={() => onEdit('contactPricing')} src="/icons/edit.svg" alt="Verified" width={25} height={25} />

                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 text-sm px-6">
                <div>
                  <p className="text-text-gray mb-1">Contact number</p>
                  <p className="text-white">+91 - {data.contactNumber || '7226038336'}</p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">WhatsApp number</p>
                  <p className="text-white">+91 - {data.whatsappNumber || '7226038336'}</p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Email ID</p>
                  <p className="text-white">{data.email || 'andactionapp@gmail.com'}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4 px-6">
                <div>
                  <p className="text-text-gray text-sm mb-1">Solo Charges</p>
                  <p className="text-white font-medium text-lg">
                    ₹ {data.soloChargesFrom || '1,00,000'} - ₹ {data.soloChargesTo || '2,00,000'}
                  </p>
                  <p className="text-twhite text-xs mt-1">
                    {data.soloDescription || 'Solo performance charges with sound system and lighting setup. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'}
                  </p>
                </div>

                <div>
                  <p className="text-text-gray text-sm mb-1">Charges with backing</p>
                  <p className="text-white font-medium text-lg">
                    ₹ {data.backingChargesFrom || '2,00,000'} - ₹ {data.backingChargesTo || '4,00,000'}
                  </p>
                  <p className="text-white text-xs mt-1">
                    {data.backingDescription || 'Performance charges with full backing band, sound system and lighting setup. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Videos & Social Media Section */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-card border-y border-border-color px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-white h2">Videos & Social media</h3>
                  </div>
                  <Image onClick={() => onEdit('videosSocial')} src="/icons/edit.svg" alt="Verified" width={25} height={25} />

                </div>
              </div>

              {/* Social Media Content */}
              <div className="space-y-3 text-sm px-6">
                <div>
                  <p className="text-text-gray mb-1">YouTube Channel</p>
                  <p className="text-white">
                    {data.youtubeConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Instagram Account</p>
                  <p className="text-white">
                    {data.instagramConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color p-6">
        <div className="max-w-md mx-auto">
          <Button
            variant="primary"
            size="md"
            onClick={onNext}
            className="w-full"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileReview;
