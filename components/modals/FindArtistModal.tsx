"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";
import { ARTIST_CATEGORIES } from "@/lib/constants";
import { INDIAN_STATES } from "@/lib/constants";

export interface FindArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  artistCategory: string;
  subCategory: string;
  artistGender: string;
  budget: string;
  eventState: string;
  eventDate: string;
  eventType: string;
  performingLanguage: string;
}

const FindArtistModal: React.FC<FindArtistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    artistCategory: "",
    subCategory: "",
    artistGender: "",
    budget: "",
    eventState: "",
    eventDate: "",
    eventType: "",
    performingLanguage: "",
  });

  // Form options (updated mapping)
  const artistCategories = [
    { value: "singers", label: "Singer" },
    { value: "dancers", label: "Dancer / Dance Group" },
    { value: "anchors", label: "Anchor / Emcee / Host" },
    { value: "djs", label: "DJ" },
    { value: "bands", label: "Live Band / Group" },
    { value: "comedians", label: "Comedian" },
    { value: "musicians", label: "Musician / Instrumentalist" },
    { value: "magicians", label: "Magician / Illusionist" },
    { value: "actors", label: "Theatre Artist / Actor" },
    { value: "mimicry", label: "Mimicry / Impressionist" },
    { value: "specialAct", label: "Special Act Performer" },
    { value: "spiritual", label: "Spiritual / Devotional" },
    { value: "kidsEntertainers", label: "Kids Entertainer" },
  ];

  const subCategories = [
    { value: "bollywood", label: "Bollywood" },
    { value: "classical", label: "Classical" },
    { value: "folk", label: "Folk" },
    { value: "western", label: "Western" },
    { value: "fusion", label: "Fusion" },
  ];
  // Sub-category search UI state
  const [subInput, setSubInput] = useState<string>(
    subCategories.find((s) => s.value === "") ? "" : "",
  );
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



  const eventTypes = [
    { value: "wedding", label: "Wedding" },
    { value: "corporate", label: "Corporate Event" },
    { value: "birthday", label: "Birthday Party" },
    { value: "festival", label: "Festival" },
    { value: "concert", label: "Concert" },
    { value: "other", label: "Other" },
  ];

  const languages = [
    { value: "hindi", label: "Hindi" },
    { value: "english", label: "English" },
    { value: "marathi", label: "Marathi" },
    { value: "gujarati", label: "Gujarati" },
    { value: "punjabi", label: "Punjabi" },
    { value: "tamil", label: "Tamil" },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    // For eventDate, ensure only today or future dates are accepted
    if (field === "eventDate" && value) {
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
      [field]: value,
    }));
  };

  const handleReset = () => {
    setFormData({
      artistCategory: "",
      subCategory: "",
      artistGender: "",
      budget: "",
      eventState: "",
      eventDate: "",
      eventType: "",
      performingLanguage: "",
    });
  };

  const handleViewResults = () => {
    const params = new URLSearchParams();

    if (formData.artistCategory) params.set("type", formData.artistCategory);
    if (formData.subCategory) params.set("subType", formData.subCategory);
    if (formData.artistGender) params.set("gender", formData.artistGender);
    if (formData.budget) params.set("budget", formData.budget);
    if (formData.eventState) params.set("state", formData.eventState);
    if (formData.eventType) params.set("eventType", formData.eventType);
    if (formData.performingLanguage)
      params.set("language", formData.performingLanguage);

    // eventDate not used in API but we still pass it
    if (formData.eventDate) params.set("eventDate", formData.eventDate);

    router.push(`/artists?${params.toString()}`);
  };

  const isFormValid = formData.artistCategory;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Find your artist"
      size="full"
      variant="bottom-sheet"
      className="max-w-2xl border-none bg-background h-[90vh] md:!h-auto md:!max-h-[90vh]"
      headerClassName="md:px-8 md:py-4 px-4 py-3"
    >
      <div className="md:px-8 px-4 md:pb-8 pb-4 md:pt-4 pt-4 md:space-y-6 space-y-4">
        {/* Artist Category */}
        <div>
          <label className="secondary-text  block mb-1">Artist Category</label>
          <Select
            placeholder="Select category"
            options={ARTIST_CATEGORIES}
            value={formData.artistCategory}
            onChange={(value) => handleInputChange("artistCategory", value)}
            required
          />
        </div>

        {/* Sub-Category (searchable with recommendations) */}
        <div className="relative">
          <label className="secondary-text block mb-1">Sub-Category</label>
          <input
            type="text"
            value={
              // show label if selected value present, otherwise show typed text
              subInput ||
              subCategories.find((s) => s.value === formData.subCategory)
                ?.label ||
              ""
            }
            onChange={(e) => {
              const v = e.target.value;
              setSubInput(v);
              // clear actual stored subCategory until user selects a suggestion
              handleInputChange("subCategory", "");
              setShowSubSuggestions(true);
            }}
            onFocus={() => setShowSubSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSubSuggestions(false), 150)}
            placeholder="Type to search sub-category"
            className="w-full px-3 py-2 bg-card border border-border-color rounded-lg text-white placeholder-gray-400"
          />

          {showSubSuggestions && (
            <div className="absolute z-40 left-0 right-0 mt-1 bg-background border border-border-color rounded-lg max-h-48 overflow-auto">
              {subCategories
                .filter((s) =>
                  s.label
                    .toLowerCase()
                    .includes((subInput || "").toLowerCase()),
                )
                .map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      // set value (used in query) and display label
                      handleInputChange("subCategory", s.value);
                      setSubInput(s.label);
                      setShowSubSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#222] transition-colors text-white"
                  >
                    {s.label}
                  </button>
                ))}
              {subCategories.filter((s) =>
                s.label.toLowerCase().includes((subInput || "").toLowerCase()),
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
              options={INDIAN_STATES}
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

        {/* Event Type */}
        <div>
          <label className="secondary-text  block mb-1">Event type</label>
          <Select
            placeholder="Select event type"
            options={eventTypes}
            value={formData.eventType}
            onChange={(value) => handleInputChange("eventType", value)}
          />
        </div>

        {/* Performing Language */}
        <div>
          <label className="secondary-text  block mb-1">
            Performing language
          </label>
          <Select
            placeholder="Select language"
            options={languages}
            value={formData.performingLanguage}
            onChange={(value) => handleInputChange("performingLanguage", value)}
          />
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
