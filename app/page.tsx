"use client";

import SiteLayout from "@/components/layout/SiteLayout";
import { useLocation } from "@/components/providers/location-provider";
import Hero from "@/components/sections/Hero";
import Artists from "@/components/sections/Artists";
import Button from "@/components/ui/Button";

export default function Home() {
  const {
    location,
    isLocationResolved,
    showLocationModal,
    isRequestingLocation,
    requestLocation,
    skipLocation,
  } = useLocation();

  const handleEnableLocation = () => {
    if (isRequestingLocation) return;
    requestLocation(true);
  };

  const handleSkipLocation = () => {
    if (isRequestingLocation) return;
    skipLocation();
  };

  return (
    <SiteLayout showPreloader={true}>
      <Hero />

      {/* PASS LOCATION DOWN TO CHILD */}
      <Artists location={location} canFetch={isLocationResolved} />

      {/* Custom Location Permission Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border-color rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header with Icon */}
            <div className="pt-8 pb-4 px-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-primary-pink to-primary-orange rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 h1">
                Enable Location
              </h2>
              <p className="text-text-light-gray text-base leading-relaxed">
                For better artist recommendations, please enable location
                access. This helps us show you artists near your area.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="px-6 pb-6 space-y-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleEnableLocation}
                disabled={isRequestingLocation}
                className="w-full btn1"
              >
                {isRequestingLocation ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeOpacity="0.35"
                      />
                      <path
                        d="M21 12a9 9 0 00-9-9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Enabling...
                  </span>
                ) : (
                  "Enable Location"
                )}
              </Button>
              <button
                onClick={handleSkipLocation}
                disabled={isRequestingLocation}
                className="w-full py-3 text-text-gray hover:text-white transition-colors btn2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
