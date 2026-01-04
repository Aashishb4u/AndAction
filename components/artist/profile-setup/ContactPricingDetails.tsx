'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Image from 'next/image';
import PhoneInput from '@/components/ui/PhoneInput';
import { ArtistProfileSetupData } from '@/types';

interface ContactPricingDetailsProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<ArtistProfileSetupData>) => void;
}

const ContactPricingDetails: React.FC<ContactPricingDetailsProps> = ({
  data,
  onNext,
  onSkip,
  onBack,
  onUpdateData
}) => {
  const [formData, setFormData] = useState({
    contactNumber: data.contactNumber || '',
    whatsappNumber: data.whatsappNumber || '',
    sameAsContact: data.sameAsContact || false,
    email: data.email || '',
    soloChargesFrom: data.soloChargesFrom || '',
    soloChargesTo: data.soloChargesTo || '',
    soloDescription: data.soloDescription || '',
    backingChargesFrom: data.backingChargesFrom || '',
    backingChargesTo: data.backingChargesTo || '',
    backingDescription: data.backingDescription || ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    const updatedData = { ...formData, [field]: value };

    // If "Same as Contact number" is checked, copy contact number to WhatsApp
    if (field === 'sameAsContact' && value === true) {
      updatedData.whatsappNumber = updatedData.contactNumber;
    }

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
        <button
          onClick={onSkip}
          className="text-primary-pink hover:text-primary-orange transition-colors duration-200 font-medium"
        >
          Skip
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
              <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-3/4"></div>
            </div>

            {/* Step Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0">
                <Image src="/icons/phone.svg" alt="Contact & Pricing" width={25} height={25} />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Contact & Pricing Details</h2>
              </div>
            </div>
            <p className="text-text-gray text-sm text-left">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
            </p>
          </div>

          {/* Form */}
          <div className="space-y-8">
            {/* Contact Details Section */}
            <div>
              <h3 className="text-white h2 mb-4">Contact Details</h3>

              <div className="space-y-6">
                {/* Contact Number */}
                <div className="relative">
                  <button className="absolute top-0 right-0 text-blue p-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  <PhoneInput
                    label="Contact number*"
                    placeholder="Enter contact number"
                    value={formData.contactNumber}
                    onChange={(value) => handleInputChange('contactNumber', value)}
                    variant="filled"
                  />
                  <button className="px-4 py-2 hover:text-primary-orange transition-colors duration-200 font-medium absolute right-0 top-10 gradient-text btn1">
                    Verify
                  </button>
                </div>
                {/* WhatsApp Number */}
                <div className="relative">
                  <button className="absolute top-0 right-0 text-blue p-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  <PhoneInput
                    label="WhatsApp number*"
                    placeholder="Enter whatsApp number"
                    value={formData.whatsappNumber}
                    onChange={(value) => handleInputChange('whatsappNumber', value)}
                    variant="filled"
                  />
                  <button className="px-4 py-2 hover:text-primary-orange transition-colors duration-200 font-medium absolute right-0 top-10 gradient-text btn1">
                    Verify
                  </button>
                </div>

                {/* Same as Contact Checkbox */}
                <div className="mt-3">
                  <Checkbox
                    checked={formData.sameAsContact}
                    onChange={(checked) => handleInputChange('sameAsContact', checked)}
                    label="Same as Contact number"
                    className="text-white"
                    id='sameAsContact'
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Input
                    label="Email"
                    placeholder="Enter contact email ID"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    variant="filled"
                    type="email"
                  />
                  <button className="absolute top-0 right-0 text-blue p-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Details Section */}
            <div>
              <h3 className="text-white h2 mb-4">Pricing Details</h3>

              <div className="space-y-6">
                {/* Solo Charges */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-white font-medium">Solo charges</label>
                    <button className="text-blue">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <span className="text-white text-sm  left-3 mr-4 z-50 top-3.5">₹</span>
                      <Input
                        placeholder="- From"
                        value={formData.soloChargesFrom}
                        onChange={(e) => handleInputChange('soloChargesFrom', e.target.value)}
                        variant="filled"
                        className='pl-7'
                      />
                    </div>
                    <div className="relative">
                      <span className="text-white text-sm  mr-4 left-3 z-50 top-3.5">₹</span>
                      <Input
                        placeholder="- To"
                        value={formData.soloChargesTo}
                        onChange={(e) => handleInputChange('soloChargesTo', e.target.value)}
                        variant="filled"
                        className='pl-7'
                      />
                    </div>
                  </div>

                  <textarea
                    placeholder="Add Description...."
                    value={formData.soloDescription}
                    onChange={(e) => handleInputChange('soloDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none focus:border-primary-pink transition-colors duration-200 resize-none"
                  />
                </div>

                {/* Charges with Backing */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-white font-medium">Charges with backing</label>
                    <button className="text-blue">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <span className="text-white text-sm absolute pr-4 left-3 z-50 top-3.5">₹</span>
                      <Input
                        placeholder="- From"
                        value={formData.backingChargesFrom}
                        onChange={(e) => handleInputChange('backingChargesFrom', e.target.value)}
                        variant="filled"
                        className='pl-7'
                      />
                    </div>
                    <div className="relative">
                      <span className="text-white text-sm absolute left-3 z-50 pr-4 top-3.5">₹</span>
                      <Input
                        placeholder="- To"
                        value={formData.backingChargesTo}
                        onChange={(e) => handleInputChange('backingChargesTo', e.target.value)}
                        variant="filled"
                        className='pl-7'
                      />
                    </div>
                  </div>

                  <textarea
                    placeholder="Add Description...."
                    value={formData.backingDescription}
                    onChange={(e) => handleInputChange('backingDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none focus:border-primary-pink transition-colors duration-200 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color md:px-6 px-5 py-4">
        <div className="max-w-md mx-auto">
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            className="w-full"
          >
            Save & Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactPricingDetails;
