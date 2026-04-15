"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Coordinates = { lat: number; lng: number };

type LocationContextValue = {
  location: Coordinates | null;
  isLocationResolved: boolean;
  showLocationModal: boolean;
  isRequestingLocation: boolean;
  requestLocation: (showLoader?: boolean) => void;
  skipLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

const areSameCoordinates = (a: Coordinates | null, b: Coordinates | null) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.lat === b.lat && a.lng === b.lng;
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLocationResolved, setIsLocationResolved] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const hasInitializedRef = useRef(false);
  const requestInFlightRef = useRef(false);

  const updateLocationState = useCallback(
    (nextLocation: Coordinates | null, resolved: boolean) => {
      setLocation((prev) =>
        areSameCoordinates(prev, nextLocation) ? prev : nextLocation,
      );
      setIsLocationResolved((prev) => (prev === resolved ? prev : resolved));
    },
    [],
  );

  const requestLocation = useCallback(
    (showLoader: boolean = false) => {
      if (requestInFlightRef.current) return;

      requestInFlightRef.current = true;
      if (showLoader) setIsRequestingLocation(true);

      if (!navigator.geolocation) {
        setShowLocationModal(false);
        updateLocationState(null, true);
        setIsRequestingLocation(false);
        requestInFlightRef.current = false;
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const rounded = (value: number) => Number(value.toFixed(4));
          const nextLocation = {
            lat: rounded(pos.coords.latitude),
            lng: rounded(pos.coords.longitude),
          };

          updateLocationState(nextLocation, true);
          sessionStorage.setItem("locationPermissionAsked", "allowed");
          sessionStorage.setItem(
            "userLocationCoords",
            JSON.stringify(nextLocation),
          );
          setShowLocationModal(false);
          setIsRequestingLocation(false);
          requestInFlightRef.current = false;
        },
        (err) => {
          console.error("Location permission denied", err);
          updateLocationState(null, true);
          sessionStorage.setItem("locationPermissionAsked", "denied");
          setShowLocationModal(false);
          setIsRequestingLocation(false);
          requestInFlightRef.current = false;
        },
        { enableHighAccuracy: true },
      );
    },
    [updateLocationState],
  );

  const skipLocation = useCallback(() => {
    sessionStorage.setItem("locationPermissionAsked", "denied");
    setShowLocationModal(false);
    updateLocationState(null, true);
  }, [updateLocationState]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const locationPreference = sessionStorage.getItem(
      "locationPermissionAsked",
    );

    if (locationPreference === "allowed") {
      const cachedLocation = sessionStorage.getItem("userLocationCoords");

      if (cachedLocation) {
        try {
          const parsed = JSON.parse(cachedLocation) as {
            lat?: number;
            lng?: number;
          };

          if (
            typeof parsed.lat === "number" &&
            Number.isFinite(parsed.lat) &&
            typeof parsed.lng === "number" &&
            Number.isFinite(parsed.lng)
          ) {
            updateLocationState({ lat: parsed.lat, lng: parsed.lng }, true);
            return;
          }
        } catch {
          // Ignore invalid cached location and request fresh location.
        }
      }

      requestLocation();
      return;
    }

    if (locationPreference === "denied") {
      updateLocationState(null, true);
      return;
    }

    const timer = setTimeout(() => {
      setShowLocationModal(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [requestLocation, updateLocationState]);

  const value = useMemo<LocationContextValue>(
    () => ({
      location,
      isLocationResolved,
      showLocationModal,
      isRequestingLocation,
      requestLocation,
      skipLocation,
    }),
    [
      location,
      isLocationResolved,
      showLocationModal,
      isRequestingLocation,
      requestLocation,
      skipLocation,
    ],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }

  return context;
}
