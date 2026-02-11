"use client";

import React from "react";
import { Filters } from "@/types";
import Select from "@/components/ui/Select";
import Button from "../ui/Button";
import { VIDEO_CATEGORIES } from "@/lib/constants";

interface FilterOption {
  value: string;
  label: string;
}

interface ArtistFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onReset: () => void;
  onViewResult?: () => void; // NEW: handler for View Result button
  resultCount?: number;
  className?: string;
}

// Use categories from constants, excluding 'all'
const categoryOptions: FilterOption[] = VIDEO_CATEGORIES.filter(
  (cat) => cat.value !== "all",
).map((cat) => ({ value: cat.value, label: cat.label }));

const subCategoryOptions: FilterOption[] = [
  { value: "bollywood", label: "Bollywood" },
  { value: "classical", label: "Classical" },
  { value: "folk", label: "Folk" },
  { value: "western", label: "Western" },
  { value: "devotional", label: "Devotional" },
];

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

const eventStateOptions: FilterOption[] = [
  { value: "maharashtra", label: "Maharashtra" },
  { value: "gujarat", label: "Gujarat" },
  { value: "delhi", label: "Delhi" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bangalore", label: "Bangalore" },
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
      onChange={onChange}
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

        <FilterSelect
          label="Sub-Category"
          value={filters.subCategory}
          options={subCategoryOptions}
          onChange={(value) => onFilterChange("subCategory", value)}
        />

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
          options={eventStateOptions}
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
