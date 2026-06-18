"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { formatDisplayLabel } from "@/lib/utils";
import { ArtistProfileSetupPreferences, Filters } from "@/types";
import Select from "@/components/ui/Select";
import Button from "../ui/Button";
import { INDIAN_STATES } from "@/lib/constants";
import { useSubArtistTypes } from "@/hooks/use-sub-artist-types";
import { useArtistCategories } from "@/hooks/use-artist-categories";

interface FilterOption {
  value: string;
  label: string;
}

interface MobileFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onReset: () => void;
  onViewResult?: () => void; // NEW: handler for View Result button
  resultCount?: number;
  className?: string;
}

const fallbackGenderOptions: FilterOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const fallbackBudgetOptions: FilterOption[] = [
  { value: "0-10000", label: "₹0 - ₹10,000" },
  { value: "10000-25000", label: "₹10,000 - ₹25,000" },
  { value: "25000-50000", label: "₹25,000 - ₹50,000" },
  { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
  { value: "100000+", label: "₹1,00,000+" },
];

const fallbackEventTypeOptions: FilterOption[] = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "birthday", label: "Birthday" },
  { value: "festival", label: "Festival" },
  { value: "concert", label: "Concert" },
];

const fallbackLanguageOptions: FilterOption[] = [
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
  onViewResult,
  resultCount = 0,
  className = "",
}) => {
  const { categories } = useArtistCategories();
  const categoryOptions: FilterOption[] = [
    { value: "", label: "Select Category" },
    ...categories.map((cat) => ({ value: cat.value, label: cat.label })),
  ];

  const [preferences, setPreferences] =
    useState<ArtistProfileSetupPreferences | null>(null);

  useEffect(() => {
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
  }, []);

  const genderOptions: FilterOption[] = useMemo(() => {
    const list = preferences?.genders;
    const base =
      Array.isArray(list) && list.length > 0 ? list : fallbackGenderOptions;
    return [{ value: "", label: "Select gender" }, ...base];
  }, [preferences]);

  const budgetOptions: FilterOption[] = useMemo(() => {
    const list = preferences?.budgets;
    const base =
      Array.isArray(list) && list.length > 0 ? list : fallbackBudgetOptions;
    return [{ value: "", label: "Select budget" }, ...base];
  }, [preferences]);

  const eventTypeOptions: FilterOption[] = useMemo(() => {
    const list = preferences?.eventTypes;
    const base =
      Array.isArray(list) && list.length > 0 ? list : fallbackEventTypeOptions;
    return [{ value: "", label: "Select event type" }, ...base];
  }, [preferences]);

  const languageOptions: FilterOption[] = useMemo(() => {
    const list = preferences?.languages;
    const base =
      Array.isArray(list) && list.length > 0 ? list : fallbackLanguageOptions;
    return [{ value: "", label: "Select language" }, ...base];
  }, [preferences]);

  const stateOptions: FilterOption[] = useMemo(() => {
    const list = preferences?.states;
    const base = Array.isArray(list) && list.length > 0 ? list : INDIAN_STATES;
    return [{ value: "", label: "Select state" }, ...base];
  }, [preferences]);

  const eventStateOptions = stateOptions;
  const locationOptions = stateOptions;

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sub-category multi-tag state
  const isSubCategoryDisabled = !filters.category;
  const { subTypes: subArtistSuggestions } = useSubArtistTypes(
    isSubCategoryDisabled ? undefined : filters.category,
  );
  const [subInput, setSubInput] = useState("");
  const [showSubSuggestions, setShowSubSuggestions] = useState(false);

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
    if (!value) {
      if (filterKey === "location") {
        return "Artist Location";
      }
      return filterKey.charAt(0).toUpperCase() + filterKey.slice(1);
    }

    const optionsMap: { [key: string]: FilterOption[] } = {
      category: categoryOptions,
      budget: budgetOptions,
      language: languageOptions,
      location: locationOptions,
    };

    const options = optionsMap[filterKey];
    const option = options?.find((opt) => opt.value === value);
    return option?.label || formatDisplayLabel(value);
  };

  const filterChips = [
    { key: "category", label: getFilterLabel("category", filters.category) },
    { key: "budget", label: getFilterLabel("budget", filters.budget) },
    { key: "language", label: getFilterLabel("language", filters.language) },
    { key: "location", label: getFilterLabel("location", filters.location) },
  ];

  const FilterChip: React.FC<{
    label: string;
    isOpen: boolean;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ label, isOpen, isSelected, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border filter-chip whitespace-nowrap flex-shrink-0 btn2 ${
          isSelected
            ? "category-btn-gradient border-transparent text-white"
          : isOpen
            ? "bg-background border-primary-pink text-white"
            : "bg-background border-[#2D2D2D] text-gray-300 hover:border-gray-500"
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
        <div className=" border-b border-[var(--border-color)] bg-card">
          <div
            className="flex px-4 py-4 items-center gap-2 overflow-x-auto scrollbar-hide"
            style={{
              maskImage: "linear-gradient(to right, black 85%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 85%, transparent 100%)",
            }}
          >
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-1 px-4 py-2 bg-white rounded-full whitespace-nowrap flex-shrink-0 btn2"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <defs>
                  <linearGradient
                    id="mobileFilterIconGradient"
                    x1="0"
                    y1="0"
                    x2="24"
                    y2="24"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="var(--primary-orange)" />
                    <stop offset="100%" stopColor="var(--primary-pink)" />
                  </linearGradient>
                </defs>
                <line
                  x1="4"
                  y1="8"
                  x2="20"
                  y2="8"
                  stroke="url(#mobileFilterIconGradient)"
                  strokeLinecap="round"
                  strokeWidth={2}
                />
                <circle
                  cx="16"
                  cy="8"
                  r="3"
                  fill="white"
                  stroke="url(#mobileFilterIconGradient)"
                  strokeWidth={2}
                />
                <line
                  x1="4"
                  y1="16"
                  x2="20"
                  y2="16"
                  stroke="url(#mobileFilterIconGradient)"
                  strokeLinecap="round"
                  strokeWidth={2}
                />
                <circle
                  cx="8"
                  cy="16"
                  r="3"
                  fill="white"
                  stroke="url(#mobileFilterIconGradient)"
                  strokeWidth={2}
                />
              </svg>
              <span className="gradient-text">Filter</span>
            </button>

            {/* Divider */}
            <div className="h-8 w-px [background:var(--border-gradient-light)] mx-1 flex-shrink-0" />

            {/* Filter Chips */}
            {filterChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                isOpen={activeDropdown === chip.key}
                isSelected={Boolean(filters[chip.key as keyof Filters])}
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === chip.key ? null : chip.key,
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
                location: locationOptions,
              };
              return optionsMap[activeDropdown]?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange(activeDropdown as keyof Filters, option.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-background transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    filters[activeDropdown as keyof Filters] === option.value
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
          <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] rounded-t-2xl max-h-[80vh] overflow-hidden mobile-filter-modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#4b4b4b]">
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
                    onChange={(value) => {
                      onFilterChange("category", value as string);
                      setSubInput("");
                      setShowSubSuggestions(false);
                    }}
                    required
                    placeholder="Select Category"
                  />
                </div>

                {/* Sub-Category (multi-tag) */}
                <div className="relative">
                  <label className="block text-sm text-white mb-1">Sub-Category</label>
                  <div className="w-full bg-card border border-border-color rounded-lg text-white flex flex-wrap items-center gap-2 px-3 py-2">
                    {selectedSubTypes.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 border border-border-color bg-background/80 text-sm px-2 py-1 rounded-full">
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
                      placeholder={
                        isSubCategoryDisabled
                          ? "Select category first"
                          : selectedSubTypes.length === 0
                            ? "Type to search sub-category"
                            : ""
                      }
                      value={subInput}
                      onChange={(e) => {
                        if (isSubCategoryDisabled) return;
                        setSubInput(e.target.value);
                        setShowSubSuggestions(true);
                      }}
                      disabled={isSubCategoryDisabled}
                      onFocus={() => {
                        if (isSubCategoryDisabled) return;
                        setShowSubSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowSubSuggestions(false), 150)}
                      onKeyDown={(e) => {
                        if (isSubCategoryDisabled) return;
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const v = subInput.trim().replace(/,$/, "");
                          if (v) addSubType(v);
                          setSubInput("");
                        } else if (e.key === "Backspace" && !subInput && selectedSubTypes.length > 0) {
                          removeSubType(selectedSubTypes[selectedSubTypes.length - 1]);
                        }
                      }}
                      className="flex-1 min-w-[80px] bg-transparent focus:outline-none px-2 py-1 text-sm placeholder-text-gray"
                    />
                  </div>

                  {showSubSuggestions && !isSubCategoryDisabled && (
                    <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-48 overflow-auto">
                      {/* Always show typed text as first suggestion if not empty */}
                      {subInput.trim() && (
                        <button
                          key="typed-input"
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            addSubType(subInput.trim());
                            setSubInput("");
                            // Keep dropdown open so newly added item appears in suggestions
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm border-b border-border-color"
                        >
                          Add "{subInput.trim()}"
                        </button>
                      )}
                      
                      {/* Show existing suggestions */}
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
                              // Keep dropdown open for continuous selection
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm"
                          >
                            {s}
                          </button>
                        ))}
                        
                      {/* Show no suggestions only if no input and no matches */}
                      {!subInput.trim() && subArtistSuggestions.filter((s) =>
                        !selectedSubTypes.includes(s)
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-text-gray">No suggestions</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Artist Gender */}
                <div>
                  <Select
                    label="Artist gender"
                    value={filters.gender}
                    options={genderOptions}
                    onChange={(value) => onFilterChange("gender", value as string)}
                    placeholder="Select gender"
                  />
                </div>

                {/* Budget */}
                <div>
                  <Select
                    label="Budget"
                    value={filters.budget}
                    options={budgetOptions}
                    onChange={(value) => onFilterChange("budget", value as string)}
                    placeholder="Select budget"
                  />
                </div>

                {/* Event State */}
                <div>
                  <Select
                    label="Event State"
                    value={filters.eventState}
                    options={eventStateOptions}
                    onChange={(value) => onFilterChange("eventState", value as string)}
                    placeholder="Select State"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <Select
                    label="Event type"
                    value={filters.eventType}
                    options={eventTypeOptions}
                    onChange={(value) => onFilterChange("eventType", value as string)}
                    placeholder="Select event type"
                  />
                </div>

                {/* Performing Language */}
                <div>
                  <Select
                    label="Preforming language"
                    value={filters.language}
                    options={languageOptions}
                    onChange={(value) => onFilterChange("language", value as string)}
                    placeholder="Select language"
                  />
                </div>

                {/* Artist State */}
                <div>
                  <Select
                    label="Artist State"
                    value={filters.location}
                    options={locationOptions}
                    onChange={(value) => onFilterChange("location", value as string)}
                    placeholder="Select state"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#4b4b4b] flex gap-3">
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
                onClick={() => {
                  setShowFilterModal(false);
                  onViewResult?.();
                }}
                className="flex-1"
              >
                View result ({resultCount})
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileFilters;
