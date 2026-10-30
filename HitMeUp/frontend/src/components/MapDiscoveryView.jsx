import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Sparkles,
  Navigation,
  Store,
  Phone,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Tag
} from "lucide-react";
import { discoveryApi } from "../services/api";

// Google & OpenStreetMap Map Tiles
const TILE_LAYERS = {
  m: {
    name: "Google Streets",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "Google Maps",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20
  },
  k: {
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

/**
 * Creates custom store pin icon with deal badge and store name
 */
const createStorePinIcon = (marker, isSelected = false) => {
  const dealCount = marker.activeDealsCount || (marker.deals?.length) || 0;
  const topDiscount = marker.topDeal?.discountPercentage || (marker.deals?.[0]?.discountPercentage);
  const scale = isSelected ? "scale(1.15)" : "scale(1)";
  const zIndex = isSelected ? 9999 : 100;
  const pinBg = isSelected ? "linear-gradient(135deg, #FF4A2F 0%, #E8503A 100%)" : "linear-gradient(135deg, #1F2937 0%, #111827 100%)";
  const pillBg = isSelected ? "#E8503A" : "#111827";
  const pillBorder = isSelected ? "#ffffff" : "rgba(255,255,255,0.25)";

  return L.divIcon({
    className: "hitmeup-store-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%) ${scale}; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: ${zIndex}; cursor: pointer;">
        
        <!-- Store Name & Active Deals Pill -->
        <div style="
          background: ${pillBg};
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          margin-bottom: 4px;
          border: 1.5px solid ${pillBorder};
          display: flex;
          align-items: center;
          gap: 5px;
          max-width: 160px;
        ">
          <span style="overflow: hidden; text-overflow: ellipsis; max-width: 95px;">${marker.name}</span>
          ${dealCount > 0 ? `
            <span style="
              background: ${isSelected ? '#ffffff' : '#E8503A'};
              color: ${isSelected ? '#E8503A' : '#ffffff'};
              border-radius: 9999px;
              padding: 1px 5px;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: -0.02em;
            ">
              ${dealCount} ${dealCount === 1 ? 'deal' : 'deals'}
            </span>
          ` : ''}
        </div>

        <!-- Teardrop Marker Pin -->
        <div style="
          width: 34px;
          height: 34px;
          background: ${pinBg};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px ${isSelected ? 'rgba(232, 80, 58, 0.45)' : 'rgba(0,0,0,0.35)'};
          border: 2.5px solid #ffffff;
        ">
          <div style="
            transform: rotate(45deg);
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${topDiscount ? `${topDiscount}%` : '🏷️'}
          </div>
        </div>

        <!-- Ground Shadow -->
        <div style="
          width: 14px;
          height: 5px;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 50%;
          margin-top: 2px;
          filter: blur(1.5px);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -45]
  });
};

/**
 * Creates pulsing user location pin
 */
const createUserPinIcon = () => {
  return L.divIcon({
    className: "hitmeup-user-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: default;">
        <div style="position: absolute; width: 30px; height: 30px; background: rgba(37, 99, 235, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 16px; height: 16px; background: #2563EB; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 3px 10px rgba(0,0,0,0.35);"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

function MapDiscoveryView({ onSelectDeal }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const activeTileLayerRef = useRef(null);

  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [mapType, setMapType] = useState("m"); // 'm' for Roadmap, 'k' for Satellite, 'osm' for OpenStreetMap
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch Markers from Backend API
  const fetchMarkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== "all") params.category = selectedCategory;
      const res = await discoveryApi.getMapBusinesses(params);
      const list = res.markers || [];
      setMarkers(list);
      if (list.length > 0) {
        setSelectedMarker((prev) => (prev ? list.find((m) => m.id === prev.id) || list[0] : list[0]));
      }
    } catch (err) {
      console.error("Failed to load map markers:", err);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  // Filtered markers based on search query
  const filteredMarkers = markers.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q) ||
      m.address?.city?.toLowerCase().includes(q)
    );
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const defaultLat = 6.9271;
    const defaultLng = 79.8612;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    leafletMapRef.current = map;

    // Add Tile Layer
    const provider = TILE_LAYERS[mapType] || TILE_LAYERS.m;
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || "abc",
      maxZoom: provider.maxZoom || 19
    }).addTo(map);

    activeTileLayerRef.current = tileLayer;

    // Group for Markers
    const markersGroup = L.featureGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Resize invalidation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (activeTileLayerRef.current) {
      leafletMapRef.current.removeLayer(activeTileLayerRef.current);
    }

    const provider = TILE_LAYERS[mapType] || TILE_LAYERS.m;
    const newTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || "abc",
      maxZoom: provider.maxZoom || 19
    }).addTo(leafletMapRef.current);

    activeTileLayerRef.current = newTileLayer;
  }, [mapType]);

  // Render All Store Flags / Markers on the Map
  useEffect(() => {
    if (!leafletMapRef.current || !markersGroupRef.current) return;

    const group = markersGroupRef.current;
    group.clearLayers();

    if (filteredMarkers.length === 0) return;

    const validMarkers = filteredMarkers.filter(
      (m) => typeof m.latitude === "number" && typeof m.longitude === "number" && !isNaN(m.latitude) && !isNaN(m.longitude)
    );

    if (validMarkers.length === 0) return;

    validMarkers.forEach((marker) => {
      const isSelected = selectedMarker?.id === marker.id;
      const icon = createStorePinIcon(marker, isSelected);

      const leafletMarker = L.marker([marker.latitude, marker.longitude], {
        icon,
        title: marker.name,
        riseOnHover: true
      });

      // Click on pin selects store and pans smoothly
      leafletMarker.on("click", () => {
        setSelectedMarker(marker);
        leafletMapRef.current?.panTo([marker.latitude, marker.longitude], {
          animate: true,
          duration: 0.6
        });
      });

      // Tooltip preview
      const topDealTitle = marker.topDeal?.title ? `<br/><span style="color: #E8503A; font-weight: 700;">🔥 ${marker.topDeal.title}</span>` : "";
      leafletMarker.bindTooltip(
        `<div style="font-size: 11px; font-weight: 700; line-height: 1.3;">
          <strong>${marker.name}</strong> (${marker.category || "Store"})
          ${topDealTitle}
          <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">📍 ${marker.address?.city || "Colombo"}</div>
        </div>`,
        { direction: "top", offset: [0, -42], opacity: 0.95 }
      );

      group.addLayer(leafletMarker);
    });

    // Fit map bounds to show all available deal shops
    try {
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        leafletMapRef.current.fitBounds(bounds.pad(0.15), { maxZoom: 16 });
      }
    } catch (e) {
      console.warn("Could not fit bounds:", e);
    }
  }, [filteredMarkers, selectedMarker?.id]);

  // User GPS Location Pin Marker
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (userMarkerRef.current) {
      leafletMapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const uIcon = createUserPinIcon();
      const uMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: uIcon,
        zIndexOffset: 1000
      }).addTo(leafletMapRef.current);

      uMarker.bindTooltip("<strong>You are here</strong>", { direction: "top" });
      userMarkerRef.current = uMarker;
    }
  }, [userLocation]);

  // Geolocation trigger
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setLocating(false);
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([coords.lat, coords.lng], 15, { animate: true, duration: 1.2 });
        }
      },
      (err) => {
        console.warn("Geolocation denied or error:", err.message);
        setLocating(false);
        const fallback = { lat: 6.9271, lng: 79.8612 };
        setUserLocation(fallback);
        leafletMapRef.current?.flyTo([fallback.lat, fallback.lng], 13);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Center map on a selected marker
  const handleSelectStore = (marker) => {
    setSelectedMarker(marker);
    if (leafletMapRef.current && marker.latitude && marker.longitude) {
      leafletMapRef.current.flyTo([marker.latitude, marker.longitude], 16, {
        animate: true,
        duration: 0.8
      });
    }
  };

  // Fit all pins back in view
  const handleFitAllPins = () => {
    if (leafletMapRef.current && markersGroupRef.current) {
      const bounds = markersGroupRef.current.getBounds();
      if (bounds.isValid()) {
        leafletMapRef.current.fitBounds(bounds.pad(0.15), { animate: true });
      }
    }
  };

  // Resize listener for expand
  useEffect(() => {
    const timer = setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-sm overflow-hidden">
      {/* Left Column: Interactive Multi-Pin Map Stage */}
      <div className="flex-1 flex flex-col">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8503A]/10 text-[#E8503A]">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span>Interactive Deals Map</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  All Shops Flagged
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {filteredMarkers.length} deal shop{filteredMarkers.length !== 1 ? "s" : ""} pinned with active flash promotions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Satellite / Road Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-0.5 border border-gray-200">
              <button
                type="button"
                onClick={() => setMapType("m")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mapType === "m" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Streets
              </button>
              <button
                type="button"
                onClick={() => setMapType("k")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mapType === "k" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Fit All Pins Button */}
            <button
              type="button"
              onClick={handleFitAllPins}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition active:scale-95 cursor-pointer"
              title="Fit all shop pins into map view"
            >
              <Compass size={14} className="text-[#E8503A]" />
              <span className="hidden sm:inline">Fit All</span>
            </button>

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 cursor-pointer ${
                userLocation
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Navigation size={14} className={locating ? "animate-spin text-blue-600" : "text-blue-600"} />
              <span>{locating ? "Locating..." : userLocation ? "My GPS" : "Near Me"}</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchMarkers}
              className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              title="Refresh Deal Shops"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#E8503A]" : ""} />
            </button>
          </div>
        </div>

        {/* Merchant Quick-Selector Pills */}
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
            Stores:
          </span>
          {filteredMarkers.map((marker) => {
            const isSelected = selectedMarker?.id === marker.id;
            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => handleSelectStore(marker)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#E8503A] text-white shadow-sm shadow-[#E8503A]/30 scale-102"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Store size={13} />
                <span>{marker.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  {marker.activeDealsCount || (marker.deals?.length) || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Filter Bar */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search stores, categories or cities on map..."
            className="w-full rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-xs font-semibold text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:outline-hidden focus:border-[#E8503A] transition"
          />
        </div>

        {/* Real Interactive Map Canvas */}
        <div
          className={`relative w-full rounded-2xl bg-gray-100 border-2 border-gray-200/90 overflow-hidden shadow-inner transition-all duration-300 ${
            isExpanded ? "h-[560px]" : "h-[440px]"
          }`}
        >
          {loading && markers.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-500 bg-gray-50">
              <span className="h-6 w-6 rounded-full border-2 border-[#E8503A] border-t-transparent animate-spin" />
              <span className="text-xs font-bold">Loading Store Pins...</span>
            </div>
          ) : null}

          {/* Leaflet DOM Mounting Node */}
          <div ref={mapContainerRef} className="h-full w-full z-0 cursor-grab active:cursor-grabbing" />

          {/* Top Floating Helper Banner */}
          <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none z-10 flex items-center justify-between gap-2">
            <div className="bg-[#111827]/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/10 flex items-center gap-2 text-[11px] font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Click any shop pin on the map to inspect deals</span>
            </div>

            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-gray-700 hover:bg-white hover:text-black shadow-md border border-gray-200 transition cursor-pointer"
                title={isExpanded ? "Minimize map" : "Expand map"}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          </div>

          {/* Floating Selected Store Badge */}
          {selectedMarker && (
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 text-xs font-bold text-gray-800 border border-gray-200 shadow-md flex items-center gap-2 z-10 pointer-events-none">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8503A]/10 text-[#E8503A]">
                <MapPin size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 leading-tight font-extrabold">{selectedMarker.name}</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {selectedMarker.address?.city || "Colombo"}, Sri Lanka • {selectedMarker.activeDealsCount || selectedMarker.deals?.length || 0} active deals
                </span>
              </div>
            </div>
          )}

          {/* Bottom Right Map Zoom & Reset Controls */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-gray-200 gap-1">
            <button
              type="button"
              onClick={handleFitAllPins}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Center all store pins"
            >
              <Compass size={14} className="text-[#E8503A]" />
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <button
              type="button"
              onClick={() => leafletMapRef.current?.zoomIn()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 font-black text-sm cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => leafletMapRef.current?.zoomOut()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 font-black text-sm cursor-pointer"
              title="Zoom Out"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Selected Merchant Details & Active Flash Deals */}
      <div className="w-full lg:w-96 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
        {selectedMarker ? (
          <div className="flex flex-col h-full">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8503A]">
                    {selectedMarker.category || "Verified Merchant"}
                  </span>
                  <h4 className="mt-1 text-lg font-black text-gray-900 flex items-center gap-1.5">
                    <span>{selectedMarker.name}</span>
                    {selectedMarker.isVerified && (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    )}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    <span>
                      {selectedMarker.address?.city || "Colombo"}, {selectedMarker.address?.street || "Sri Lanka"}
                    </span>
                  </p>
                  {selectedMarker.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span>{selectedMarker.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Active Deals on this merchant */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Tag size={12} className="text-[#E8503A]" />
                    <span>Available Flash Deals ({selectedMarker.deals?.length || 0})</span>
                  </h5>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Offers
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {(selectedMarker.deals || []).length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                      No active deals currently for this location.
                    </div>
                  ) : (
                    (selectedMarker.deals || []).map((deal) => (
                      <div
                        key={deal._id || deal.title}
                        onClick={() => onSelectDeal && onSelectDeal(deal)}
                        className="group/item flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-[#FFF0ED] hover:border-[#E8503A]/30 transition cursor-pointer shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 group-hover/item:text-[#E8503A] truncate">
                            {deal.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-[#E8503A]">
                              Rs. {deal.discountedPrice?.toLocaleString() || "0"}
                            </span>
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              {deal.discountPercentage}% OFF
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-400 group-hover/item:text-[#E8503A] group-hover/item:translate-x-0.5 transition" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Direct Directions / Google Maps Action Button */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.latitude || 6.9271},${selectedMarker.longitude || 79.8612}&destination_place_id=${encodeURIComponent(
                  selectedMarker.name
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#172026] text-white py-2.5 text-xs font-bold hover:bg-[#E8503A] transition shadow-sm"
              >
                <Compass size={14} />
                <span>Get Directions on Google Maps</span>
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${selectedMarker.name} ${selectedMarker.address?.city || "Colombo"}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                <ExternalLink size={13} />
                <span>Open Store on Google Maps</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
            <Store size={36} className="mb-2 text-gray-300" />
            <p className="text-xs font-semibold">Select a store pin to inspect its flash deals and location</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapDiscoveryView;
