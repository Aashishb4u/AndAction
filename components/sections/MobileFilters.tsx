"use client";

import React, { useState, useEffect, useRef } from "react";
import { Filters } from "@/types";
import Select from "@/components/ui/Select";
import Button from "../ui/Button";

interface FilterOption {
  value: string;
  label: string;
}

interface MobileFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onReset: () => void;
  className?: string;
}

// Filter options - matching desktop version exactly
const categoryOptions: FilterOption[] = [
  { value: "", label: "Select Category" },
  { value: "singer", label: "Singer" },
  { value: "anchor", label: "Anchor/emcee" },
  { value: "band", label: "Live Band" },
  { value: "dj", label: "DJ / VJ" },
  { value: "dancer", label: "Dancer" },
  { value: "comedian", label: "Comedian" },
];

const subCategoryOptions: FilterOption[] = [
  { value: "", label: "Select sub-category" },
  { value: "bollywood", label: "Bollywood" },
  { value: "classical", label: "Classical" },
  { value: "folk", label: "Folk" },
  { value: "western", label: "Western" },
  { value: "devotional", label: "Devotional" },
];

const genderOptions: FilterOption[] = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const budgetOptions: FilterOption[] = [
  { value: "", label: "Select budget" },
  { value: "0-50000", label: "₹0 - ₹50,000" },
  { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
  { value: "100000-200000", label: "₹1,00,000 - ₹2,00,000" },
  { value: "200000-500000", label: "₹2,00,000 - ₹5,00,000" },
  { value: "500000+", label: "₹5,00,000+" },
];

const eventStateOptions: FilterOption[] = [
  { value: "", label: "Select State" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "gujarat", label: "Gujarat" },
  { value: "delhi", label: "Delhi" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bangalore", label: "Bangalore" },
];

const eventTypeOptions: FilterOption[] = [
  { value: "", label: "Select event type" },
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "birthday", label: "Birthday" },
  { value: "festival", label: "Festival" },
  { value: "concert", label: "Concert" },
];

const languageOptions: FilterOption[] = [
  { value: "", label: "Select language" },
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
  { value: "gujarati", label: "Gujarati" },
  { value: "marathi", label: "Marathi" },
  { value: "punjabi", label: "Punjabi" },
];

const MobileFilters: React.FC<MobileFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  className = "",
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeDropdown]);

  const getFilterLabel = (filterKey: string, value: string) => {
    if (!value) return filterKey.charAt(0).toUpperCase() + filterKey.slice(1);

    const optionsMap: { [key: string]: FilterOption[] } = {
      category: categoryOptions,
      budget: budgetOptions,
      language: languageOptions,
    };

    const options = optionsMap[filterKey];
    const option = options?.find((opt) => opt.value === value);
    return option?.label || value;
  };

  const filterChips = [
    { key: "category", label: getFilterLabel("category", filters.category) },
    { key: "budget", label: getFilterLabel("budget", filters.budget) },
    { key: "language", label: getFilterLabel("language", filters.language) },
  ];

  const FilterChip: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border filter-chip whitespace-nowrap flex-shrink-0 btn2 ${isActive
          ? "bg-primary-pink border-primary-pink text-white"
          : "bg-background border-border-color text-gray-300 hover:border-gray-500"
        }`}
    >
      <span>{label}</span>
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
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        <div className="px-4 py-4 border-b border-gray-800 bg-card">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-primary-pink whitespace-nowrap flex-shrink-0 btn2"
            >
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                />
              </svg>
              Filter
            </button>

            {/* Filter Chips */}
            {filterChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                isActive={activeDropdown === chip.key}
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === chip.key ? null : chip.key
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Dropdown positioned outside scrollable container */}
        {activeDropdown && (
          <div className="absolute top-full left-4 mt-2 w-64 bg-card border border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {(() => {
              const optionsMap: { [key: string]: FilterOption[] } = {
                category: categoryOptions,
                budget: budgetOptions,
                language: languageOptions,
              };
              return optionsMap[activeDropdown]?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange(activeDropdown, option.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-background transition-colors first:rounded-t-lg last:rounded-b-lg ${filters[activeDropdown as keyof Filters] === option.value
                      ? "bg-primary-pink/20 text-primary-pink"
                      : "text-white"
                    }`}
                >
                  {option.label}
                </button>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFilterModal(false)}
          />

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[80vh] overflow-hidden mobile-filter-modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Filters</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] modal-scroll">
              <div className="space-y-6">
                {/* Artist Category */}
                <div>
                  <Select
                    label="Artist Category"
                    value={filters.category}
                    options={categoryOptions}
                    onChange={(value) => onFilterChange("category", value)}
                    required
                    placeholder="Select Category"
                  />
                </div>

                {/* Sub-Category */}
                <div>
                  <Select
                    label="Sub-Category"
                    value={filters.subCategory}
                    options={subCategoryOptions}
                    onChange={(value) => onFilterChange("subCategory", value)}
                    placeholder="Select sub-category"
                  />
                </div>

                {/* Artist Gender */}
                <div>
                  <Select
                    label="Artist gender"
                    value={filters.gender}
                    options={genderOptions}
                    onChange={(value) => onFilterChange("gender", value)}
                    placeholder="Select gender"
                  />
                </div>

                {/* Budget */}
                <div>
                  <Select
                    label="Budget"
                    value={filters.budget}
                    options={budgetOptions}
                    onChange={(value) => onFilterChange("budget", value)}
                    placeholder="Select budget"
                  />
                </div>

                {/* Event State */}
                <div>
                  <Select
                    label="Event State"
                    value={filters.eventState}
                    options={eventStateOptions}
                    onChange={(value) => onFilterChange("eventState", value)}
                    placeholder="Select State"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <Select
                    label="Event type"
                    value={filters.eventType}
                    options={eventTypeOptions}
                    onChange={(value) => onFilterChange("eventType", value)}
                    placeholder="Select event type"
                  />
                </div>

                {/* Performing Language */}
                <div>
                  <Select
                    label="Preforming language"
                    value={filters.language}
                    options={languageOptions}
                    onChange={(value) => onFilterChange("language", value)}
                    placeholder="Select language"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <Button
                variant="secondary"
                size="xs"
                onClick={onReset}
                className="flex-1"
              >
                <span className="gradient-text">Reset</span>
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={() => setShowFilterModal(false)}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileFilters;
