"use client";

import React, { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Tooltip from "@/components/ui/Tooltip";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { Info } from "lucide-react";
import { INDIAN_STATES } from "@/lib/constants";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import { useSubArtistTypes } from "@/hooks/use-sub-artist-types";
import { canonicalizeCityValue, useIndianCitiesByState } from "@/hooks/use-indian-cities";
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
  const isSubArtistDisabled = !(draft.artistType || "").trim();
  const {
    subTypes: subArtistSuggestions,
    refetch: refetchSubArtistSuggestions,
  } = useSubArtistTypes(isSubArtistDisabled ? undefined : draft.artistType);

  const selectedSubTypes = draft.subArtistTypes;
  const setSelectedSubTypes = (next: string[]) =>
    setDraft((prev) => ({ ...prev, subArtistTypes: next }));

  const [subTypeInput, setSubTypeInput] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [achievementInput, setAchievementInput] = useState("");
  const [achievementChips, setAchievementChips] = useState<string[]>(() => {
    return draft.achievements
      ? draft.achievements
          .split(/[,\n]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const { cityOptions, isFetching: isFetchingCities } = useIndianCitiesByState(draft.state);

  const stateOptions = useMemo(() => {
    if (!draft.state) return INDIAN_STATES;
    if (INDIAN_STATES.some((s) => s.value === draft.state)) return INDIAN_STATES;
    return [{ value: draft.state, label: draft.state }, ...INDIAN_STATES];
  }, [draft.state]);

  const cityOptionsWithCurrent = useMemo(() => {
    if (!draft.city) return cityOptions;
    if (cityOptions.some((c) => c.value === draft.city)) return cityOptions;
    return [{ value: draft.city, label: draft.city }, ...cityOptions];
  }, [draft.city, cityOptions]);

  useEffect(() => {
    if (!draft.city) return;
    if (!Array.isArray(cityOptions) || cityOptions.length === 0) return;
    const canonical = canonicalizeCityValue(draft.city, cityOptions);
    if (canonical !== draft.city) {
      setDraft((prev) => ({ ...prev, city: canonical }));
    }
  }, [draft.city, cityOptions, setDraft]);

  const handleInputChange = <K extends keyof AboutDraft>(
    field: K,
    value: AboutDraft[K],
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const normalizeSubType = (value: string) => value.trim().toLowerCase();

  const createSubArtistTypeInDb = async (label: string) => {
    const category = (draft.artistType || "").trim();
    const trimmedLabel = (label || "").trim();
    if (!category || !trimmedLabel) return;

    await fetch("/api/artists/sub-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, label: trimmedLabel }),
    }).catch(() => {});

    refetchSubArtistSuggestions();
  };

  const addSubTypeTag = (rawValue: string) => {
    const v = (rawValue || "").trim();
    if (!v) return;

    setSelectedSubTypes(
      selectedSubTypes.some((t) => normalizeSubType(t) === normalizeSubType(v))
        ? selectedSubTypes
        : [v, ...selectedSubTypes],
    );
  };

  useEffect(() => {
    const chips = draft.achievements
      ? draft.achievements
          .split(/[,\n]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    setAchievementChips(chips);
  }, [draft.achievements]);

  const syncAchievementChips = (chips: string[]) => {
    setAchievementChips(chips);
    setDraft((prev) => ({
      ...prev,
      achievements: chips.join(", "),
    }));
  };

  const addAchievementChips = (value: string) => {
    const items = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!items.length) return;

    const nextChips = [...achievementChips];
    items.forEach((item) => {
      if (!nextChips.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
        nextChips.push(item);
      }
    });

    syncAchievementChips(nextChips);
  };

  const handleAchievementBlur = () => {
    addAchievementChips(achievementInput);
    setAchievementInput("");
  };

  const handleAchievementKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAchievementChips(achievementInput);
      setAchievementInput("");
    }
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
          const resolvedCity = String(data.data.city || data.data.district || "").trim();

          setDraft((prev) => ({
            ...prev,
            state: normalizedState || prev.state,
            city: resolvedCity || prev.city,
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
        onChange={(value) => {
          setDraft((prev) => ({
            ...prev,
            address: value,
            latitude: null,
            longitude: null,
          }));
        }}
        onLocationSelect={(loc) => {
          setDraft((prev) => ({
            ...prev,
            address: loc.address,
            pinCode: loc.pinCode || prev.pinCode,
            state: loc.state || prev.state,
            city: loc.city || prev.city,
            latitude:
              typeof loc.latitude === "number" && Number.isFinite(loc.latitude)
                ? loc.latitude
                : null,
            longitude:
              typeof loc.longitude === "number" && Number.isFinite(loc.longitude)
                ? loc.longitude
                : null,
          }));
        }}
        required
      />

      {/* PIN Code, State, City */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="PIN code*"
          value={draft.pinCode}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              pinCode: e.target.value.replace(/\D/g, "").slice(0, 6),
              latitude: null,
              longitude: null,
            }))
          }
          maxLength={6}
          required
        />
        <Select
          label="State*"
          options={stateOptions}
          value={draft.state}
          onChange={(value) => {
            setDraft((prev) => ({
              ...prev,
              state: value as string,
              city: "",
              latitude: null,
              longitude: null,
            }));
          }}
          disabled={isFetchingLocation}
          required
        />
        <Select
          label="City*"
          options={cityOptionsWithCurrent}
          value={draft.city}
          onChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              city: value,
              latitude: null,
              longitude: null,
            }))
          }
          disabled={isFetchingLocation || !draft.state || isFetchingCities}
          helperText={
            !draft.state ? "Select state first" : isFetchingCities ? "Loading cities..." : undefined
          }
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
          onChange={(value) => {
            handleInputChange("artistType", value);
            handleInputChange("subArtistTypes", []);
            setSubTypeInput("");
            setShowSuggestions(false);
          }}
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
        <div className="w-full bg-card border border-border-color rounded-lg text-white flex flex-wrap gap-2">
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
            placeholder={
              isSubArtistDisabled
                ? "Select artist type first"
                : "e.g. Classical, Bollywood, Fusion"
            }
            value={subTypeInput}
            disabled={isSubArtistDisabled}
            onChange={(e) => {
              if (isSubArtistDisabled) return;
              setSubTypeInput(e.target.value);
            }}
            onFocus={() => {
              if (isSubArtistDisabled) return;
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (isSubArtistDisabled) return;
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const v = subTypeInput.trim().replace(/,$/, '');
                if (v) {
                  addSubTypeTag(v);
                  createSubArtistTypeInDb(v);
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
        {showSuggestions && !isSubArtistDisabled && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-48 overflow-auto">
            {subTypeInput.trim() && (
              <button
                key="typed-input"
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => {
                  const v = subTypeInput.trim();
                  addSubTypeTag(v);
                  createSubArtistTypeInDb(v);
                  setSubTypeInput("");
                }}
                className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm border-b border-border-color"
              >
                Add "{subTypeInput.trim()}"
              </button>
            )}

            {subArtistSuggestions
              .filter(
                (s) =>
                  s.toLowerCase().includes((subTypeInput || "").toLowerCase()) &&
                  !selectedSubTypes.some(
                    (t) => normalizeSubType(t) === normalizeSubType(s),
                  ),
              )
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    addSubTypeTag(s);
                    setSubTypeInput("");
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm"
                >
                  {s}
                </button>
              ))}

            {!subTypeInput.trim() &&
              subArtistSuggestions.filter(
                (s) =>
                  !selectedSubTypes.some(
                    (t) => normalizeSubType(t) === normalizeSubType(s),
                  ),
              ).length === 0 && (
                <div className="px-3 py-2 text-sm text-text-gray">
                  No suggestions
                </div>
              )}
          </div>
        )}
      </div>

      {/* Achievements and Years of Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="relative">
          <label className="block secondary-text text-white mb-2">
            Achievements / Awards
          </label>
          <div className="w-full bg-card border border-border-color rounded-lg p-3 text-white flex flex-wrap gap-2 min-h-[4rem]">
            {achievementChips.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="inline-flex items-center gap-2 bg-background px-3 py-1.5 rounded-full text-sm"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = achievementChips.filter((_, idx) => idx !== index);
                    syncAchievementChips(next);
                  }}
                  className="text-text-gray hover:text-white"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              className="flex-1 min-w-[10rem] bg-transparent text-white placeholder-text-gray outline-none border-none px-1 py-1 text-sm"
              placeholder="Press Enter to add a new achievement"
              value={achievementInput}
              onChange={(e) => setAchievementInput(e.target.value)}
              onKeyDown={handleAchievementKeyDown}
              onBlur={handleAchievementBlur}
            />
          </div>
          <div className="absolute top-0 right-0">
            <Tooltip content="List notable achievements or awards. Press Enter to add each item as a separate entry.">
              <Info size={16} className="text-blue" />
            </Tooltip>
          </div>
          <p className="mt-2 text-sm text-text-gray">
            Press Enter to add each achievement or award as a separate item.
          </p>
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
      <div className="fixed bottom-0 left-0 right-0 bg-card px-2 py-3 flex gap-8 items-center z-50 md:static md:mt-6 md:z-auto">
        <Button
          variant="secondary"
          onClick={onReset}
          disabled={isSaving}
          className="flex-1"
        >
          <span className="gradient-text">Reset</span>
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AboutTab;
