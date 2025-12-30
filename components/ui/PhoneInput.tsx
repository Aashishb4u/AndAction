'use client';

import React, { useState } from 'react';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
];

interface PhoneInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: Country) => void;
  variant?: 'filled' | 'outlined';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  placeholder = 'Enter mobile number',
  value,
  onChange,
  onCountryChange,
  variant = 'filled',
  required = false,
  disabled = false,
  className = '',
  id = 'phone',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    if (onCountryChange) {
      onCountryChange(country);
    }
  };

  const baseClasses = `
    w-full md:px-4 px-3 py-3 rounded-lg text-white md:text-base text-sm placeholder-text-gray 
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-pink
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const variantClasses = {
    filled: 'bg-[#2D2D2D] border border-border-color focus:border-primary-pink',
    outlined: 'bg-transparent border border-border-color focus:border-primary-pink'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block secotion-text text-white">
          {label}
        </label>
      )}

      <div className="relative">
        <div className={`${baseClasses} ${variantClasses[variant]} flex items-center`}>
          {/* Country Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={disabled}
              className="flex items-center gap-2 pr-2 border-r border-[#404040] mr-2 hover:bg-[#404040] rounded-l-lg md:px-1 py-1 transition-colors duration-200"
            >
              <span className="flex items-center justify-center" style={{ width: '17px', height: '17px', fontSize: '17px' }}>{selectedCountry.flag}</span>
              <span className="text-white text-sm">{selectedCountry.dialCode}</span>
              <svg className="w-4 h-4 text-text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#2D2D2D] border border-[#404040] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#404040] transition-colors duration-200 text-left"
                  >
                    <span className="flex items-center justify-center shrink-0" style={{ width: '17px', height: '17px', fontSize: '17px' }}>{country.flag}</span>
                    <span className="text-white text-sm flex-1">{country.name}</span>
                    <span className="text-text-gray text-sm">{country.dialCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <input
            type="tel"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-text-gray"
            id={id}
          />
        </div>

        {/* Backdrop for dropdown */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PhoneInput;
