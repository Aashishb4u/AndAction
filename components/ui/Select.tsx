'use client';

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
}) => {
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = `
    w-full md:px-4 px-3 py-3
    border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-pink/50
    disabled:opacity-50 disabled:cursor-not-allowed
    appearance-none cursor-pointer
  `;

  const stateClasses = disabled
    ? 'bg-gray-900 border-gray-700 text-gray-400'
    : `
        bg-[#1B1B1B] border-border-color text-white
        hover:border-gray-500 focus:border-primary-pink
      `;

  const errorClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
    : '';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block section-text mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={`
            ${baseClasses}
            ${stateClasses}
            ${errorClasses}
          `}
        >
          {placeholder && (
            <option value="" disabled hidden className="text-text-gray">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-[#1B1B1B] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-5 h-5 ${disabled ? 'text-gray-600' : 'text-text-gray'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {helperText && !error && (
        <p className="mt-2 text-sm text-text-gray">{helperText}</p>
      )}
    </div>
  );
};

export default Select;
