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
  /** Show the Enable Location popup again, e.g. when Andy gets a "near me" query. */
  openLocationModal: () => void;
  /** The browser has location blocked for this site, so only its site settings can turn it on. */
  isLocationBlocked: boolean;
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
  const [isLocationBlocked, setIsLocationBlocked] = useState(false);

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
          setIsLocationBlocked(false);
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
          // warn, not error: a refused permission is expected and must not open the Next.js dev overlay.
          console.warn("Location unavailable:", err.message);
          const blocked = err.code === err.PERMISSION_DENIED;
          setIsLocationBlocked(blocked);
          updateLocationState(null, true);
          sessionStorage.setItem("locationPermissionAsked", "denied");
          // Blocked in the browser: keep the popup open so its "allow it in site settings" note shows.
          if (!blocked) setShowLocationModal(false);
          setIsRequestingLocation(false);
          requestInFlightRef.current = false;
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      );
    },
    [updateLocationState],
  );

  const skipLocation = useCallback(() => {
    sessionStorage.setItem("locationPermissionAsked", "denied");
    setShowLocationModal(false);
    updateLocationState(null, true);
  }, [updateLocationState]);

  const openLocationModal = useCallback(() => setShowLocationModal(true), []);

  // The cached coordinates outlive the browser permission. When the user turns location off
  // in browser settings, forget them so "near me" asks again; when it is turned back on, refresh.
  useEffect(() => {
    let status: PermissionStatus | null = null;
    let cancelled = false;
    const sync = (changed: boolean) => {
      if (!status) return;
      setIsLocationBlocked(status.state === "denied");
      if (status.state === "granted") {
        // Turned back on in settings: fetch fresh coordinates. On page load, keep the user's earlier choice.
        if (changed) requestLocation();
        return;
      }
      sessionStorage.removeItem("userLocationCoords");
      if (sessionStorage.getItem("locationPermissionAsked") === "allowed") {
        sessionStorage.setItem("locationPermissionAsked", "denied");
      }
      setLocation(null);
    };
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        if (cancelled) return;
        status = result;
        status.onchange = () => sync(true);
        sync(false);
      })
      .catch(() => {}); // Permissions API missing (older browsers): keep current behaviour.
    return () => {
      cancelled = true;
      if (status) status.onchange = null;
    };
  }, [requestLocation]);

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
      openLocationModal,
      isLocationBlocked,
    }),
    [
      location,
      isLocationResolved,
      showLocationModal,
      isRequestingLocation,
      requestLocation,
      skipLocation,
      openLocationModal,
      isLocationBlocked,
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
