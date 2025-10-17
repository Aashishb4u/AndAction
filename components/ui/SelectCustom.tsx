'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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

const SelectCustom: React.FC<SelectProps> = ({
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
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const selectedOption = options.find(option => option.value === value);

  const baseClasses = `
    relative w-full md:px-4 px-3 py-3 text-left
    border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-pink/50
    cursor-pointer
    placeholder-text-gray
  `;

  const stateClasses = disabled
    ? 'opacity-50 cursor-not-allowed bg-gray-900 border-gray-700'
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

      <div ref={selectRef} className="relative">
        <div
          id={selectId}
          className={`
            ${baseClasses}
            ${stateClasses}
            ${errorClasses}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="options-list"
        >
          <span className={selectedOption ? 'text-white' : 'text-text-gray'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
              } ${disabled ? 'text-gray-600' : 'text-text-gray'}`}
            size={20}
          />
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={`
                  px-4 py-3 cursor-pointer transition-colors duration-150
                  flex items-center justify-between
                  ${option.disabled
                    ? 'opacity-50 cursor-not-allowed text-gray-500'
                    : 'text-white hover:bg-card'
                  }
                  ${value === option.value ? 'bg-primary-pink/10 text-primary-pink' : ''}
                `}
                onClick={() => !option.disabled && handleOptionClick(option.value)}
                role="option"
                aria-selected={value === option.value}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check size={16} className="text-primary-pink" />
                )}
              </div>
            ))}
          </div>
        )}
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

export default SelectCustom;
