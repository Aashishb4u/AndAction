"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Tooltip from "@/components/ui/Tooltip";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import { Info } from "lucide-react";
import { Artist } from "@/types";
import { useSession } from "next-auth/react";
import { mapUserForSession, updateArtistProfile } from "@/lib/helper";
import { toast } from "react-toastify";
import { INDIAN_STATES, INDIAN_CITIES } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useArtistCategories } from "@/hooks/use-artist-categories";
import {
  normalizeArtistCategoryValue,
} from "@/lib/artist-category-utils";

// Extended artist type for profile management
type ExtendedArtist = Artist & {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  pinCode?: string;
  state?: string;
  city?: string;
  shortBio?: string;
  contactNumber?: string;
  contactEmail?: string;
  subArtistType: string;
};

interface AboutTabProps {
  artist: Artist;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

// Category options are loaded from artist_categories table.

const subArtistTypeOptions = [
  { value: "classical", label: "Classical" },
  { value: "contemporary", label: "Contemporary" },
  { value: "folk", label: "Folk" },
  { value: "bollywood", label: "Bollywood" },
  { value: "western", label: "Western" },
  { value: "fusion", label: "Fusion" },
];

const experienceOptions = [
  { value: "1", label: "0-1 years" },
  { value: "2", label: "1-3 years" },
  { value: "3", label: "3-5 years" },
  { value: "4", label: "5-10 years" },
  { value: "5", label: "10+ years" },
];

const AboutTab: React.FC<AboutTabProps> = ({ artist }) => {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const { categories } = useArtistCategories();
  const [isLoading, setIsLoading] = useState(false);

  const normalizeArtistTypeValue = (rawValue?: string) => {
    const normalized = normalizeArtistCategoryValue(rawValue || "");
    if (!normalized) return "";

    const labelMatch = categories.find(
      (item) => item.label.toLowerCase() === normalized.toLowerCase(),
    );
    return labelMatch?.value || normalized;
  };

  const initialArtistType = normalizeArtistTypeValue(
    (artist as any)?.tags?.[0] || artist.category,
  );

  const [formData, setFormData] = useState({
    stageName: artist.name,
    artistType: initialArtistType,
    firstName: (artist as ExtendedArtist).firstName || "",
    lastName: (artist as ExtendedArtist).lastName || "",
    dateOfBirth: (artist as ExtendedArtist).dateOfBirth || "",
    gender: artist.gender?.toLowerCase() || "",
    address: (artist as ExtendedArtist).address || "",
    pinCode: (artist as ExtendedArtist).pinCode || "",
    state: (artist as ExtendedArtist).state?.toLowerCase() || "",
    city: (artist as ExtendedArtist).city?.toLowerCase() || "",
    contactNumber:
      (artist as ExtendedArtist).contactNumber || (artist as any).phone || "",
    email:
      (artist as ExtendedArtist).contactEmail || (artist as any).email || "",
    subArtistType:
      (artist as ExtendedArtist).subArtistType?.toLowerCase() || "",
    achievements: Array.isArray(artist.achievements)
      ? artist.achievements.join(", ")
      : artist.achievements || "",
    yearsOfExperience: artist.yearsOfExperience?.toString() || "4",
    shortBio: artist.bio || "",
  });

  // Multi-select UI for sub-artist types (stores as CSV for backend)
  const initialSelectedSubTypes = (artist as ExtendedArtist).subArtistType
    ? (artist as ExtendedArtist).subArtistType.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>(initialSelectedSubTypes);
  const [subTypeInput, setSubTypeInput] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (field: string, value: string | string[]) => {
    const normalizedValue = Array.isArray(value) ? value.join(",") : value;
    setFormData((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
  };

  const handleSave = async () => {
    try {
      if (!session?.user?.id) {
        toast.error("Not authenticated");
        return;
      }

      setIsLoading(true);

      const payload = {
        userId: session.user.id,

        stageName: formData.stageName,
        artistType: normalizeArtistCategoryValue(formData.artistType),
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dob: formData.dateOfBirth,
        address: formData.address,
        pinCode: formData.pinCode,
        city: formData.city,
        state: formData.state,
        contactNumber: formData.contactNumber,
        whatsappNumber: formData.contactNumber,
        contactEmail: formData.email,
        shortBio: formData.shortBio,
        achievements: formData.achievements,
        yearsOfExperience: formData.yearsOfExperience,
        subArtistType: selectedSubTypes.join(','),
      };

      // Update DB
      const res = await updateArtistProfile(payload);

      const refreshedUser = res.data.user;
      const refreshedArtist = res.data.artistProfile;

      // 🔥 Build correct NextAuth shape:
      const sessionPayload = mapUserForSession(refreshedUser, refreshedArtist);

      // Update session (JWT + session.user)
      await update({
        update: sessionPayload,
      });

      // Ensure home/category listings fetch fresh data after profile category change.
      await queryClient.cancelQueries({ queryKey: ["artists"] });
      queryClient.removeQueries({ queryKey: ["artists"] });

      toast.success("Profile updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      stageName: artist.name,
      artistType: normalizeArtistTypeValue((artist as any)?.tags?.[0] || artist.category),
      firstName: (artist as ExtendedArtist).firstName || "",
      lastName: (artist as ExtendedArtist).lastName || "",
      dateOfBirth: (artist as ExtendedArtist).dateOfBirth || "",
      gender: artist.gender?.toLowerCase() || "",
      address: (artist as ExtendedArtist).address || "",
      pinCode: (artist as ExtendedArtist).pinCode || "",
      state: (artist as ExtendedArtist).state?.toLowerCase() || "",
      city: (artist as ExtendedArtist).city?.toLowerCase() || "",
      contactNumber:
        (artist as ExtendedArtist).contactNumber || (artist as any).phone || "",
      email:
        (artist as ExtendedArtist).contactEmail || (artist as any).email || "",
      subArtistType:
        (artist as ExtendedArtist).subArtistType?.toLowerCase() || "",
      achievements: Array.isArray(artist.achievements)
        ? artist.achievements.join(", ")
        : artist.achievements || "",
      yearsOfExperience: artist.yearsOfExperience?.toString() || "4",
      shortBio: artist.bio || "",
    });
    setSelectedSubTypes((artist as ExtendedArtist).subArtistType ? (artist as ExtendedArtist).subArtistType.split(',').map(s => s.trim()).filter(Boolean) : []);
  };

  return (
    <div className="md:space-y-5 space-y-4 pb-24 md:pb-0">
      {/* Stage Name */}
      <div className="relative text-sm">
        <Input
          label="Stage name*"
          value={formData.stageName}
          onChange={(e) => handleInputChange("stageName", e.target.value)}
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Your professional/stage name that will be displayed to clients">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>


      {/* First Name and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">       <Input
          label="First name*"
          value={formData.firstName}
          onChange={(e) => handleInputChange("firstName", e.target.value)}
          required
        />
        <Input
          label="Last name*"
          value={formData.lastName}
          onChange={(e) => handleInputChange("lastName", e.target.value)}
          required
        />
      </div>

      {/* Date of Birth and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <DateInput
          label="Date of birth*"
          value={formData.dateOfBirth}
          onChange={(value) => handleInputChange("dateOfBirth", value)}
          placeholder="DD / MM / YYYY"
          maxDate={new Date()}
          required
        />
        <Select
          label="Gender*"
          options={genderOptions}
          value={formData.gender}
          onChange={(value) => handleInputChange("gender", value)}
          required
        />
      </div>

      {/* Address */}
      <Input
        label="Office/Home full address*"
        value={formData.address}
        onChange={(e) => handleInputChange("address", e.target.value)}
        required
      />

      {/* PIN Code, State, City */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="PIN code*"
          value={formData.pinCode}
          onChange={(e) => handleInputChange("pinCode", e.target.value)}
          required
        />
        <Select
          label="State*"
          options={INDIAN_STATES}
          value={formData.state}
          onChange={(value) => handleInputChange("state", value)}
          required
        />
        <Select
          label="City*"
          options={INDIAN_CITIES}
          value={formData.city}
          onChange={(value) => handleInputChange("city", value)}
          required
        />
      </div>

      {/* Contact Number */}
      <div className="relative text-sm">
        <Input
          label="Contact / Whatsapp number*"
          value={formData.contactNumber}
          onChange={(e) => handleInputChange("contactNumber", e.target.value)}
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Primary contact number shown to users and used for calls/WhatsApp fallback">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

      {/* Email ID */}
      <div className="relative text-sm">
        <Input
          label="Email ID"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          type="email"
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Professional email used for booking communication">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

            {/* Artist Category */}
      <div className="relative text-sm">
        <Select
          label="Artist Category*"
          options={categories}
          value={formData.artistType}
          onChange={(value) => handleInputChange("artistType", value)}
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Select the primary category that best describes your art form">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

      {/* Sub-Artist Type (tag-style multi-select) */}      <div className="relative text-sm">
        <label className="block secondary-text text-white mb-1">Sub-Artist type*</label>
        <div className="w-full bg-card border border-border-color rounded-lg px-3 py-2 text-white flex flex-wrap gap-2">
          {selectedSubTypes.map((tag, idx) => (
            <span key={tag + idx} className="inline-flex items-center gap-2 bg-background px-3 py-1 rounded-full text-sm">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => {
                  const next = selectedSubTypes.filter(t => t !== tag);
                  setSelectedSubTypes(next);
                }}
                className="text-text-gray hover:text-white"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            className="flex-1 bg-transparent focus:outline-none px-2 py-1 text-sm placeholder-text-gray"
            placeholder="e.g. Classical, Bollywood, Fusion"
            value={subTypeInput}
            onChange={(e) => setSubTypeInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const v = subTypeInput.trim().replace(/,$/, '');
                if (v && !selectedSubTypes.includes(v)) {
                  setSelectedSubTypes([v, ...selectedSubTypes]);
                }
                setSubTypeInput('');
              } else if (e.key === 'Backspace' && !subTypeInput) {
                setSelectedSubTypes(selectedSubTypes.slice(0, -1));
              }
            }}
          />
        </div>
        <div className="absolute top-0 right-0">
          <Tooltip content="Specify your performance style or specialization">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border-color rounded-lg shadow-lg max-h-48 overflow-auto">
            {subArtistTypeOptions.filter(o => o.label.toLowerCase().includes((subTypeInput || '').toLowerCase())).length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-gray">No suggestions</div>
            ) : (
              subArtistTypeOptions
                .filter(o => o.label.toLowerCase().includes((subTypeInput || '').toLowerCase()))
                .map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); }}
                    onClick={() => {
                      if (!selectedSubTypes.includes(o.label)) {
                        setSelectedSubTypes([o.label, ...selectedSubTypes]);
                      }
                      setSubTypeInput('');
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-background-light transition-colors text-white text-sm"
                  >
                    {o.label}
                  </button>
                ))
            )}
          </div>
        )}
      </div>

      {/* Achievements and Years of Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="relative">
          <Input
            label="Achievements / Awards"
            value={formData.achievements}
            onChange={(e) => handleInputChange("achievements", e.target.value)}
          />
          <div className="absolute top-0 right-0">
            <Tooltip content="List notable achievements or awards separated by commas">
              <Info size={16} className="text-blue" />
            </Tooltip>
          </div>
        </div>
        <div className="relative">
          <Select
            label="Years of experience*"
            options={experienceOptions}
            value={formData.yearsOfExperience}
            onChange={(value) => handleInputChange("yearsOfExperience", value)}
            required
          />
          <div className="absolute top-0 right-0">
            <Tooltip content="Total years of professional performing experience">
              <Info size={16} className="text-blue" />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Short Bio */}
      <div className="relative">
        <Textarea
          label="Short bio"
          value={formData.shortBio}
          onChange={(e) => handleInputChange("shortBio", e.target.value)}
          placeholder="Tell us about yourself..."
          required
        />
        <div className="absolute top-0 right-0">
          <Tooltip content="Write a brief description about yourself and your artistic journey">
            <Info size={16} className="text-blue" />
          </Tooltip>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex md:justify-end gap-4 items-center md:pt-5 py-2 px-3 fixed md:static bottom-0 left-0 right-0 bg-card md:bg-transparent z-50">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={isLoading}
          className="w-full md:w-auto text-sm! md:text-base!"
        >
          <span className="gradient-text">Reset</span>
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isLoading}
          className="w-full md:w-auto text-xs! md:text-base!"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AboutTab;
