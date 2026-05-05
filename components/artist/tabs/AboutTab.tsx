"use client";

import React, { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Tooltip from "@/components/ui/Tooltip";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { Info } from "lucide-react";
import { INDIAN_STATES, INDIAN_CITIES } from "@/lib/constants";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import type { AboutDraft } from "./profileDraftTypes";

interface AboutTabProps {
  draft: AboutDraft;
  setDraft: React.Dispatch<React.SetStateAction<AboutDraft>>;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onReset: () => void;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

// Category options are loaded from artist_categories table.

const subArtistTypeOptions = [
  { value: "classical", label: "Classical" },
  { value: "contemporary", label: "Contemporary" },
  { value: "folk", label: "Folk" },
  { value: "bollywood", label: "Bollywood" },
  { value: "western", label: "Western" },
  { value: "fusion", label: "Fusion" },
];

const experienceOptions = [
  { value: "1", label: "0-1 years" },
  { value: "2", label: "1-3 years" },
  { value: "3", label: "3-5 years" },
  { value: "4", label: "5-10 years" },
  { value: "5", label: "10+ years" },
];

const AboutTab: React.FC<AboutTabProps> = ({
  draft,
  setDraft,
  isSaving,
  onSave,
  onReset,
}) => {
  const { categories } = useArtistCategories();

  const selectedSubTypes = draft.subArtistTypes;
  const setSelectedSubTypes = (next: string[]) =>
    setDraft((prev) => ({ ...prev, subArtistTypes: next }));

  const [subTypeInput, setSubTypeInput] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleInputChange = <K extends keyof AboutDraft>(
    field: K,
    value: AboutDraft[K],
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const fetchLocationFromPinCode = async () => {
      const pin = draft.pinCode.trim();
      if (!/^\d{6}$/.test(pin)) return;

      setIsFetchingLocation(true);
      try {
        const response = await fetch(`/api/geocode/pincode?pin=${pin}`);
        const data = await response.json();

        if (data?.success && data?.data) {
          const normalizedState = data.data.state
            ? String(data.data.state).toLowerCase().replace(/\s+/g, "-")
            : "";
          const normalizedCity = String(
            data.data.city || data.data.district || "",
          )
            .toLowerCase()
            .replace(/\s+/g, "-");

          setDraft((prev) => ({
            ...prev,
            state: normalizedState || prev.state,
            city: normalizedCity || prev.city,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch location:", error);
      } finally {
        setIsFetchingLocation(false);
      }
    };

    fetchLocationFromPinCode();
  }, [draft.pinCode, setDraft]);

  return (
    <div className="md:space-y-5 space-y-4 pb-24 md:pb-0">
      {/* Stage Name */}
      <div className="relative text-sm">
        <Input
          label="Stage name*"
          value={draft.stageName}
          onChange={(e) => handleInputChange("stageName", e.target.value)}
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Your stage name or artist alias that fans will recognize you by. This will be displayed on your public profile.">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>


      {/* First Name and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">       <Input
          label="First name*"
          value={draft.firstName}
          onChange={(e) => handleInputChange("firstName", e.target.value)}
          required
        />
        <Input
          label="Last name*"
          value={draft.lastName}
          onChange={(e) => handleInputChange("lastName", e.target.value)}
          required
        />
      </div>

      {/* Date of Birth and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <DateInput
          label="Date of birth*"
          value={draft.dateOfBirth}
          onChange={(value) => handleInputChange("dateOfBirth", value)}
          placeholder="DD / MM / YYYY"
          maxDate={new Date()}
          required
        />
        <Select
          label="Gender*"
          options={genderOptions}
          value={draft.gender}
          onChange={(value) => handleInputChange("gender", value)}
          required
        />
      </div>

      {/* Address */}
      <AddressAutocomplete
        label="Office/Home full address*"
        placeholder="Search for your address or use location"
        value={draft.address}
        onChange={(value) => handleInputChange("address", value)}
        onLocationSelect={(loc) => {
          handleInputChange("address", loc.address);
          if (loc.pinCode) handleInputChange("pinCode", loc.pinCode);
          if (loc.state) handleInputChange("state", loc.state);
          if (loc.city) handleInputChange("city", loc.city);
        }}
        required
      />

      {/* PIN Code, State, City */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="PIN code*"
          value={draft.pinCode}
          onChange={(e) =>
            handleInputChange("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          maxLength={6}
          required
        />
        <Select
          label="State*"
          options={INDIAN_STATES}
          value={draft.state}
          onChange={(value) => handleInputChange("state", value)}
          disabled={isFetchingLocation}
          required
        />
        <Select
          label="City*"
          options={INDIAN_CITIES}
          value={draft.city}
          onChange={(value) => handleInputChange("city", value)}
          disabled={isFetchingLocation}
          required
        />
      </div>
      {isFetchingLocation && (
        <p className="text-sm text-primary-pink -mt-2">Fetching location...</p>
      )}

      {/* Contact Number */}
      <div className="relative text-sm">
        <Input
          label="Contact number*"
          value={draft.contactNumber}
          onChange={(e) => handleInputChange("contactNumber", e.target.value)}
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Primary contact number">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

      {/* WhatsApp Number */}
      <div className="relative text-sm">
        <Input
          label="WhatsApp number*"
          value={draft.whatsappNumber}
          onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="WhatsApp number for booking communication">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

      {/* Email ID */}
      <div className="relative text-sm">
        <Input
          label="Email ID"
          value={draft.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          type="email"
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Professional email used for booking communication">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

            {/* Artist Category */}
      <div className="relative text-sm">
        <Select
          label="Artist Category*"
          options={categories}
          value={draft.artistType}
          onChange={(value) => handleInputChange("artistType", value)}
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Select the primary category that best describes your art form">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

      {/* Sub-Artist Type (tag-style multi-select) */}      <div className="relative text-sm">
        <label className="block secondary-text text-white mb-1">Sub-Artist type*</label>
        <div className="w-full bg-card border border-border-color rounded-lg px-3 py-2 text-white flex flex-wrap gap-2">
          {selectedSubTypes.map((tag, idx) => (
            <span key={tag + idx} className="inline-flex items-center gap-2 bg-background px-3 py-1 rounded-full text-sm">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => {
                  const next = selectedSubTypes.filter(t => t !== tag);
                  setSelectedSubTypes(next);
                }}
                className="text-text-gray hover:text-white"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            className="flex-1 bg-transparent focus:outline-none px-2 py-1 text-sm placeholder-text-gray"
            placeholder="e.g. Classical, Bollywood, Fusion"
            value={subTypeInput}
            onChange={(e) => setSubTypeInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const v = subTypeInput.trim().replace(/,$/, '');
                if (v && !selectedSubTypes.includes(v)) {
                  setSelectedSubTypes([v, ...selectedSubTypes]);
                }
                setSubTypeInput('');
              } else if (e.key === 'Backspace' && !subTypeInput) {
                setSelectedSubTypes(selectedSubTypes.slice(0, -1));
              }
            }}
          />
        </div>
        <div className="absolute top-0 right-0">
          <Tooltip content="Specify your performance style or specialization">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-48 overflow-auto">
            {subArtistTypeOptions.filter(o => o.label.toLowerCase().includes((subTypeInput || '').toLowerCase())).length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-gray">No suggestions</div>
            ) : (
              subArtistTypeOptions
                .filter(o => o.label.toLowerCase().includes((subTypeInput || '').toLowerCase()))
                .map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); }}
                    onClick={() => {
                      if (!selectedSubTypes.includes(o.label)) {
                        setSelectedSubTypes([o.label, ...selectedSubTypes]);
                      }
                      setSubTypeInput('');
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm"
                  >
                    {o.label}
                  </button>
                ))
            )}
          </div>
        )}
      </div>

      {/* Achievements and Years of Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="relative">
          <Input
            label="Achievements / Awards"
            value={draft.achievements}
            onChange={(e) => handleInputChange("achievements", e.target.value)}
          />
          <div className="absolute top-0 right-0">
            <Tooltip content="List notable achievements or awards separated by commas">
              <Info size={16} className="text-blue" />
            </Tooltip>
          </div>
        </div>
        <div className="relative">
          <Select
            label="Years of experience*"
            options={experienceOptions}
            value={draft.yearsOfExperience}
            onChange={(value) => handleInputChange("yearsOfExperience", value)}
            required
          />
          <div className="absolute top-0 right-0">
            <Tooltip content="Total years of professional performing experience">
              <Info size={16} className="text-blue" />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Short Bio */}
      <div className="relative">
        <Textarea
          label="Short bio"
          value={draft.shortBio}
          onChange={(e) => handleInputChange("shortBio", e.target.value)}
          placeholder="Tell us about yourself..."
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Write a brief description about yourself and your artistic journey">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex md:justify-end gap-4 items-center md:pt-5 py-2 px-3 fixed md:static bottom-0 left-0 right-0 bg-card md:bg-transparent z-50">
        <Button
          variant="secondary"
          onClick={onReset}
          disabled={isSaving}
          className="w-full md:w-auto text-sm! md:text-base!"
        >
          <span className="gradient-text">Reset</span>
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={isSaving}
          className="w-full md:w-auto text-xs! md:text-base!"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AboutTab;
