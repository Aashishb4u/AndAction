"use client";

import React, { useState } from "react";
import { Filters } from "@/types";
import Select from "@/components/ui/Select";
import Button from "../ui/Button";
import { INDIAN_STATES, INDIAN_CITIES } from "@/lib/constants";
import { useSubArtistTypes } from "@/hooks/use-sub-artist-types";
import { useArtistCategories } from "@/hooks/use-artist-categories";

interface FilterOption {
  value: string;
  label: string;
}

interface ArtistFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onReset: () => void;
  onViewResult?: () => void;
  resultCount?: number;
  className?: string;
}

const genderOptions: FilterOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const budgetOptions: FilterOption[] = [
  { value: "0-50000", label: "₹0 - ₹50,000" },
  { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
  { value: "100000-200000", label: "₹1,00,000 - ₹2,00,000" },
  { value: "200000-500000", label: "₹2,00,000 - ₹5,00,000" },
  { value: "500000+", label: "₹5,00,000+" },
];



const eventTypeOptions: FilterOption[] = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "birthday", label: "Birthday" },
  { value: "festival", label: "Festival" },
  { value: "concert", label: "Concert" },
];

const languageOptions: FilterOption[] = [
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
  { value: "gujarati", label: "Gujarati" },
  { value: "marathi", label: "Marathi" },
  { value: "punjabi", label: "Punjabi" },
];

const locationOptions: FilterOption[] = INDIAN_CITIES;

const FilterSelect: React.FC<{
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ label, value, options, onChange, required = false }) => (
  <div className="mb-6">
    <Select
      label={label}
      value={value}
      options={options}
      onChange={(value) => onChange(value as string)}
      required={required}
      placeholder={`Select ${label}`}
    />
  </div>
);

const ArtistFilters: React.FC<ArtistFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  onViewResult,
  resultCount = 0,
  className = "",
}) => {
  const { categories } = useArtistCategories();
  const categoryOptions: FilterOption[] = categories.map((cat) => ({
    value: cat.value,
    label: cat.label,
  }));

  const { subTypes: subArtistSuggestions } = useSubArtistTypes();
  const [subInput, setSubInput] = useState("");
  const [showSubSuggestions, setShowSubSuggestions] = useState(false);

  // Parse comma-separated subCategory into array
  const selectedSubTypes = filters.subCategory
    ? filters.subCategory.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const addSubType = (value: string) => {
    if (!selectedSubTypes.includes(value)) {
      const next = [...selectedSubTypes, value];
      onFilterChange("subCategory", next.join(","));
    }
  };

  const removeSubType = (value: string) => {
    const next = selectedSubTypes.filter((t) => t !== value);
    onFilterChange("subCategory", next.join(","));
  };

  return (
    <div
      className={`bg-card rounded-2xl border border-border-color h-fit ${className}`}
    >
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4 border-b border-b-[#2D2D2D] p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Filter</h2>
        </div>
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="4"
            y1="8"
            x2="20"
            y2="8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="16"
            cy="8"
            r="3"
            fill="black"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="4"
            y1="16"
            x2="20"
            y2="16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="8"
            cy="16"
            r="3"
            fill="black"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Filter Options */}
      <div className="space-y-1 p-4">
        <FilterSelect
          label="Artist Category"
          value={filters.category}
          options={categoryOptions}
          onChange={(value) => onFilterChange("category", value)}
          required
        />

        {/* Sub-Category (multi-tag with search) */}
        <div className="mb-6 relative">
          <label className="block text-sm text-white mb-1">Sub-Category</label>
          <div className="w-full bg-card border border-border-color rounded-lg px-3 py-2 text-white flex flex-wrap gap-2">
            {selectedSubTypes.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-2 border border-border-color text-sm px-3 py-1 rounded-full">
                <span className="text-white">{tag}</span>
                <button
                  type="button"
                  onClick={() => removeSubType(tag)}
                  className="text-text-gray hover:text-white"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={selectedSubTypes.length === 0 ? "Type to search" : ""}
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
                  if (v) addSubType(v);
                  setSubInput("");
                } else if (e.key === "Backspace" && !subInput && selectedSubTypes.length > 0) {
                  removeSubType(selectedSubTypes[selectedSubTypes.length - 1]);
                }
              }}
              className="flex-1 min-w-[80px] bg-transparent focus:outline-none px-1 py-1 text-sm placeholder-text-gray"
            />
          </div>

          {showSubSuggestions && (
            <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-48 overflow-auto">
              {subArtistSuggestions
                .filter((s) =>
                  s.toLowerCase().includes((subInput || "").toLowerCase()) &&
                  !selectedSubTypes.includes(s)
                )
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      addSubType(s);
                      setSubInput("");
                      setShowSubSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm"
                  >
                    {s}
                  </button>
                ))}
              {subArtistSuggestions.filter((s) =>
                s.toLowerCase().includes((subInput || "").toLowerCase()) &&
                !selectedSubTypes.includes(s)
              ).length === 0 && (
                <div className="px-3 py-2 text-sm text-text-gray">No suggestions</div>
              )}
            </div>
          )}
        </div>

        <FilterSelect
          label="Artist gender"
          value={filters.gender}
          options={genderOptions}
          onChange={(value) => onFilterChange("gender", value)}
        />

        <FilterSelect
          label="Budget"
          value={filters.budget}
          options={budgetOptions}
          onChange={(value) => onFilterChange("budget", value)}
        />

        <FilterSelect
          label="Event State"
          value={filters.eventState}
          options={INDIAN_STATES}
          onChange={(value) => onFilterChange("eventState", value)}
        />

        <FilterSelect
          label="Event type"
          value={filters.eventType}
          options={eventTypeOptions}
          onChange={(value) => onFilterChange("eventType", value)}
        />

        <FilterSelect
          label="Preforming language"
          value={filters.language}
          options={languageOptions}
          onChange={(value) => onFilterChange("language", value)}
        />

        <FilterSelect
          label="Artist Location"
          value={filters.location}
          options={locationOptions}
          onChange={(value) => onFilterChange("location", value)}
        />
      </div>

      {/* View Result Button */}
      <div className="flex gap-4 p-4">
        <Button
          variant="secondary"
          size="xs"
          onClick={onReset}
          className="flex-1 border border-border-color"
        >
          <span className="gradient-text">Reset</span>
        </Button>
        <Button
          variant="primary"
          size="xs"
          className="flex-1 flex items-center justify-center"
          onClick={onViewResult}
        >
          View result ({resultCount})
        </Button>
      </div>
    </div>
  );
};

export default ArtistFilters;
