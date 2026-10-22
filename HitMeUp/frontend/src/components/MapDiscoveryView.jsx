import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Sparkles,
  Navigation,
  Store,
  Phone,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  Sliders,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { discoveryApi } from "../services/api";

const RADIUS_OPTIONS = [
  { label: "5 km", value: 5 },
  { label: "15 km", value: 15 },
  { label: "30 km", value: 30 },
  { label: "50 km", value: 50 },
  { label: "Island-Wide", value: 500 }
];

const CATEGORY_CHIPS = [
  { label: "All Offers", value: "all" },
  { label: "Food & Drinks", value: "Food & Beverage" },
  { label: "Electronics", value: "Electronics" },
  { label: "Fashion", value: "Fashion" },
  { label: "Beauty & Spa", value: "Beauty & Spa" },
  { label: "Activities", value: "Activities & Events" }
];

function MapDiscoveryView({ onSelectDeal }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(15);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userCircleRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Fetch markers on mount or when category/location/radius changes
  useEffect(() => {
    fetchMarkers();
  }, [selectedCategory, userLocation, selectedRadius]);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== "all") params.category = selectedCategory;

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = selectedRadius;
      }

      const res = await discoveryApi.getMapBusinesses(params);
      const list = res.markers || [];
      setMarkers(list);

      setIsFallback(Boolean(res.isFallback));
      setFallbackMessage(
        res.message ||
          (res.isFallback
            ? `No offers found within ${selectedRadius}km of your location. Showing all ${list.length} available offers across Sri Lanka.`
            : "")
      );

      // Keep selection or pick the first marker
      if (list.length > 0) {
        setSelectedMarker((prev) => {
          if (!prev) return list[0];
          const exists = list.find((m) => m.id === prev.id);
          return exists || list[0];
        });
      } else {
        setSelectedMarker(null);
      }
    } catch (err) {
      console.error("Failed to load map markers:", err);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger GPS Geolocation
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

        // Center map to user location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 13, { duration: 1.5 });
        }
      },
      (err) => {
        console.warn("Geolocation denied or error:", err.message);
        setLocating(false);
        // Default to Colombo coordinates
        const defaultColombo = { lat: 6.9271, lng: 79.8612 };
        setUserLocation(defaultColombo);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([defaultColombo.lat, defaultColombo.lng], 13, { duration: 1.2 });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Filter markers by text search
  const filteredMarkers = markers.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q) ||
      m.address?.city?.toLowerCase().includes(q) ||
      m.address?.street?.toLowerCase().includes(q)
    );
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter = [6.9271, 79.8612]; // Colombo center
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Positron clean map tiles (OpenStreetMap attribution)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd"
        }
      ).addTo(map);

      // Dedicated layer for markers
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Leaflet markers and user circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Render User GPS position and radius circle
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      if (userCircleRef.current) {
        userCircleRef.current.remove();
      }

      // User location radar pulse pin
      const userIcon = L.divIcon({
        className: "user-gps-marker",
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(59, 130, 246, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 9999px; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(37,99,235,0.5);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      })
        .bindTooltip("You are here", { direction: "top", offset: [0, -10] })
        .addTo(map);

      // Radar radius circle
      if (selectedRadius && selectedRadius < 500) {
        userCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: selectedRadius * 1000,
          color: "#E8503A",
          weight: 1.5,
          opacity: 0.4,
          fillColor: "#E8503A",
          fillOpacity: 0.05,
          dashArray: "6, 6"
        }).addTo(map);
      }
    }

    // 2. Render Business Pins
    const bounds = [];
    if (userLocation) bounds.push([userLocation.lat, userLocation.lng]);

    filteredMarkers.forEach((marker) => {
      const lat = marker.latitude || 6.9271;
      const lng = marker.longitude || 79.8612;
      bounds.push([lat, lng]);

      const isSelected = selectedMarker?.id === marker.id;
      const count = marker.activeDealsCount || (marker.deals?.length ?? 1);
      const topDealDiscount = marker.topDeal?.discountPercentage;

      // Custom vibrant HTML Pin
      const pinHtml = `
        <div class="group-pin" style="cursor: pointer; transform: translate(-50%, -100%);">
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 9999px;
            background: ${isSelected ? "#E8503A" : "#172026"};
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 8px 18px rgba(0,0,0,0.25);
            border: 2px solid #FFFFFF;
            transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
            transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">
            <span style="display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 9999px; background: rgba(255,255,255,0.2); font-size: 9px;">
              ${count}
            </span>
            <span style="white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis;">
              ${marker.name}
            </span>
            ${
              topDealDiscount
                ? `<span style="background: #10B981; color: white; padding: 1px 4px; border-radius: 4px; font-size: 9px; font-weight: 900;">${topDealDiscount}%</span>`
                : ""
            }
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid ${isSelected ? "#E8503A" : "#172026"};
            margin: 0 auto;
          "></div>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: pinHtml,
        iconSize: [0, 0]
      });

      const leafletMarker = L.marker([lat, lng], {
        icon: markerIcon,
        zIndexOffset: isSelected ? 500 : 100
      });

      leafletMarker.on("click", () => {
        setSelectedMarker(marker);
        map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
      });

      leafletMarker.addTo(markersLayer);
    });

    // Fit bounds if available and user didn't manually pan
    if (bounds.length > 1 && !selectedMarker) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [filteredMarkers, selectedMarker, userLocation, selectedRadius]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    if (userLocation) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 13);
    } else {
      mapInstanceRef.current.flyTo([6.9271, 79.8612], 12);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white rounded-3xl border border-gray-200/90 p-5 lg:p-6 shadow-sm overflow-hidden">
      {/* Top Banner: Fallback Alert if No Offers Directly Nearby */}
      {isFallback && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 p-3.5 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
                Showing Island-Wide Offers
              </p>
              <p className="text-xs text-amber-800">
                {fallbackMessage ||
                  `No active offers were found within ${selectedRadius}km. We've loaded all ${markers.length} available flash offers across Sri Lanka for you!`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedRadius(500)}
              className="rounded-xl bg-amber-200/80 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-300 transition cursor-pointer"
            >
              Show All Island-Wide
            </button>
          </div>
        </div>
      )}

      {/* Main Map Stage + Merchant Drawer */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left / Center: Interactive Map Stage */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8503A]/10 text-[#E8503A]">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  Live Merchant Discovery Map
                </h3>
                <p className="text-xs text-gray-500">
                  {filteredMarkers.length} merchant location{filteredMarkers.length !== 1 ? "s" : ""}{" "}
                  with active flash deals
                </p>
              </div>
            </div>

            {/* GPS & Refresh Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition cursor-pointer"
                title="Locate me via browser GPS"
              >
                <Navigation
                  size={14}
                  className={locating ? "animate-spin text-[#E8503A]" : "text-[#E8503A]"}
                />
                <span>
                  {userLocation
                    ? "Location Synced"
                    : locating
                    ? "Acquiring GPS..."
                    : "Near Me (GPS)"}
                </span>
              </button>

              <button
                onClick={fetchMarkers}
                disabled={loading}
                className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                title="Refresh Map Markers"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-[#E8503A]" : ""} />
              </button>
            </div>
          </div>

          {/* Search & Radius Filter Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3">
            <div className="sm:col-span-7 relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search merchant by name, city, or street..."
                className="w-full rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-xs font-semibold text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-[#E8503A]"
              />
            </div>

            {/* Radius Selector Pills */}
            <div className="sm:col-span-5 flex items-center justify-between sm:justify-end gap-1 overflow-x-auto bg-gray-50 p-1 rounded-xl border border-gray-200">
              <span className="text-[10px] font-black uppercase text-gray-400 px-1 flex items-center gap-1 shrink-0">
                <Sliders size={11} /> Radius:
              </span>
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedRadius(opt.value)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedRadius === opt.value
                      ? "bg-[#E8503A] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
            {CATEGORY_CHIPS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === cat.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Leaflet Map Stage Container */}
          <div className="relative h-[440px] w-full rounded-2xl border border-gray-200 overflow-hidden shadow-inner bg-gray-100">
            {/* The Real Leaflet Map DIV */}
            <div ref={mapContainerRef} className="h-full w-full z-0" />

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 pointer-events-none">
                <span className="h-7 w-7 rounded-full border-3 border-[#E8503A] border-t-transparent animate-spin" />
                <span className="text-xs font-black text-gray-700">Updating merchant locations...</span>
              </div>
            )}

            {/* Zero Results Prompt on Map */}
            {!loading && filteredMarkers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-6 z-10 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-6 text-center shadow-lg max-w-sm pointer-events-auto">
                  <Store size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-black text-gray-900">No matching merchants</p>
                  <p className="text-xs text-gray-500 mt-1 mb-3">
                    No merchants matching "{searchFilter}" were found in this area.
                  </p>
                  <button
                    onClick={() => {
                      setSearchFilter("");
                      setSelectedCategory("all");
                      setSelectedRadius(500);
                    }}
                    className="rounded-xl bg-[#E8503A] text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-[#D4402C] transition cursor-pointer"
                  >
                    Reset Filters & Show All
                  </button>
                </div>
              </div>
            )}

            {/* Map Custom Floating Control Buttons */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
              <button
                onClick={handleZoomIn}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={handleZoomOut}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={handleResetView}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition cursor-pointer"
                title="Center on location"
              >
                <Maximize2 size={15} />
              </button>
            </div>

            {/* Bottom Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-semibold text-gray-700 border border-gray-200 shadow-md flex items-center gap-3 z-10">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E8503A]" /> Merchant Pin
              </span>
              {userLocation && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" /> You (GPS)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Merchant Details & Deals Drawer */}
        <div className="w-full lg:w-96 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
          {selectedMarker ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Merchant Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8503A]">
                        {selectedMarker.category || "Merchant"}
                      </span>
                      {selectedMarker.distanceText && (
                        <span className="inline-block rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                          📍 {selectedMarker.distanceText}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1.5 text-lg font-black text-gray-900 flex items-center gap-1.5">
                      <span>{selectedMarker.name}</span>
                      {selectedMarker.isVerified && (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      )}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span>
                        {selectedMarker.address?.city || "Colombo"},{" "}
                        {selectedMarker.address?.street || "Sri Lanka"}
                      </span>
                    </p>
                    {selectedMarker.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} className="text-gray-400 shrink-0" />
                        <span>{selectedMarker.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Active Flash Deals at this merchant */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <h5 className="text-xs font-black uppercase tracking-wider text-gray-400">
                      Live Flash Deals ({selectedMarker.deals?.length || 0})
                    </h5>
                    <span className="text-[11px] font-bold text-[#E8503A]">Instant Claim</span>
                  </div>

                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                    {(selectedMarker.deals || []).map((deal) => (
                      <div
                        key={deal._id || deal.title}
                        onClick={() => onSelectDeal && onSelectDeal(deal)}
                        className="group/item flex items-center justify-between gap-3 p-3 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-[#FFF0ED] hover:border-[#E8503A]/30 transition cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 group-hover/item:text-[#E8503A] truncate">
                            {deal.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-[#E8503A]">
                              Rs. {deal.discountedPrice?.toLocaleString() || "0"}
                            </span>
                            {deal.originalPrice && (
                              <span className="text-[11px] text-gray-400 line-through">
                                Rs. {deal.originalPrice?.toLocaleString()}
                              </span>
                            )}
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              {deal.discountPercentage}% OFF
                            </span>
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-gray-400 group-hover/item:text-[#E8503A] group-hover/item:translate-x-0.5 transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* View Directions in Google Maps */}
              <div className="mt-5 pt-3 border-t border-gray-100">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedMarker.name} ${selectedMarker.address?.city || "Colombo"} Sri Lanka`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition active:scale-98"
                >
                  <ExternalLink size={14} />
                  <span>Get Directions in Google Maps</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6 min-h-[300px]">
              <Store size={40} className="mb-2 text-gray-300" />
              <p className="text-xs font-bold text-gray-700">Select a merchant pin on the map</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Click any pin to inspect verified details and claim active flash vouchers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapDiscoveryView;
