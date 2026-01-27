"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { toast } from "react-toastify";

const INDIAN_STATES = [
  { value: "maharashtra", label: "Maharashtra" },
  { value: "delhi", label: "Delhi" },
  { value: "karnataka", label: "Karnataka" },
  { value: "tamil-nadu", label: "Tamil Nadu" },
  { value: "gujarat", label: "Gujarat" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "west-bengal", label: "West Bengal" },
  { value: "uttar-pradesh", label: "Uttar Pradesh" },
];

const CITIES = [
  { value: "mumbai", label: "Mumbai" },
  { value: "delhi", label: "Delhi" },
  { value: "bangalore", label: "Bangalore" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "ahmedabad", label: "Ahmedabad" },
  { value: "chennai", label: "Chennai" },
  { value: "kolkata", label: "Kolkata" },
  { value: "pune", label: "Pune" },
];

export default function UserProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Avatar selection - total 24 avatars
  const avatars = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24,
  ];
  const [selectedAvatar, setSelectedAvatar] = useState<number>(3);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    countryCode: "+91",
    email: "",
    state: "",
    city: "",
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/users/profile");
        const data = await response.json();

        if (response.ok && data.success) {
          const user = data.data; // User object is directly in data.data, not data.data.user
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phoneNumber: user.phoneNumber || "",
            countryCode: user.countryCode || "+91",
            email: user.email || "",
            state: user.state || "",
            city: user.city || "",
          });

          // Set avatar - if it's a number use it, otherwise default to 3
          if (user.avatar && !isNaN(Number(user.avatar))) {
            setSelectedAvatar(Number(user.avatar));
          } else if (user.avatar) {
            // If avatar is a string like "3" extract the number
            const avatarNum = parseInt(user.avatar.toString().replace(/\D/g, ''));
            if (avatarNum >= 1 && avatarNum <= 24) {
              setSelectedAvatar(avatarNum);
            }
          }
        } else {
          toast.error(data.message || "Failed to load profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsFetching(false);
      }
    };

    if (status === "authenticated") {
      fetchProfile();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber || null, // Send null if empty
          countryCode: formData.countryCode,
          state: formData.state,
          city: formData.city,
          avatar: selectedAvatar.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Profile updated successfully!");
        router.push("/");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:p-4 p-0">
      {/* Back Button and Title - Title Centered */}
      <div className="relative flex items-center justify-center md:mb-8 mb-4 md:mt-4 mt-2 md:px-0 px-4">
        <button
          onClick={() => router.back()}
          className="absolute left-0 md:left-0 text-white hover:text-primary-pink transition-colors duration-200 flex items-center gap-2"
          aria-label="Back"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="md:inline hidden">Back</span>
        </button>
        <h1 className="h1 font-semibold text-white">
          Edit your profile
        </h1>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-full md:max-w-[50%] max-w-full bg-background">
          <div className="md:p-8 p-4">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div className="space-y-4">
              <h3 className="text-white text-center text-lg font-medium">
                Choose avatar
              </h3>
              <div className="flex items-center justify-center md:gap-3 gap-2">
                <button
                  type="button"
                  className="text-white hover:text-primary-pink transition-colors duration-200 p-2 hover:bg-white/5 rounded-full"
                  onClick={() =>
                    setSelectedAvatar(
                      selectedAvatar > 1 ? selectedAvatar - 1 : avatars.length
                    )
                  }
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Avatar Carousel - Show 5 avatars */}
                <div className="flex items-center md:gap-3 gap-2 py-2 overflow-hidden">
                  {(() => {
                    // Calculate which avatars to show (5 total, with selected in center)
                    const getVisibleAvatars = () => {
                      const visibleAvatars = [];
                      const totalAvatars = avatars.length;

                      // Get 2 avatars before, current, and 2 avatars after
                      for (let i = -2; i <= 2; i++) {
                        let avatarIndex = selectedAvatar + i;

                        // Handle wrapping
                        if (avatarIndex < 1) {
                          avatarIndex = totalAvatars + avatarIndex;
                        } else if (avatarIndex > totalAvatars) {
                          avatarIndex = avatarIndex - totalAvatars;
                        }

                        visibleAvatars.push({
                          id: avatarIndex,
                          position: i,
                          isCenter: i === 0,
                        });
                      }

                      return visibleAvatars;
                    };

                    return getVisibleAvatars().map((avatar) => (
                      <button
                        key={`${avatar.id}-${avatar.position}`}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`relative shrink-0 rounded-full border-2 transition-all duration-300 ease-out ${
                          avatar.isCenter
                            ? "md:size-20 size-14 border-primary-pink scale-110"
                            : "md:size-16 size-10 border-transparent hover:border-[#404040] opacity-60 hover:opacity-80"
                        }`}
                      >
                        <Image
                          src={`/avatars/${avatar.id}.png`}
                          alt={`Avatar ${avatar.id}`}
                          width={80}
                          height={80}
                          unoptimized
                          className="w-full h-full object-cover rounded-full"
                        />
                        {avatar.isCenter && (
                          <div className="absolute -bottom-1 -right-1 md:size-6 size-5 bg-primary-pink rounded-full flex items-center justify-center border-2 border-background">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ));
                  })()}
                </div>

                <button
                  type="button"
                  className="text-white hover:text-primary-pink transition-colors duration-200 p-2 hover:bg-white/5 rounded-full"
                  onClick={() =>
                    setSelectedAvatar(
                      selectedAvatar < avatars.length ? selectedAvatar + 1 : 1
                    )
                  }
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name*"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
                disabled={isLoading}
                variant="filled"
              />

              <Input
                label="Last name*"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
                disabled={isLoading}
                variant="filled"
              />
            </div>

            {/* Mobile Number with Country Code */}
            <div className="space-y-1">
              <label className="block section-text mb-1">
                Mobile number*
              </label>
              <div className="flex gap-2">
                <div className="w-20 md:px-4 px-3 py-3 bg-card border border-border-color rounded-lg flex items-center justify-center text-white">
                  +91
                </div>
                <Input
                  placeholder="Enter mobile number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  variant="filled"
                  type="tel"
                  required
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <Input
              label="Email"
              placeholder="Email"
              value={formData.email}
              variant="filled"
              type="email"
              disabled
            />

            {/* Location Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* State Dropdown */}
              <div className="relative">
                <label className="block section-text mb-1">State*</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'state' ? null : 'state')}
                  disabled={isLoading}
                  className="w-full px-3 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between hover:border-gray-500 focus:border-primary-pink transition-all duration-200 disabled:opacity-50"
                >
                  <span className={formData.state ? "text-white" : "text-text-gray"}>
                    {formData.state ? INDIAN_STATES.find(s => s.value === formData.state)?.label : "Select state"}
                  </span>
                  <svg className="w-5 h-5 text-text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === 'state' && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {INDIAN_STATES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange("state", option.value);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-background transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          formData.state === option.value
                            ? "bg-primary-pink/20 text-primary-pink"
                            : "text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City Dropdown */}
              <div className="relative">
                <label className="block section-text mb-1">City*</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'city' ? null : 'city')}
                  disabled={isLoading}
                  className="w-full px-3 py-3 bg-card border border-border-color rounded-lg text-left flex items-center justify-between hover:border-gray-500 focus:border-primary-pink transition-all duration-200 disabled:opacity-50"
                >
                  <span className={formData.city ? "text-white" : "text-text-gray"}>
                    {formData.city ? CITIES.find(c => c.value === formData.city)?.label : "Select city"}
                  </span>
                  <svg className="w-5 h-5 text-text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === 'city' && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {CITIES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange("city", option.value);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-background transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          formData.city === option.value
                            ? "bg-primary-pink/20 text-primary-pink"
                            : "text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
