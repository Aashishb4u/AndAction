"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface LocationSuggestion {
  displayName: string;
  shortAddress: string;
  city: string;
  state: string;
  postcode: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: {
    address: string;
    city: string;
    state: string;
    pinCode: string;
  }) => void;
  required?: boolean;
  disabled?: boolean;
  variant?: "default" | "filled";
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  placeholder = "Search for your address",
  value,
  onChange,
  onLocationSelect,
  required = false,
  disabled = false,
  variant = "filled",
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingGPS, setIsFetchingGPS] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize state name from API to match INDIAN_STATES dropdown values
  const normalizeState = (state: string): string => {
    if (!state) return "";
    return state.toLowerCase().replace(/\s+/g, "-");
  };

  // Normalize city name from API to match INDIAN_CITIES dropdown values
  const normalizeCity = (city: string): string => {
    if (!city) return "";
    return city.toLowerCase().replace(/\s+/g, "-");
  };

  // Fetch address suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        setSuggestions(data.data);
        setIsOpen(true);
        setActiveSuggestion(-1);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Address search error:", err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 400);
  };

  // Select a suggestion
  const handleSelect = (suggestion: LocationSuggestion) => {
    const normalizedState = normalizeState(suggestion.state);
    const normalizedCity = normalizeCity(suggestion.city);

    onChange(suggestion.shortAddress || suggestion.displayName);
    onLocationSelect({
      address: suggestion.shortAddress || suggestion.displayName,
      city: normalizedCity,
      state: normalizedState,
      pinCode: suggestion.postcode || "",
    });

    setIsOpen(false);
    setSuggestions([]);
  };

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsFetchingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/geocode/reverse?lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          if (data.success && data.data) {
            const loc = data.data;
            const normalizedState = normalizeState(loc.state);
            const normalizedCity = normalizeCity(loc.city);

            onChange(loc.formattedAddress || loc.displayName);
            onLocationSelect({
              address: loc.formattedAddress || loc.displayName,
              city: normalizedCity,
              state: normalizedState,
              pinCode: loc.postcode || "",
            });
          }
        } catch (err) {
          console.error("Reverse geocode error:", err);
        } finally {
          setIsFetchingGPS(false);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setIsFetchingGPS(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location access denied. Please enable location permissions.");
        } else {
          alert("Could not get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const baseClasses = `
    w-full md:px-4 px-3 py-3 pr-12 placeholder-text-gray
    border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-0 focus:border-primary-pink
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    default: `bg-[#1B1B1B] border-border-color hover:border-[#404040] focus:border-primary-pink`,
    filled: `bg-card border-border-color hover:border-[#404040] focus:border-primary-pink focus:bg-card`,
  };

  return (
    <div ref={wrapperRef} className="w-full relative">
      {label && (
        <label className="block section-text secondary-text mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`${baseClasses} ${variantClasses[variant]}`}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          required={required}
          disabled={disabled || isFetchingGPS}
          autoComplete="off"
        />

        {/* Location picker button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled || isFetchingGPS}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray hover:text-primary-pink transition-colors disabled:opacity-50"
          title="Use current location"
        >
          {isFetchingGPS ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          )}
        </button>

        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-pink border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border-color rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {/* GPS option at top */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#2D2D2D] transition-colors border-b border-border-color"
          >
            <svg
              className="w-5 h-5 text-primary-pink shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            <span className="text-sm text-primary-pink font-medium">
              Use my current location
            </span>
          </button>

          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.lat}-${suggestion.lon}-${index}`}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                index === activeSuggestion
                  ? "bg-[#2D2D2D]"
                  : "hover:bg-[#2D2D2D]"
              } ${index < suggestions.length - 1 ? "border-b border-border-color/50" : ""}`}
            >
              <svg
                className="w-4 h-4 text-text-gray shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">
                  {suggestion.shortAddress}
                </p>
                <p className="text-xs text-text-gray truncate mt-0.5">
                  {suggestion.city}
                  {suggestion.state ? `, ${suggestion.state}` : ""}
                  {suggestion.postcode ? ` - ${suggestion.postcode}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
