"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import { Info } from "lucide-react";
import { Artist } from "@/types";
import { useSession } from "next-auth/react";
import { mapUserForSession, updateArtistProfile } from "@/lib/helper";
import { toast } from "react-toastify";
import { INDIAN_STATES } from "@/lib/constants";

interface PerformanceTabProps {
  artist: Artist;
}

const performingLanguageOptions = [
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
  { value: "marathi", label: "Marathi" },
  { value: "gujarati", label: "Gujarati" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "bengali", label: "Bengali" },
  { value: "punjabi", label: "Punjabi" },
];

const eventTypeOptions = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate Event" },
  { value: "birthday", label: "Birthday Party" },
  { value: "festival", label: "Festival" },
  { value: "concert", label: "Concert" },
  { value: "private-party", label: "Private Party" },
  { value: "cultural", label: "Cultural Event" },
  { value: "religious", label: "Religious Event" },
];



const performingMembersOptions = [
  { value: "1", label: "1 Member" },
  { value: "2-5", label: "2-5 Members" },
  { value: "6-10", label: "6-10 Members" },
  { value: "11-20", label: "11-20 Members" },
  { value: "20+", label: "20+ Members" },
];

const offStageMembersOptions = performingMembersOptions;

// Helper function to parse comma-separated string to array
const parseCSV = (value: string | undefined | null): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

