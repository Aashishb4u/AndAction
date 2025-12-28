'use client';

import React from 'react';
import { Filters } from '@/types';
import Select from '@/components/ui/Select';
import Button from '../ui/Button';

interface FilterOption {
  value: string;
  label: string;
}

interface ArtistFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onReset: () => void;
  resultCount?: number;
  className?: string;
}

const categoryOptions: FilterOption[] = [
  { value: 'singer', label: 'Singer' },
  { value: 'anchor', label: 'Anchor/emcee' },
  { value: 'band', label: 'Live Band' },
  { value: 'dj', label: 'DJ / VJ' },
  { value: 'dancer', label: 'Dancer' },
  { value: 'comedian', label: 'Comedian' },
];

const subCategoryOptions: FilterOption[] = [
  { value: 'bollywood', label: 'Bollywood' },
  { value: 'classical', label: 'Classical' },
  { value: 'folk', label: 'Folk' },
  { value: 'western', label: 'Western' },
  { value: 'devotional', label: 'Devotional' },
];

const genderOptions: FilterOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const budgetOptions: FilterOption[] = [
  { value: '0-50000', label: '₹0 - ₹50,000' },
  { value: '50000-100000', label: '₹50,000 - ₹1,00,000' },
  { value: '100000-200000', label: '₹1,00,000 - ₹2,00,000' },
  { value: '200000-500000', label: '₹2,00,000 - ₹5,00,000' },
  { value: '500000+', label: '₹5,00,000+' },
];

const eventStateOptions: FilterOption[] = [
  { value: 'maharashtra', label: 'Maharashtra' },
  { value: 'gujarat', label: 'Gujarat' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'bangalore', label: 'Bangalore' },
];

const eventTypeOptions: FilterOption[] = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'festival', label: 'Festival' },
  { value: 'concert', label: 'Concert' },
];

const languageOptions: FilterOption[] = [
  { value: 'hindi', label: 'Hindi' },
  { value: 'english', label: 'English' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'punjabi', label: 'Punjabi' },
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
  resultCount = 0,
  className = '',
}) => {
  return (
    <div className={`bg-card rounded-2xl border border-border-color h-fit ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4 border-b border-b-[#2D2D2D] p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          <h2 className="btn2 text-white">Filter</h2>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-white hover:text-primary-orange transition-colors duration-300"
        >
          Reset
        </button>
      </div>

      {/* Filter Options */}
      <div className="space-y-1 p-4">
        <FilterSelect
          label="Artist Category"
          value={filters.category}
          options={categoryOptions}
          onChange={(value) => onFilterChange('category', value)}
          required
        />

        <FilterSelect
          label="Sub-Category"
          value={filters.subCategory}
          options={subCategoryOptions}
          onChange={(value) => onFilterChange('subCategory', value)}
        />

        <FilterSelect
          label="Artist gender"
          value={filters.gender}
          options={genderOptions}
          onChange={(value) => onFilterChange('gender', value)}
        />

        <FilterSelect
          label="Budget"
          value={filters.budget}
          options={budgetOptions}
          onChange={(value) => onFilterChange('budget', value)}
        />

        <FilterSelect
          label="Event State"
          value={filters.eventState}
          options={eventStateOptions}
          onChange={(value) => onFilterChange('eventState', value)}
        />

        <FilterSelect
          label="Event type"
          value={filters.eventType}
          options={eventTypeOptions}
          onChange={(value) => onFilterChange('eventType', value)}
        />

        <FilterSelect
          label="Preforming language"
          value={filters.language}
          options={languageOptions}
          onChange={(value) => onFilterChange('language', value)}
        />
      </div>

      {/* View Result Button */}
      <div className='flex gap-4 p-4'>
        <Button variant="secondary" size="xs" onClick={onReset} className="flex-1 border border-border-color">
          <span className="gradient-text">Reset</span>
        </Button>
        <Button variant="primary" size="xs" className="flex-1 flex items-center justify-center">
          View result ({resultCount})
        </Button>
      </div>
    </div>
  );
};

export default ArtistFilters;
