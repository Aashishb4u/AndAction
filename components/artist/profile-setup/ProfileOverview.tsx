"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Image from "next/image";

interface ProfileOverviewProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  onNext,
  onSkip,
  onBack,
}) => {
  const profileSteps = [
    {
      icon: (
        <Image
          src="/icons/user.svg"
          alt="Artist Profile"
          width={32}
          height={32}
        />
      ),
      title: "Artist Profile Details",
      description:
        "Add your stage name, category, experience, and short bio.",
    },
    {
      icon: (
        <Image
          src="/icons/play.svg"
          alt="Artist Profile"
          width={30}
          height={30}
        />
      ),
      title: "Performance Details",
      description:
        "Share your styles, event types, languages, and availability.",
    },
    {
      icon: (
        <Image
          src="/icons/phone.svg"
          alt="Artist Profile"
          width={30}
          height={30}
        />
      ),
      title: "Contact & Pricing Details",
      description:
        "Add your contact details and pricing range for bookings.",
    },
    {
      icon: (
        <Image
          src="/icons/video.svg"
          alt="Artist Profile"
          width={30}
          height={30}
        />
      ),
      title: "Videos & Social Media",
      description:
        "Upload videos and link social profiles to showcase talent.",
    },
  ];

  const [savedFirstName, setSavedFirstName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("firstName") || localStorage.getItem("first_name");
      if (stored) setSavedFirstName(stored);
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-primary-pink transition-colors duration-200"
        >
          <svg
            className="w-8 h-8"
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
          <span className="hidden md:block">Back</span>
          <span className="md:hidden h2">Profile Setup</span>
        </button>
      </div>
      <div className="h-px bg-border-line" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center md:justify-center pl-6 pr-4 pb-32">
        <div className="max-w-lg w-full md:text-center space-y-8">
          {/* Title */}
          <div className="space-y-6">
            <h1 className="text-2xl h1-heading font-semibold text-white hidden md:block">
              Profile setup
            </h1>
            <p className="h1 mt-6">
              Hello{savedFirstName ? `, ${savedFirstName}` : ""} are you ready to Setup your profile
            </p>
          </div>

          {/* Profile Steps */}
          <div className="space-y-5">
            {profileSteps.map((step, index) => (
              <div key={index}>
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0">{step.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-white h3 mb-1">{step.title}</h3>
                    <p className="text-text-gray text-sm">{step.description}</p>
                  </div>
                </div>
                {index !== profileSteps.length - 1 && (
                  <div className="h-px border-gradient-dark-bg mt-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-border-color pl-5 pr-4 md:px-0 py-4">
        <p className="text-text-gray footnote mb-4 md:hidden">
          It only takes 5–10 min and you can edit it later. We’ll save as you
          go.
        </p>

        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Button variant="secondary" size="md" onClick={onSkip} className="w-1/2">
            <span className="gradient-text">Skip for now</span>
          </Button>
          <Button variant="primary" size="md" onClick={onNext} className="w-1/2">
            Get started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;