const PerformanceTab: React.FC<PerformanceTabProps> = ({ artist }) => {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown visibility states
  const [showLanguagesDropdown, setShowLanguagesDropdown] = useState(false);
  const [showEventTypesDropdown, setShowEventTypesDropdown] = useState(false);
  const [showStatesDropdown, setShowStatesDropdown] = useState(false);

  const [formData, setFormData] = useState({
    performingLanguages: parseCSV(artist.performingLanguage),
    eventTypes: parseCSV(artist.performingEventType),
    performingStates: parseCSV(artist.performingStates),
    minDuration: artist.performingDurationFrom || "",
    maxDuration: artist.performingDurationTo || "",
    performingMembers: artist.performingMembers || "",
    offStageMembers: artist.offStageMembers || "",
    soloChargesFrom: artist.soloChargesFrom?.toString() || "",
    soloChargesDescription: artist.soloChargesDescription || "",
    chargesWithBacklineFrom: artist.chargesWithBacklineFrom?.toString() || "",
    chargesWithBacklineDescription: artist.chargesWithBacklineDescription || "",
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle language selection
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
    const allValues = performingLanguageOptions.map((l) => l.value);
    if (
      formData.performingLanguages.length === performingLanguageOptions.length
    ) {
      handleInputChange("performingLanguages", []);
    } else {
      handleInputChange("performingLanguages", allValues);
    }
  };

  // Toggle event type selection
  const toggleEventTypeSelection = (eventValue: string) => {
    const current = formData.eventTypes;
    let updated: string[];
    if (current.includes(eventValue)) {
      updated = current.filter((e) => e !== eventValue);
    } else {
      updated = [...current, eventValue];
    }
    handleInputChange("eventTypes", updated);
  };

  // Toggle all event types
  const toggleAllEventTypes = () => {
    const allValues = eventTypeOptions.map((e) => e.value);
    if (formData.eventTypes.length === eventTypeOptions.length) {
      handleInputChange("eventTypes", []);
    } else {
      handleInputChange("eventTypes", allValues);
    }
  };

  // Toggle state selection
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
    const allValues = INDIAN_STATES.map((s) => s.value);
    if (formData.performingStates.length === INDIAN_STATES.length) {
      handleInputChange("performingStates", []);
    } else {
      handleInputChange("performingStates", allValues);
    }
  };

  const handleSave = async () => {
    try {
      if (!session?.user?.id) {
        toast.error("Not authenticated");
        return;
      }

      // close all dropdowns before saving
      setShowLanguagesDropdown(false);
      setShowEventTypesDropdown(false);
      setShowStatesDropdown(false);

      setIsLoading(true);

      const payload = {
        userId: session.user.id,
        performingLanguage: formData.performingLanguages.join(","),
        performingEventType: formData.eventTypes.join(","),
        performingStates: formData.performingStates.join(","),
        performingDurationFrom: formData.minDuration,
        performingDurationTo: formData.maxDuration,
        performingMembers: formData.performingMembers,
        offStageMembers: formData.offStageMembers,
        soloChargesFrom: formData.soloChargesFrom,
        soloChargesDescription: formData.soloChargesDescription,
        chargesWithBacklineFrom: formData.chargesWithBacklineFrom,
        chargesWithBacklineDescription: formData.chargesWithBacklineDescription,
      };

      const res = await updateArtistProfile(payload);

      const refreshedUser = res.data.user;
      const refreshedArtist = res.data.artistProfile;

      const sessionPayload = mapUserForSession(refreshedUser, refreshedArtist);

      await update({
        update: sessionPayload,
      });

      toast.success("Performance details updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update performance details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      performingLanguages: parseCSV(artist.performingLanguage),
      eventTypes: parseCSV(artist.performingEventType),
      performingStates: parseCSV(artist.performingStates),
      minDuration: artist.performingDurationFrom || "",
      maxDuration: artist.performingDurationTo || "",
      performingMembers: artist.performingMembers || "",
      offStageMembers: artist.offStageMembers || "",
      soloChargesFrom: artist.soloChargesFrom?.toString() || "",
      soloChargesDescription: artist.soloChargesDescription || "",
      chargesWithBacklineFrom: artist.chargesWithBacklineFrom?.toString() || "",
      chargesWithBacklineDescription: artist.chargesWithBacklineDescription || "",
    });
  };

  return (
    <div className="md:space-y-5 space-y-4 pb-24 md:pb-0">
      {/* Performing Language - Multi-select */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-white">
            Performing language*
          </label>
          <Tooltip content="Select the languages you can perform in during your shows">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>

        {/* Selected values display */}
        <div className="w-full px-4 py-3 bg-card border border-border-color rounded-lg mb-2 min-h-[48px]">
          <span
            className={
              formData.performingLanguages.length > 0
                ? "text-white"
                : "text-text-gray"
            }
          >
            {formData.performingLanguages.length > 0
              ? formData.performingLanguages
                  .map(
                    (val) =>
                      performingLanguageOptions.find((opt) => opt.value === val)
                        ?.label || val,
                  )
                  .join(", ")
              : "No languages selected"}
          </span>
        </div>

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setShowLanguagesDropdown(!showLanguagesDropdown)}
          className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
        >
          <span className="text-text-gray">Select languages</span>
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
          <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-64 overflow-auto">
            {/* All Languages checkbox */}
            <label className="flex items-center gap-3 px-4 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
              <input
                type="checkbox"
                checked={
                  formData.performingLanguages.length ===
                  performingLanguageOptions.length
                }
                onChange={toggleAllLanguages}
                className="w-4 h-4 accent-primary-pink rounded"
              />
              <span className="text-white font-medium">All Languages</span>
            </label>

            {/* Individual language checkboxes */}
            {performingLanguageOptions.map((language) => (
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
                <span className="text-white text-sm">{language.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Performing Event Type - Multi-select */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-white">
            Performing event type*
          </label>
          <Tooltip content="Choose the types of events where you typically perform">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>

        {/* Selected values display */}
        <div className="w-full px-4 py-3 bg-card border border-border-color rounded-lg mb-2 min-h-[48px]">
          <span
            className={
              formData.eventTypes.length > 0 ? "text-white" : "text-text-gray"
            }
          >
            {formData.eventTypes.length > 0
              ? formData.eventTypes
                  .map(
                    (val) =>
                      eventTypeOptions.find((opt) => opt.value === val)
                        ?.label || val,
                  )
                  .join(", ")
              : "No event types selected"}
          </span>
        </div>

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setShowEventTypesDropdown(!showEventTypesDropdown)}
          className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
        >
          <span className="text-text-gray">Select event types</span>
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
          <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-64 overflow-auto">
            {/* All Event Types checkbox */}
            <label className="flex items-center gap-3 px-4 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
              <input
                type="checkbox"
                checked={formData.eventTypes.length === eventTypeOptions.length}
                onChange={toggleAllEventTypes}
                className="w-4 h-4 accent-primary-pink rounded"
              />
              <span className="text-white font-medium">All Event Types</span>
            </label>

            {/* Individual event type checkboxes */}
            {eventTypeOptions.map((eventType) => (
              <label
                key={eventType.value}
                className="flex items-center gap-3 px-4 py-2 hover:bg-background-light cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.eventTypes.includes(eventType.value)}
                  onChange={() => toggleEventTypeSelection(eventType.value)}
                  className="w-4 h-4 accent-primary-pink rounded"
                />
                <span className="text-white text-sm">{eventType.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Performing States - Multi-select */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-white">
            Performing states*
          </label>
          <Tooltip content="Enter the states where you are willing to perform">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>

        {/* Selected values display */}
        <div className="w-full px-4 py-3 bg-card border border-border-color rounded-lg mb-2 min-h-[48px]">
          <span
            className={
              formData.performingStates.length > 0
                ? "text-white"
                : "text-text-gray"
            }
          >
            {formData.performingStates.length > 0
              ? formData.performingStates.length ===
                INDIAN_STATES.length
                ? "PAN India (All States)"
                : formData.performingStates
                    .map(
                      (val) =>
                        INDIAN_STATES.find((opt) => opt.value === val)
                          ?.label || val,
                    )
                    .join(", ")
              : "No states selected"}
          </span>
        </div>

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setShowStatesDropdown(!showStatesDropdown)}
          className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
        >
          <span className="text-text-gray">Select states</span>
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
          <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-64 overflow-auto">
            {/* PAN India checkbox */}
            <label className="flex items-center gap-3 px-4 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
              <input
                type="checkbox"
                checked={
                  formData.performingStates.length ===
                  INDIAN_STATES.length
                }
                onChange={togglePanIndia}
                className="w-4 h-4 accent-primary-pink rounded"
              />
              <span className="text-white font-medium">PAN India</span>
            </label>

            {/* Individual state checkboxes */}
            {INDIAN_STATES.map((state) => (
              <label
                key={state.value}
                className="flex items-center gap-3 px-4 py-2 hover:bg-background-light cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.performingStates.includes(state.value)}
                  onChange={() => toggleStateSelection(state.value)}
                  className="w-4 h-4 accent-primary-pink rounded"
                />
                <span className="text-white text-sm">{state.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Performing Duration */}
      <div className="space-y-2">
        
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-white">
          Performing duration{" "}
          <span className="text-text-gray">(in minutes)</span>
          <span className="text-red-500 ml-1">*</span>
        </label>
          <Tooltip content="Specify the minimum and maximum duration (in minutes) for your performances">
              <Info size={16} className="text-blue" />
            </Tooltip>
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-6">
            <Input
              value={formData.minDuration}
              onChange={(e) => handleInputChange("minDuration", e.target.value)}
              placeholder="120 mins"
              required
            />
            <Input
              value={formData.maxDuration}
              onChange={(e) => handleInputChange("maxDuration", e.target.value)}
              placeholder="160 mins"
              required
            />
          </div>
        </div>
      </div>

      {/* Performing Members and Off Stage Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Performing Members */}
        <div className="relative">
          <Select
            label="Performing members*"
            options={performingMembersOptions}
            value={formData.performingMembers}
            onChange={(value) => handleInputChange("performingMembers", value)}
            required
          />
          <div className="absolute top-0 right-0">
            <Tooltip content="Number of people who will perform on stage">
              <Info size={16} className="text-blue" />
            </Tooltip>
          </div>
        </div>

        {/* Off Stage Members */}
        <div className="relative">
          <Select
            label="Off stage members*"
            options={offStageMembersOptions}
            value={formData.offStageMembers}
            onChange={(value) => handleInputChange("offStageMembers", value)}
            required
          />
          <div className="absolute top-0 right-0">
            <Tooltip content="Number of support staff needed off-stage (sound engineers, assistants, etc.)">
              <Info size={16} className="text-blue" />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Solo Charges */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-white">
            Solo charges starting from <span className="text-red-500 ml-1">*</span>
          </label>
          <Tooltip content="Starting amount you usually charge when performing solo">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
        <Input
          value={formData.soloChargesFrom}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^[0-9]*$/.test(value)) {
              handleInputChange("soloChargesFrom", value);
            }
          }}
          placeholder="Starting from"
          required
        />
        <textarea
          placeholder="What services do you include while charging solo"
          value={formData.soloChargesDescription}
          onChange={(e) => handleInputChange("soloChargesDescription", e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none focus:border-primary-pink transition-colors duration-200 resize-none"
        />
      </div>

      {/* Charges with Backing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-white">
            Charges with backing starting from
          </label>
          <Tooltip content="Starting amount including backline like sound, stage, and support setup">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
        <Input
          value={formData.chargesWithBacklineFrom}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^[0-9]*$/.test(value)) {
              handleInputChange("chargesWithBacklineFrom", value);
            }
          }}
          placeholder="Starting from"
        />
        <textarea
          placeholder="Please include backline like sound system, stage, chorus, etc."
          value={formData.chargesWithBacklineDescription}
          onChange={(e) =>
            handleInputChange("chargesWithBacklineDescription", e.target.value)
          }
          rows={3}
          className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-white placeholder-text-gray focus:outline-none focus:border-primary-pink transition-colors duration-200 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex md:justify-end gap-4 items-center md:pt-5 py-2 px-3 fixed md:static bottom-0 left-0 right-0 bg-card md:bg-transparent z-50">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={isLoading}
          className="w-full md:w-auto text-xs! md:text-base"
        >
          <span className="gradient-text">Reset</span>
        </Button>

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isLoading}
          className="w-full md:w-auto text-xs! md:text-base"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default PerformanceTab;
