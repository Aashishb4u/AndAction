"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import Image from "next/image";
import { ArtistProfileSetupData } from "@/types";

interface PerformanceDetailsProps {
  data: ArtistProfileSetupData;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<ArtistProfileSetupData>) => void;
}

const PerformanceDetails: React.FC<PerformanceDetailsProps> = ({
  data,
  onNext,
  onSkip,
  onBack,
  onUpdateData,
}) => {
  const [formData, setFormData] = useState({
    performingLanguages: data.performingLanguages || [],
    performingEventTypes: data.performingEventTypes || [],
    performingStates: data.performingStates || [],
    performingDurationFrom: data.performingDurationFrom || "",
    performingDurationTo: data.performingDurationTo || "",
    performingMembers: data.performingMembers || "",
    offStageMembers: data.offStageMembers || "",
  });

  // State dropdown visibility
  const [showStatesDropdown, setShowStatesDropdown] = useState(false);
  const [showEventTypesDropdown, setShowEventTypesDropdown] = useState(false);
  const [showLanguagesDropdown, setShowLanguagesDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const languages = [
    { value: "hindi", label: "Hindi" },
    { value: "english", label: "English" },
    { value: "marathi", label: "Marathi" },
    { value: "gujarati", label: "Gujarati" },
    { value: "tamil", label: "Tamil" },
    { value: "telugu", label: "Telugu" },
    { value: "bengali", label: "Bengali" },
    { value: "punjabi", label: "Punjabi" },
    { value: "kannada", label: "Kannada" },
    { value: "malayalam", label: "Malayalam" },
    { value: "odia", label: "Odia" },
    { value: "assamese", label: "Assamese" },
    { value: "kashmiri", label: "Kashmiri" },
    { value: "konkani", label: "Konkani" },
    { value: "sindhi", label: "Sindhi" },
    { value: "nepali", label: "Nepali" },
    { value: "manipuri", label: "Manipuri" },
    { value: "sanskrit", label: "Sanskrit" },
    { value: "bodo", label: "Bodo" },
    { value: "santali", label: "Santali" },
    { value: "dogri", label: "Dogri" },
    { value: "maithili", label: "Maithili" }
  ];

  const eventTypes = [
    { value: "wedding", label: "Wedding" },
    { value: "corporate", label: "Corporate Event" },
    { value: "birthday", label: "Birthday Party" },
    { value: "festival", label: "Festival" },
    { value: "concert", label: "Concert" },
    { value: "private-party", label: "Private Party" },
    { value: "cultural", label: "Cultural Event" },
    { value: "religious", label: "Religious Event" },
  ];

  const states = [
    { value: "andhra-pradesh", label: "Andhra Pradesh" },
    { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
    { value: "assam", label: "Assam" },
    { value: "bihar", label: "Bihar" },
    { value: "chhattisgarh", label: "Chhattisgarh" },
    { value: "goa", label: "Goa" },
    { value: "gujarat", label: "Gujarat" },
    { value: "haryana", label: "Haryana" },
    { value: "himachal-pradesh", label: "Himachal Pradesh" },
    { value: "jharkhand", label: "Jharkhand" },
    { value: "karnataka", label: "Karnataka" },
    { value: "kerala", label: "Kerala" },
    { value: "madhya-pradesh", label: "Madhya Pradesh" },
    { value: "maharashtra", label: "Maharashtra" },
    { value: "manipur", label: "Manipur" },
    { value: "meghalaya", label: "Meghalaya" },
    { value: "mizoram", label: "Mizoram" },
    { value: "nagaland", label: "Nagaland" },
    { value: "odisha", label: "Odisha" },
    { value: "punjab", label: "Punjab" },
    { value: "rajasthan", label: "Rajasthan" },
    { value: "sikkim", label: "Sikkim" },
    { value: "tamil-nadu", label: "Tamil Nadu" },
    { value: "telangana", label: "Telangana" },
    { value: "tripura", label: "Tripura" },
    { value: "uttar-pradesh", label: "Uttar Pradesh" },
    { value: "uttarakhand", label: "Uttarakhand" },
    { value: "west-bengal", label: "West Bengal" },
    // Union Territories
    { value: "andaman-and-nicobar-islands", label: "Andaman & Nicobar Islands" },
    { value: "chandigarh", label: "Chandigarh" },
    { value: "dadra-and-nagar-haveli-and-daman-and-diu", label: "Dadra & Nagar Haveli and Daman & Diu" },
    { value: "delhi", label: "Delhi (NCT)" },
    { value: "jammu-and-kashmir", label: "Jammu & Kashmir" },
    { value: "ladakh", label: "Ladakh" },
    { value: "lakshadweep", label: "Lakshadweep" },
    { value: "puducherry", label: "Puducherry" }
  ];

  const memberOptions = [
    { value: "1", label: "1 Member" },
    { value: "2-5", label: "2-5 Members" },
    { value: "6-10", label: "6-10 Members" },
    { value: "11-20", label: "11-20 Members" },
    { value: "20+", label: "20+ Members" },
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdateData(updatedData);
  };

  // Toggle a single state selection
  const toggleStateSelection = (stateValue: string) => {
    const current = formData.performingStates;
    let updated: string[];
    if (current.includes(stateValue)) {
      updated = current.filter((s) => s !== stateValue);
    } else {
      updated = [...current, stateValue];
    }
    handleInputChange("performingStates", updated);
  };

  // Toggle PAN India (all states)
  const togglePanIndia = () => {
    const allValues = states.map((s) => s.value);
    if (formData.performingStates.length === states.length) {
      // Deselect all
      handleInputChange("performingStates", []);
    } else {
      // Select all
      handleInputChange("performingStates", allValues);
    }
  };

  // Toggle a single event type selection
  const toggleEventTypeSelection = (eventValue: string) => {
    const current = formData.performingEventTypes;
    let updated: string[];
    if (current.includes(eventValue)) {
      updated = current.filter((e) => e !== eventValue);
    } else {
      updated = [...current, eventValue];
    }
    handleInputChange("performingEventTypes", updated);
  };

  // Toggle all event types
  const toggleAllEventTypes = () => {
    const allValues = eventTypes.map((e) => e.value);
    if (formData.performingEventTypes.length === eventTypes.length) {
      // Deselect all
      handleInputChange("performingEventTypes", []);
    } else {
      // Select all
      handleInputChange("performingEventTypes", allValues);
    }
  };

  // Toggle a single language selection
  const toggleLanguageSelection = (langValue: string) => {
    const current = formData.performingLanguages;
    let updated: string[];
    if (current.includes(langValue)) {
      updated = current.filter((l) => l !== langValue);
    } else {
      updated = [...current, langValue];
    }
    handleInputChange("performingLanguages", updated);
  };

  // Toggle all languages
  const toggleAllLanguages = () => {
    const allValues = languages.map((l) => l.value);
    if (formData.performingLanguages.length === languages.length) {
      // Deselect all
      handleInputChange("performingLanguages", []);
    } else {
      // Select all
      handleInputChange("performingLanguages", allValues);
    }
  };

  const handleNext = () => {
    // Close all dropdowns first
    setShowStatesDropdown(false);
    setShowEventTypesDropdown(false);
    setShowLanguagesDropdown(false);

    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (
      !formData.performingLanguages ||
      formData.performingLanguages.length === 0
    ) {
      newErrors.performingLanguages = "Performing language is required";
    }
    if (
      !formData.performingEventTypes ||
      formData.performingEventTypes.length === 0
    ) {
      newErrors.performingEventTypes = "Performing event type is required";
    }
    if (!formData.performingStates || formData.performingStates.length === 0) {
      newErrors.performingStates = "Performing states is required";
    }

    // Validate duration fields
    const minDuration = parseInt(formData.performingDurationFrom);
    const maxDuration = parseInt(formData.performingDurationTo);

    if (
      formData.performingDurationFrom &&
      (minDuration < 15 || minDuration > 600)
    ) {
      newErrors.performingDurationFrom =
        "Duration should be between 15 and 600 minutes";
    }
    if (
      formData.performingDurationTo &&
      (maxDuration < 15 || maxDuration > 600)
    ) {
      newErrors.performingDurationTo =
        "Duration should be between 15 and 600 minutes";
    }
    if (
      formData.performingDurationFrom &&
      formData.performingDurationTo &&
      minDuration >= maxDuration
    ) {
      newErrors.performingDurationTo =
        "Max duration must be greater than min duration";
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
            className="w-6 h-6"
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

        {/* <div>
          <button
            onClick={onSkip}
            className="text-primary-pink hover:text-primary-orange transition-colors duration-200"
          >
            Skip
          </button>
        </div> */}
      </div>

      <div className="h-px bg-border-line mb-4" />

      {/* Content */}
      <div className="flex-1 px-6 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-white mb-2 h1-heading md:mb-8 hidden md:block">
              Profile setup
            </h1>

            {/* Progress Bar */}
            <div className="w-full bg-[#2D2D2D] rounded-full h-1 mb-6">
              <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-2/4"></div>
            </div>

            {/* Step Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0">
                <Image
                  src="/icons/play.svg"
                  alt="Artist Profile"
                  width={32}
                  height={32}
                />
              </div>
              <div className="text-left">
                <h2 className="text-white h3">Performance Details</h2>
              </div>
            </div>
            <p className="text-text-gray secondary-grey-text text-left">
              Tell us about your performance preferences, including languages, event types, and team size.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Performing Languages - Multi-select */}
            <div className="relative">
              <div className="relative mb-1">
                  <label className="block section-text secondary-text">Performing language*</label>
                  <div className="absolute top-0 right-0">
                    <Tooltip content="Select all the languages in which you can perform. This helps clients find artists who can perform in their preferred language.">
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
                </div>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setShowLanguagesDropdown(!showLanguagesDropdown)}
                className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
              >
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  {formData.performingLanguages.length === 0 ? (
                    <span className="text-text-gray">Select languages</span>
                  ) : formData.performingLanguages.length === languages.length ? (
                    <span className="text-white">All Languages</span>
                  ) : (
                    formData.performingLanguages.map((val) => {
                      const label = languages.find((l) => l.value === val)?.label || val;
                      return (
                        <span key={val} className="inline-flex items-center gap-2 border border-border-color text-sm px-3 py-1 rounded-full">
                          <span className="text-white">{label}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleLanguageSelection(val); }}
                            className="text-text-gray hover:text-white"
                            aria-label={`Remove ${label}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <svg
                  className={`w-6 h-6 text-text-gray transition-transform ${showLanguagesDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {showLanguagesDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg w-full h-[60vh] overflow-auto">
                  {/* All Languages checkbox */}
                  <label className="flex items-center gap-3 px-4 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
                    <input
                      type="checkbox"
                      checked={
                        formData.performingLanguages.length === languages.length
                      }
                      onChange={toggleAllLanguages}
                      className="w-4 h-4 accent-primary-pink rounded"
                    />
                    <span className="text-white font-medium">
                      All Languages
                    </span>
                  </label>

                  {/* Individual language checkboxes */}
                  {languages.map((language) => (
                    <label
                      key={language.value}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-background-light cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.performingLanguages.includes(
                          language.value,
                        )}
                        onChange={() => toggleLanguageSelection(language.value)}
                        className="w-4 h-4 accent-primary-pink rounded"
                      />
                      <span className="text-white text-sm">
                        {language.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {errors.performingLanguages && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.performingLanguages}
                </p>
              )}
            </div>

            {/* Performing Event Type - Multi-select */}
            <div className="relative">
              <div className="relative mb-1">
                <label className="block section-text secondary-text">Performing event type*</label>
                <div className="absolute top-0 right-0">
                  <Tooltip content="Select all the types of events you are available to perform at, such as weddings, corporate events, concerts, etc.">
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
              </div>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() =>
                  setShowEventTypesDropdown(!showEventTypesDropdown)
                }
                className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
              >
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  {formData.performingEventTypes.length === 0 ? (
                    <span className="text-text-gray">Select event types</span>
                  ) : formData.performingEventTypes.length === eventTypes.length ? (
                    <span className="text-white">All Event Types</span>
                  ) : (
                    formData.performingEventTypes.map((val) => {
                      const label = eventTypes.find((l) => l.value === val)?.label || val;
                      return (
                        <span key={val} className="inline-flex items-center gap-2 border border-border-color text-sm px-3 py-1 rounded-full">
                          <span className="text-white">{label}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleEventTypeSelection(val); }}
                            className="text-text-gray hover:text-white"
                            aria-label={`Remove ${label}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <svg
                  className={`w-6 h-6 text-text-gray transition-transform ${showEventTypesDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {showEventTypesDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg w-full h-[60vh] overflow-auto">
                  {/* All Event Types checkbox */}
                  <label className="flex items-center gap-3 px-4 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
                    <input
                      type="checkbox"
                      checked={
                        formData.performingEventTypes.length ===
                        eventTypes.length
                      }
                      onChange={toggleAllEventTypes}
                      className="w-4 h-4 accent-primary-pink rounded"
                    />
                    <span className="text-white font-medium">
                      All Event Types
                    </span>
                  </label>

                  {/* Individual event type checkboxes */}
                  {eventTypes.map((eventType) => (
                    <label
                      key={eventType.value}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-background-light cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.performingEventTypes.includes(
                          eventType.value,
                        )}
                        onChange={() =>
                          toggleEventTypeSelection(eventType.value)
                        }
                        className="w-4 h-4 accent-primary-pink rounded"
                      />
                      <span className="text-white text-sm">
                        {eventType.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {errors.performingEventTypes && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.performingEventTypes}
                </p>
              )}
            </div>

            {/* Performing States - Multi-select */}
            <div className="relative">
              <div className="relative mb-1">
                <label className="block section-text secondary-text">Performing states*</label>
                <div className="absolute top-0 right-0">
                  <Tooltip content="Select the states where you are available to perform. Choose 'PAN India' if you can perform anywhere in India.">
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
              </div>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setShowStatesDropdown(!showStatesDropdown)}
                className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
              >
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  {formData.performingStates.length === 0 ? (
                    <span className="text-text-gray">Select states</span>
                  ) : formData.performingStates.length === states.length ? (
                    <span className="text-white">PAN India</span>
                  ) : (
                    formData.performingStates.map((val) => {
                      const label = states.find((l) => l.value === val)?.label || val;
                      return (
                        <span key={val} className="inline-flex items-center gap-2 border border-border-color text-sm px-3 py-1 rounded-full">
                          <span className="text-white">{label}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleStateSelection(val); }}
                            className="text-text-gray hover:text-white"
                            aria-label={`Remove ${label}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <svg
                  className={`w-6 h-6 text-text-gray transition-transform ${showStatesDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {showStatesDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg w-full h-[60vh] overflow-auto">
                  {/* PAN India checkbox */}
                  <label className="flex items-center gap-3 px-4 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
                    <input
                      type="checkbox"
                      checked={
                        formData.performingStates.length === states.length
                      }
                      onChange={togglePanIndia}
                      className="w-4 h-4 accent-primary-pink rounded"
                    />
                    <span className="text-white font-medium">PAN India</span>
                  </label>

                  {/* Individual state checkboxes */}
                  {states.map((state) => (
                    <label
                      key={state.value}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-background-light cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.performingStates.includes(
                          state.value,
                        )}
                        onChange={() => toggleStateSelection(state.value)}
                        className="w-4 h-4 accent-primary-pink rounded"
                      />
                      <span className="text-white text-sm">{state.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.performingStates && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.performingStates}
                </p>
              )}
            </div>

            {/* Performing Duration */}
            <div className="relative">
              <div className="relative mb-2">
                  <label className="block secondary-text text-white">Performing duration <span className="footnote text-text-gray">(in minutes)</span></label>
                  <div className="absolute top-0 right-0">
                    <Tooltip content="Enter the typical duration range of your performances in minutes. For example, 30-60 minutes for short sets or 60-120 minutes for full shows.">
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
                </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="From"
                    value={formData.performingDurationFrom}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      if (value === "" || /^[0-9]*$/.test(value)) {
                        handleInputChange("performingDurationFrom", value);
                      }
                    }}
                    variant="filled"
                  />
                </div>
                <span className="mx-2 text-lg text-[#2D2D2D] select-none">
                  —
                </span>
                <div className="flex-1">
                  <Input
                    placeholder="To"
                    value={formData.performingDurationTo}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      if (value === "" || /^[0-9]*$/.test(value)) {
                        handleInputChange("performingDurationTo", value);
                      }
                    }}
                    variant="filled"
                  />
                </div>
              </div>
              {(errors.performingDurationTo ||
                errors.performingDurationFrom) && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.performingDurationTo || errors.performingDurationFrom}
                </p>
              )}{" "}
            </div>

            {/* Performing Members */}
            <div>
              <div className="relative mb-1">
                <label className="block section-text secondary-text">Performing members</label>
                <div className="absolute top-0 right-0">
                  <Tooltip content="Select the number of artists/performers who will be on stage during your performance. This helps clients plan the event space and logistics.">
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
              </div>
              <Select
                placeholder="Select members"
                value={formData.performingMembers}
                onChange={(value) =>
                  handleInputChange("performingMembers", value)
                }
                options={memberOptions}
              />
            </div>

            {/* Off Stage Members */}
            <div>
              <div className="relative mb-1">
                <label className="block section-text secondary-text">Off stage members</label>
                <div className="absolute top-0 right-0">
                  <Tooltip content="Select the number of crew members who support your performance (sound engineers, managers, technicians, etc.) but don't perform on stage.">
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
              </div>
              <Select
                placeholder="Select members"
                value={formData.offStageMembers}
                onChange={(value) =>
                  handleInputChange("offStageMembers", value)
                }
                options={memberOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color px-5 md:px-0 py-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="primary" size="md" onClick={handleNext} className="w-full">
            Save & Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetails;
