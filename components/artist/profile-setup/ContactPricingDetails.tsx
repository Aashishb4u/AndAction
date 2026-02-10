"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Tooltip from "@/components/ui/Tooltip";
import Image from "next/image";
import PhoneInput from "@/components/ui/PhoneInput";
import { ArtistProfileSetupData } from "@/types";

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
  onUpdateData,
}) => {
  const [formData, setFormData] = useState({
    contactNumber: data.contactNumber || "",
    whatsappNumber: data.whatsappNumber || "",
    sameAsContact: data.sameAsContact || false,
    email: data.email || "",
    soloCharges: data.soloCharges || "",
    soloDescription: data.soloDescription || "",
    backingCharges: data.backingCharges || "",
    backingDescription: data.backingDescription || "",
  });

  // Track if fields are in edit mode (editable) or locked
  const [isContactEditing, setIsContactEditing] = useState(!data.contactNumber);
  const [isWhatsappEditing, setIsWhatsappEditing] = useState(
    !data.whatsappNumber,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    const updatedData = { ...formData, [field]: value };

    // If "Same as Contact number" is checked, copy contact number to WhatsApp
    if (field === "sameAsContact" && value === true) {
      updatedData.whatsappNumber = updatedData.contactNumber;
    }

    setFormData(updatedData);
    onUpdateData(updatedData);

    // Clear error for the field being edited
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, "");

    // Check if it has at least 10 digits
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const handleNext = () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!validatePhoneNumber(formData.contactNumber)) {
      newErrors.contactNumber =
        "Please enter a valid phone number (at least 10 digits)";
    }

    if (!formData.whatsappNumber?.trim()) {
      newErrors.whatsappNumber = "WhatsApp number is required";
    } else if (!validatePhoneNumber(formData.whatsappNumber)) {
      newErrors.whatsappNumber =
        "Please enter a valid WhatsApp number (at least 10 digits)";
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
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden md:block">Back</span>
          <span className="md:hidden h2">Profile Setup</span>
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
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="h1-heading md:mb-8 text-white mb-2 hidden md:block">
              Profile setup
            </h1>

            {/* Progress Bar */}
            <div className="w-full bg-[#2D2D2D] rounded-full h-1 mb-6">
              <div className="bg-linear-to-r from-primary-pink to-primary-orange h-1 rounded-full w-3/4"></div>
            </div>

            {/* Step Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="shrink-0">
                <Image
                  src="/icons/phone.svg"
                  alt="Contact & Pricing"
                  width={32}
                  height={32}
                />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Contact & Pricing Details</h2>
              </div>
            </div>
            <p className="text-text-gray secondary-grey-text text-left">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
            </p>
          </div>

          {/* Form */}
          <div className="space-y-8">
            {/* Contact Details Section */}
            <div>
              <h3 className="text-white h2 mb-1">Contact Details</h3>

              <div className="space-y-6">
                {/* Contact Number */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block section-text secondary-text">Contact number*</label>
                    <Tooltip
                      content="Your primary contact number for clients to reach you. This will be verified via OTP to ensure authenticity."
                      position="right"
                    >
                      <button className="text-blue">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <PhoneInput
                      placeholder="Enter contact number"
                      value={formData.contactNumber}
                      onChange={(value) =>
                        handleInputChange("contactNumber", value)
                      }
                      variant="filled"
                      disabled={!isContactEditing && !!formData.contactNumber}
                    />
                    {/* Show Edit or Verify based on editing state */}
                    {formData.contactNumber && !isContactEditing ? (
                      <button
                        onClick={() => setIsContactEditing(true)}
                        className="px-4 py-2 hover:text-primary-orange transition-colors duration-200 font-medium absolute right-0 top-1 gradient-text btn1"
                      >
                        Edit
                      </button>
                    ) : (
                      <button className="px-4 py-2 hover:text-primary-orange transition-colors duration-200 font-medium absolute right-0 top-1 gradient-text btn1">
                        Verify
                      </button>
                    )}
                  </div>
                  {errors.contactNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>
                {/* WhatsApp Number */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block section-text secondary-text">WhatsApp number*</label>
                    <Tooltip
                      content="Your WhatsApp number for quick communication with clients. Many clients prefer WhatsApp for booking inquiries."
                      position="right"
                    >
                      <button className="text-blue">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>

                  <div className="relative">
                    <PhoneInput
                      placeholder="Enter whatsApp number"
                      value={formData.whatsappNumber}
                      onChange={(value) =>
                        handleInputChange("whatsappNumber", value)
                      }
                      variant="filled"
                      disabled={!isWhatsappEditing && !!formData.whatsappNumber}
                    />
                    {/* Show Edit or Verify based on editing state */}
                    {formData.whatsappNumber && !isWhatsappEditing ? (
                      <button
                        onClick={() => setIsWhatsappEditing(true)}
                        className="px-4 py-2 hover:text-primary-orange transition-colors duration-200 font-medium absolute right-0 top-1 gradient-text btn1"
                      >
                        Edit
                      </button>
                    ) : (
                      <button className="px-4 py-2 hover:text-primary-orange transition-colors duration-200 font-medium absolute right-0 top-1 gradient-text btn1">
                        Verify
                      </button>
                    )}
                  </div>
                  {errors.whatsappNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.whatsappNumber}
                    </p>
                  )}
                </div>

                {/* Same as Contact Checkbox */}
                <div className="mt-3">
                  <Checkbox
                    checked={formData.sameAsContact}
                    onChange={(checked) =>
                      handleInputChange("sameAsContact", checked)
                    }
                    label="Same as Contact number"
                    className="text-white"
                    id="sameAsContact"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block section-text secondary-text">Email</label>
                    <Tooltip
                      content="Your professional email address for formal communications, contracts, and booking confirmations."
                      position="right"
                    >
                      <button className="text-blue">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                  <Input
                    placeholder="Enter contact email ID"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    variant="filled"
                    type="email"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Details Section */}
            <div>
              <h3 className="text-white h2 mb-4">Pricing Details</h3>

              <div className="space-y-6">
                {/* Solo Charges */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-white font-medium">
                      Solo charges
                    </label>
                    <Tooltip
                      content="Enter your starting price when performing alone without any supporting equipment. This gives clients a baseline for your rates."
                      position="bottom"
                    >
                      <svg
                        className="w-4 h-4 text-blue cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </Tooltip>
                  </div>
                  <p className="text-text-gray text-sm mb-3">
                    (Amount you usually charge when you perform solo)
                  </p>

                  <div className="relative mb-4">
                    <span className="text-white text-sm left-3 mr-4 z-50 top-3.5 absolute">
                      ₹
                    </span>
                    <Input
                      placeholder="Starting from"
                      value={formData.soloCharges}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow digits
                        if (value === "" || /^[0-9]*$/.test(value)) {
                          handleInputChange("soloCharges", value);
                        }
                      }}
                      variant="filled"
                      style={{ paddingLeft: "2rem" }}
                    />
                  </div>

                  <textarea
                    placeholder="Solo charges like Sound system, stage, Chorus"
                    value={formData.soloDescription}
                    onChange={(e) =>
                      handleInputChange("soloDescription", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none focus:border-primary-pink transition-colors duration-200 resize-none"
                  />
                </div>

                {/* Charges with Backing */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-white font-medium">
                      Charges with backline
                    </label>
                    <Tooltip
                      content="Enter your price when you provide the complete setup including sound system, stage equipment, chorus singers, etc. This is your all-inclusive rate."
                      position="bottom"
                    >
                      <svg
                        className="w-4 h-4 text-blue cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </Tooltip>
                  </div>
                  <p className="text-text-gray text-sm mb-3">
                    (Amount you usually charge including backline like sound
                    system, stage, chorus)
                  </p>

                  <div className="relative mb-4">
                    <span className="text-white text-sm absolute left-3 z-50 pr-4 top-3.5">
                      ₹
                    </span>
                    <Input
                      placeholder="Starting from"
                      value={formData.backingCharges}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow digits
                        if (value === "" || /^[0-9]*$/.test(value)) {
                          handleInputChange("backingCharges", value);
                        }
                      }}
                      variant="filled"
                      style={{ paddingLeft: "2rem" }}
                    />
                  </div>

                  <textarea
                    placeholder="Backline like Sound system, stage, Chorus"
                    value={formData.backingDescription}
                    onChange={(e) =>
                      handleInputChange("backingDescription", e.target.value)
                    }
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color px-5 md:px-0 py-4">
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
