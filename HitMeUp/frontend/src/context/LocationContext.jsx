import { createContext, useContext, useState, useEffect, useCallback } from "react";

const LocationContext = createContext(null);

const DEFAULT_COORDS = {
  latitude: 6.9271,
  longitude: 79.8612,
  city: "Colombo",
  isRealLocation: false,
};

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("userLocation");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [locationStatus, setLocationStatus] = useState(() => {
    if (localStorage.getItem("userLocation")) return "granted";
    return "prompt"; // "prompt" | "requesting" | "granted" | "denied"
  });

  const [showPrompt, setShowPrompt] = useState(() => {
    if (localStorage.getItem("userLocation")) return false;
    if (sessionStorage.getItem("locationPromptDismissed")) return false;
    return true;
  });

  const [radius, setRadius] = useState(25); // Default 25 km radius
  const [locationError, setLocationError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setUserLocation(DEFAULT_COORDS);
      setLocationStatus("denied");
      setShowPrompt(false);
      return;
    }

    setLocationStatus("requesting");
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          isRealLocation: true,
        };
        setUserLocation(coords);
        localStorage.setItem("userLocation", JSON.stringify(coords));
        setLocationStatus("granted");
        setShowPrompt(false);
      },
      (error) => {
        console.warn("Geolocation permission or lookup notice:", error.message);
        setLocationError(error.message);
        // Fall back to Colombo regional default coordinates
        setUserLocation(DEFAULT_COORDS);
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    sessionStorage.setItem("locationPromptDismissed", "true");
    if (!userLocation) {
      setUserLocation(DEFAULT_COORDS);
    }
  }, [userLocation]);

  // When loading the site, prompt for location if not yet decided
  useEffect(() => {
    if (!userLocation) {
      // Check if permission was already granted previously at browser level
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((result) => {
            if (result.state === "granted") {
              requestLocation();
            } else if (result.state === "prompt") {
              // Automatically trigger location prompt on site load
              requestLocation();
            }
          })
          .catch(() => {
            requestLocation();
          });
      } else {
        requestLocation();
      }
    }
  }, [userLocation, requestLocation]);

  const value = {
    userLocation: userLocation || DEFAULT_COORDS,
    hasRealLocation: !!userLocation?.isRealLocation,
    locationStatus,
    showPrompt,
    setShowPrompt,
    radius,
    setRadius,
    locationError,
    requestLocation,
    dismissPrompt,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
};

export default LocationContext;

