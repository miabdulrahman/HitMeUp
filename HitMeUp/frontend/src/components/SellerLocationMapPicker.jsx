import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Search,
  Crosshair,
  Layers,
  Check,
  Compass,
  Maximize2,
  Minimize2,
  Navigation,
  Globe,
  Sparkles,
  RefreshCw,
  ExternalLink
} from "lucide-react";

/**
 * Custom modern SVG Pin for Leaflet
 */
const createCustomPinIcon = (storeName = "Store Location") => {
  return L.divIcon({
    className: "hitmeup-map-pin-container",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab;">
        <!-- Store Name Pill -->
        <div style="
          background: #111827;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          margin-bottom: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          pointer-events: none;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${storeName}
        </div>

        <!-- Teardrop Marker Pin -->
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #FF4A2F 0%, #E8503A 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(232, 80, 58, 0.45);
          border: 2.5px solid #ffffff;
        ">
          <div style="
            width: 13px;
            height: 13px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 5px; height: 5px; background: #E8503A; border-radius: 50%;"></div>
          </div>
        </div>

        <!-- Ground Contact Shadow & Radar Ripple -->
        <div style="
          width: 16px;
          height: 6px;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 50%;
          margin-top: 2px;
          filter: blur(1.5px);
        "></div>
      </div>
    `,
    iconSize: [0, 0], // Anchor relative to top-left of container
    iconAnchor: [0, 0],
    popupAnchor: [0, -50]
  });
};

// Map Tile Layer Providers
const TILE_LAYERS = {
  googleRoadmap: {
    name: "Google Streets",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "Google Maps",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20
  },
  googleSatellite: {
    name: "Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "Google Maps Satellite",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }
};

const SellerLocationMapPicker = ({
  latitude = 6.9271,
  longitude = 79.8612,
  onChange,
  storeName = "My Store",
  onAddressDetected
}) => {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const activeTileLayerRef = useRef(null);

  const [activeLayerKey, setActiveLayerKey] = useState("googleRoadmap");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [gpsLocating, setGpsLocating] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalize coordinates
  const currentLat = parseFloat(latitude) || 6.9271;
  const currentLng = parseFloat(longitude) || 79.8612;

  // Reverse Geocode helper (Nominatim)
  const fetchAddressForCoordinates = useCallback(async (lat, lng) => {
    try {
      setReverseLoading(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data?.display_name) {
        setDetectedAddress(data.display_name);
        if (onAddressDetected && data.address) {
          const street = [
            data.address.house_number,
            data.address.road || data.address.pedestrian || data.address.suburb
          ].filter(Boolean).join(" ");
          const city = data.address.city || data.address.town || data.address.state_district || "Colombo";
          onAddressDetected({
            formatted: data.display_name,
            street: street || data.display_name.split(",")[0],
            city
          });
        }
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    } finally {
      setReverseLoading(false);
    }
  }, [onAddressDetected]);

  // Notify parent of location changes
  const updateLocation = useCallback((lat, lng, shouldReverseGeocode = true) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));

    if (onChange) {
      onChange({ latitude: roundedLat, longitude: roundedLng });
    }

    if (shouldReverseGeocode) {
      fetchAddressForCoordinates(roundedLat, roundedLng);
    }
  }, [onChange, fetchAddressForCoordinates]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy any existing map instance to prevent "Map container is already initialized"
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    leafletMapRef.current = map;

    // Add Tile Layer
    const selectedProvider = TILE_LAYERS[activeLayerKey] || TILE_LAYERS.googleRoadmap;
    const tileLayer = L.tileLayer(selectedProvider.url, {
      attribution: selectedProvider.attribution,
      subdomains: selectedProvider.subdomains || "abc",
      maxZoom: selectedProvider.maxZoom || 19
    }).addTo(map);

    activeTileLayerRef.current = tileLayer;

    // Add Custom Marker Pin
    const pinIcon = createCustomPinIcon(storeName);
    const marker = L.marker([currentLat, currentLng], {
      icon: pinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    markerRef.current = marker;

    // Marker Drag Event
    marker.on("dragend", (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateLocation(lat, lng, true);
    });

    // Map Click Event (Pin moves to clicked point)
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateLocation(lat, lng, true);
    });

    // Invalidate size to ensure clean render inside modals/collapsibles
    const timer = setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Sync external coordinates when changed externally (e.g. manual typing or GPS)
  useEffect(() => {
    if (!leafletMapRef.current || !markerRef.current) return;

    const currentMarkerPos = markerRef.current.getLatLng();
    const latDiff = Math.abs(currentMarkerPos.lat - currentLat);
    const lngDiff = Math.abs(currentMarkerPos.lng - currentLng);

    // Only update if difference is meaningful to prevent infinite loop
    if (latDiff > 0.00005 || lngDiff > 0.00005) {
      markerRef.current.setLatLng([currentLat, currentLng]);
      leafletMapRef.current.panTo([currentLat, currentLng], { animate: true, duration: 0.8 });
    }
  }, [currentLat, currentLng]);

  // Sync store name change to marker pill
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createCustomPinIcon(storeName));
    }
  }, [storeName]);

  // Change Map Layer (Google Road vs Satellite vs OSM)
  const handleLayerChange = (layerKey) => {
    if (!leafletMapRef.current || layerKey === activeLayerKey) return;
    setActiveLayerKey(layerKey);

    if (activeTileLayerRef.current) {
      leafletMapRef.current.removeLayer(activeTileLayerRef.current);
    }

    const provider = TILE_LAYERS[layerKey];
    const newTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || "abc",
      maxZoom: provider.maxZoom || 19
    }).addTo(leafletMapRef.current);

    activeTileLayerRef.current = newTileLayer;
  };

  // GPS Auto Detect
  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (leafletMapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          leafletMapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
        }
        updateLocation(lat, lng, true);
        setGpsLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setGpsLocating(false);
        alert("Could not detect location. Please search for your street or click directly on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search Address (Nominatim Geocoding)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5&countrycodes=lk,ae,sg,in,us,gb`
      );
      const results = await res.json();
      setSearchResults(results || []);

      if (results && results.length > 0) {
        // Auto select first match
        selectSearchResult(results[0]);
      } else {
        alert("No locations found for this query. Try a specific landmark or road name.");
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    if (leafletMapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1 });
    }

    updateLocation(lat, lng, false);
    setDetectedAddress(item.display_name);
    setSearchResults([]);
    setSearchQuery(item.display_name.split(",").slice(0, 3).join(", "));
  };

  // Re-center map onto pin
  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([currentLat, currentLng], 17, { animate: true, duration: 0.6 });
    }
  };

  // Zoom controls
  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();

  // Resize when toggling full view
  useEffect(() => {
    const timer = setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  return (
    <div className="space-y-3">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search road, mall, landmark e.g. One Galle Face, Colombo"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2.5 pl-8 pr-18 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#E8503A] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#D43A26] transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            {searching ? (
              <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Find</span>
            )}
          </button>
        </form>

        {/* GPS Quick Detect Button */}
        <button
          type="button"
          onClick={handleGpsDetect}
          disabled={gpsLocating}
          className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer shadow-2xs"
          title="Detect your current location via device GPS"
        >
          {gpsLocating ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          ) : (
            <Crosshair size={14} className="text-blue-600" />
          )}
          <span>{gpsLocating ? "Detecting GPS..." : "My GPS"}</span>
        </button>
      </div>

      {/* Multiple Search Results Dropdown (if any) */}
      {searchResults.length > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-lg max-h-40 overflow-y-auto space-y-1 z-20">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-0.5">
            Select Exact Location:
          </p>
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectSearchResult(item)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition flex items-start gap-2 cursor-pointer"
            >
              <MapPin size={13} className="text-[#E8503A] shrink-0 mt-0.5" />
              <span className="truncate">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Map Canvas Stage */}
      <div
        className={`relative w-full rounded-2xl border-2 border-gray-200/90 overflow-hidden bg-gray-100 shadow-inner transition-all duration-300 ${
          isExpanded ? "h-[450px]" : "h-[280px]"
        }`}
      >
        {/* Leaflet Map DOM Mount Node */}
        <div ref={mapContainerRef} className="h-full w-full z-0 cursor-crosshair" />

        {/* Top Floating Helper Banner */}
        <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none z-10 flex items-center justify-between gap-2">
          <div className="bg-[#111827]/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/10 flex items-center gap-1.5 text-[11px] font-semibold max-w-[85%] truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">👆 Click anywhere on the map or drag the pin to set your store location</span>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Expand / Minimize Map Height */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-gray-700 hover:bg-white hover:text-black shadow-md border border-gray-200 transition cursor-pointer"
              title={isExpanded ? "Minimize view" : "Expand map view"}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>

        {/* Layer Selector & Recenter Controls (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {/* Map Layer Switcher */}
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-gray-200 gap-0.5">
            <button
              type="button"
              onClick={() => handleLayerChange("googleRoadmap")}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                activeLayerKey === "googleRoadmap"
                  ? "bg-[#E8503A] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Google Map
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange("googleSatellite")}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                activeLayerKey === "googleSatellite"
                  ? "bg-[#E8503A] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange("osm")}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                activeLayerKey === "osm"
                  ? "bg-[#E8503A] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              OSM
            </button>
          </div>

          {/* Quick Zoom & Recenter Stack */}
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-gray-200 gap-1">
            <button
              type="button"
              onClick={handleRecenter}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Center map on pinned store location"
            >
              <Compass size={14} className="text-[#E8503A]" />
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <button
              type="button"
              onClick={handleZoomIn}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 font-black text-sm cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 font-black text-sm cursor-pointer"
              title="Zoom Out"
            >
              -
            </button>
          </div>
        </div>

        {/* Pinned Coordinates Live Badge (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-lg border border-gray-200 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#E8503A]/10 text-[#E8503A]">
            <MapPin size={12} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-800 font-mono tracking-tight">
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </div>
            <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
              Pinned on Map
            </div>
          </div>
        </div>
      </div>

      {/* Reverse Geocoded Address Preview Banner */}
      {detectedAddress && (
        <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-2.5 flex items-start justify-between gap-2 text-xs">
          <div className="flex items-start gap-1.5 min-w-0">
            <MapPin size={13} className="text-[#E8503A] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Pinned Address
              </p>
              <p className="text-gray-800 font-medium text-[11px] line-clamp-2">
                {detectedAddress}
              </p>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition py-0.5"
            title="Verify pin on Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink size={11} />
          </a>
        </div>
      )}

      {/* Manual Coordinate Fine-Tuning */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-600">
            Latitude (°N)
          </label>
          <input
            type="number"
            step="0.000001"
            value={currentLat}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateLocation(val, currentLng, false);
            }}
            placeholder="e.g. 6.9271"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-600">
            Longitude (°E)
          </label>
          <input
            type="number"
            step="0.000001"
            value={currentLng}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateLocation(currentLat, val, false);
            }}
            placeholder="e.g. 79.8612"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default SellerLocationMapPicker;
