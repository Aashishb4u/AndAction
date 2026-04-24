"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";
import { INDIAN_STATES, INDIAN_CITIES } from "@/lib/constants";
import { useSubArtistTypes } from "@/hooks/use-sub-artist-types";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import { ArtistProfileSetupPreferences } from "@/types";

export interface FindArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  artistCategory: string;
  subCategory: string[];
  artistGender: string;
  budget: string;
  eventState: string;
  eventDate: string;
  eventType: string;
  performingLanguage: string[];
  location: string;
}

const FindArtistModal: React.FC<FindArtistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    artistCategory: "",
    subCategory: [],
    artistGender: "",
    budget: "",
    eventState: "",
    eventDate: "",
    eventType: "",
    performingLanguage: [],
    location: "",
  });

  // Fetch sub-artist types from database
  const { subTypes: fetchedSubArtistTypes } = useSubArtistTypes();
  const { categories } = useArtistCategories();

  const [preferences, setPreferences] =
    useState<ArtistProfileSetupPreferences | null>(null);

  useEffect(() => {
    if (!isOpen || preferences) return;
    let isActive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/preferences/artist-profile", {
          cache: "no-store",
        });
        const json = await res.json();
        const prefs = json?.data?.preferences as ArtistProfileSetupPreferences;
        if (!isActive) return;
        if (prefs && typeof prefs === "object") setPreferences(prefs);
        else setPreferences(null);
      } catch {
        if (!isActive) return;
        setPreferences(null);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [isOpen, preferences]);

  // Sub-category multi-tag UI state
  const [subInput, setSubInput] = useState<string>("");
  const [showSubSuggestions, setShowSubSuggestions] = useState(false);

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "any", label: "Any" },
  ];

  const budgetOptions = [
    { value: "0-10000", label: "₹0 - ₹10,000" },
    { value: "10000-25000", label: "₹10,000 - ₹25,000" },
    { value: "25000-50000", label: "₹25,000 - ₹50,000" },
    { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
    { value: "100000+", label: "₹1,00,000+" },
  ];



  const locationOptions = INDIAN_CITIES;

  const fallbackEventTypes = [
    { value: "wedding", label: "Wedding" },
    { value: "corporate", label: "Corporate Event" },
    { value: "birthday", label: "Birthday Party" },
    { value: "festival", label: "Festival" },
    { value: "concert", label: "Concert" },
    { value: "other", label: "Other" },
  ];

  const fallbackLanguages = [
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

  const languageOptions = useMemo(() => {
    const list = preferences?.languages;
    return Array.isArray(list) && list.length > 0 ? list : fallbackLanguages;
  }, [preferences]);

  const eventTypeOptions = useMemo(() => {
    const list = preferences?.eventTypes;
    return Array.isArray(list) && list.length > 0 ? list : fallbackEventTypes;
  }, [preferences]);

  const stateOptions = useMemo(() => {
    const list = preferences?.states;
    return Array.isArray(list) && list.length > 0 ? list : INDIAN_STATES;
  }, [preferences]);

  const subArtistSuggestions = useMemo(() => {
    const prefList = Array.isArray(preferences?.subArtistSuggestions)
      ? preferences?.subArtistSuggestions
      : [];
    const merged = [...fetchedSubArtistTypes, ...prefList];
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const item of merged) {
      const v = String(item || "").trim();
      if (!v) continue;
      const key = v.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(v);
    }
    deduped.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return deduped;
  }, [fetchedSubArtistTypes, preferences]);

  // Language dropdown state
  const [showLanguagesDropdown, setShowLanguagesDropdown] = useState(false);

  // Toggle a single language selection
  const toggleLanguageSelection = (langValue: string) => {
    const current = formData.performingLanguage || [];
    let updated: string[];
    if (current.includes(langValue)) {
      updated = current.filter((l) => l !== langValue);
    } else {
      updated = [...current, langValue];
    }
    handleInputChange('performingLanguage', updated);
  };

  // Toggle all languages
  const toggleAllLanguages = () => {
    const allValues = languageOptions.map((l) => l.value);
    if ((formData.performingLanguage || []).length === languageOptions.length) {
      handleInputChange('performingLanguage', []);
    } else {
      handleInputChange('performingLanguage', allValues);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    // For eventDate, ensure only today or future dates are accepted
    if (field === "eventDate" && value && typeof value === "string") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(value);
      inputDate.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        // Ignore or reset if past date
        setFormData((prev) => ({
          ...prev,
          [field]: "",
        }));
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value as any,
    }));
  };

  const handleReset = () => {
    setFormData({
      artistCategory: "",
      subCategory: [],
      artistGender: "",
      budget: "",
      eventState: "",
      eventDate: "",
      eventType: "",
      performingLanguage: [],
      location: "",
    });
    setSubInput("");
  };

  const handleViewResults = () => {
    const params = new URLSearchParams();

    if (formData.artistCategory) params.set("type", formData.artistCategory);
    if (formData.subCategory && formData.subCategory.length > 0) params.set("subType", formData.subCategory.join(","));
    if (formData.artistGender) params.set("gender", formData.artistGender);
    if (formData.budget) params.set("budget", formData.budget);
    if (formData.eventState) params.set("state", formData.eventState);
    if (formData.eventType) params.set("eventType", formData.eventType);
    if (formData.location) params.set("location", formData.location);
    if (formData.performingLanguage && formData.performingLanguage.length > 0) {
      // join multiple selected languages as comma-separated
      params.set("language", (formData.performingLanguage as string[]).join(","));
    }

    // eventDate not used in API but we still pass it
    if (formData.eventDate) params.set("eventDate", formData.eventDate);

    router.push(`/artists?${params.toString()}`);
  };

  const isFormValid = Boolean(
    formData.artistCategory ||
    formData.subCategory.length > 0 ||
    formData.artistGender ||
    formData.budget ||
    formData.eventState ||
    formData.eventDate ||
    formData.eventType ||
    formData.performingLanguage.length > 0 ||
    formData.location,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Find your artist"
      size="full"
      variant="bottom-sheet"
      className="md:max-w-2xl border-none bg-background h-[90vh] md:!h-auto md:!max-h-[90vh]"
      headerClassName="md:px-8 md:py-4 px-4 py-3 text-left"
    >
      <div className="md:px-8 px-4 md:pb-8 pb-4 md:pt-4 pt-4 md:space-y-6 space-y-4">
        {/* Artist Category */}
        <div>
          <label className="secondary-text  block mb-1">Artist Category</label>
          <Select
            placeholder="Select category"
            options={categories}
            value={formData.artistCategory}
            onChange={(value) => handleInputChange("artistCategory", value)}
            required
          />
        </div>

        {/* Sub-Category (multi-tag with searchable suggestions) */}
        <div className="relative">
          <label className="secondary-text block mb-1">Sub-Category</label>
          <div className="w-full bg-card border border-border-color rounded-lg px-3 py-2 text-white flex flex-wrap gap-2">
            {(formData.subCategory || []).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-2 border border-border-color text-sm px-3 py-1 rounded-full">
                <span className="text-white">{tag}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = formData.subCategory.filter((t) => t !== tag);
                    handleInputChange("subCategory", next);
                  }}
                  className="text-text-gray hover:text-white"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={formData.subCategory.length === 0 ? "Type to search sub-category" : ""}
              value={subInput}
              onChange={(e) => {
                setSubInput(e.target.value);
                setShowSubSuggestions(true);
              }}
              onFocus={() => setShowSubSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSubSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const v = subInput.trim().replace(/,$/, "");
                  if (v && !formData.subCategory.includes(v)) {
                    handleInputChange("subCategory", [...formData.subCategory, v]);
                  }
                  setSubInput("");
                } else if (e.key === "Backspace" && !subInput && formData.subCategory.length > 0) {
                  handleInputChange("subCategory", formData.subCategory.slice(0, -1));
                }
              }}
              className="flex-1 min-w-[120px] bg-transparent focus:outline-none px-1 py-1 text-sm placeholder-gray-400"
            />
          </div>

          {showSubSuggestions && (
            <div className="absolute z-40 left-0 right-0 mt-1 bg-background border border-border-color rounded-lg max-h-48 overflow-auto">
              {subArtistSuggestions
                .filter((s) =>
                  s.toLowerCase().includes((subInput || "").toLowerCase()) &&
                  !formData.subCategory.includes(s)
                )
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      handleInputChange("subCategory", [...formData.subCategory, s]);
                      setSubInput("");
                      setShowSubSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#222] transition-colors text-white text-sm"
                  >
                    {s}
                  </button>
                ))}
              {subArtistSuggestions.filter((s) =>
                s.toLowerCase().includes((subInput || "").toLowerCase()) &&
                !formData.subCategory.includes(s)
              ).length === 0 && (
                <div className="px-3 py-2 text-gray-400">No suggestions</div>
              )}
            </div>
          )}
        </div>

        {/* Artist Gender and Budget - Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="secondary-text  block mb-1">Artist gender</label>
            <Select
              placeholder="Select gender"
              options={genderOptions}
              value={formData.artistGender}
              onChange={(value) => handleInputChange("artistGender", value)}
            />
          </div>

          <div>
            <label className="secondary-text  block mb-1">Budget</label>
            <Select
              placeholder="Select budget"
              options={budgetOptions}
              value={formData.budget}
              onChange={(value) => handleInputChange("budget", value)}
            />
          </div>
        </div>

        {/* Event State and Event Date - Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="secondary-text  block mb-1">Event State</label>
            <Select
              placeholder="Select state"
              options={stateOptions}
              value={formData.eventState}
              onChange={(value) => handleInputChange("eventState", value)}
            />
          </div>
          <div>
            <label className="secondary-text  block mb-1">Event date</label>
            <DateInput
              placeholder="DD/MM/YYYY"
              value={formData.eventDate || null}
              onChange={(value) => handleInputChange("eventDate", value)}
              minDate={new Date()}
            />
          </div>
        </div>

        {/* Event Type and Artist Location - Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="secondary-text  block mb-1">Event type</label>
            <Select
              placeholder="Select event type"
              options={eventTypeOptions}
              value={formData.eventType}
              onChange={(value) => handleInputChange("eventType", value)}
            />
          </div>
          <div>
            <label className="secondary-text  block mb-1">Artist Location</label>
            <Select
              placeholder="Select location"
              options={locationOptions}
              value={formData.location}
              onChange={(value) => handleInputChange("location", value)}
            />
          </div>
        </div>

        {/* Performing Language */}
        <div className="relative">
          <label className="secondary-text  block mb-1">Performing language</label>

          <button
            type="button"
            onClick={() => setShowLanguagesDropdown(!showLanguagesDropdown)}
            className="w-full px-4 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between"
          >
            <div className="flex-1 flex flex-wrap gap-2 items-center">
              {(formData.performingLanguage || []).length === 0 ? (
                <span className="text-text-gray">Select languages</span>
              ) : (formData.performingLanguage || []).length === languageOptions.length ? (
                <span className="text-white">All Languages</span>
              ) : (
                (formData.performingLanguage || []).map((val) => {
                  const label = languageOptions.find((l) => l.value === val)?.label || val;
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLanguagesDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]"
                onClick={() => setShowLanguagesDropdown(false)}
              />

              {/* Full-screen language picker */}
              <div className="fixed inset-0 md:inset-auto md:absolute md:left-0 md:right-0 md:mt-1 z-[99999] flex flex-col bg-background md:bg-card md:border md:border-border-color md:rounded-lg md:shadow-lg md:max-h-80">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
                  <h3 className="text-white font-semibold text-lg">Select Languages</h3>
                  <button
                    type="button"
                    onClick={() => setShowLanguagesDropdown(false)}
                    className="p-1 text-text-gray hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto">
                  <label className="flex items-center gap-3 px-5 py-3 hover:bg-background-light cursor-pointer border-b border-border-color">
                    <input
                      type="checkbox"
                      checked={(formData.performingLanguage || []).length === languageOptions.length}
                      onChange={toggleAllLanguages}
                      className="w-5 h-5 accent-primary-pink rounded"
                    />
                    <span className="text-white font-medium">All Languages</span>
                  </label>

                  {languageOptions.map((language) => (
                    <label
                      key={language.value}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-background-light cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.performingLanguage || []).includes(language.value)}
                        onChange={() => toggleLanguageSelection(language.value)}
                        className="w-5 h-5 accent-primary-pink rounded"
                      />
                      <span className="text-white">{language.label}</span>
                    </label>
                  ))}
                </div>

                {/* Done button */}
                <div className="px-5 py-4 border-t border-border-color">
                  <button
                    type="button"
                    onClick={() => setShowLanguagesDropdown(false)}
                    className="w-full py-3 bg-gradient-to-r from-primary-orange to-primary-pink text-white font-semibold rounded-lg"
                  >
                    Done {(formData.performingLanguage || []).length > 0 && `(${(formData.performingLanguage || []).length})`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex gap-4 pt-4 sticky bottom-4 bg-background py-4 secondary-grey-text">
          <Button
            variant="secondary"
            size="md"
            onClick={handleReset}
            className="md:flex-1 text-primary-pink bg-[#1B1B1B]! "
          >
            <span className="gradient-text secondary-grey-text">Reset</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleViewResults}
            disabled={!isFormValid}
            className="md:flex-1"
          >
            <span className="secondary-grey-text">View result</span>
          </Button>
        </div>
        <div className="flex whitespace-nowrap md:hidden gap-4 pt-4 sticky bottom-4 bg-background py-4 secondary-grey-text">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="flex-1 text-primary-pink bg-[#1B1B1B]! "
          >
            <span className="gradient-text secondary-grey-text">Reset</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleViewResults}
            disabled={!isFormValid}
            className="flex-1"
          >
            <span className="secondary-grey-text">View result</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FindArtistModal;
