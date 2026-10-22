import { useState, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";
import { discoveryApi } from "../services/api";

function MapDiscoveryView({ onSelectDeal }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchMarkers();
  }, [selectedCategory]);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== "all") params.category = selectedCategory;
      const res = await discoveryApi.getMapBusinesses(params);
      const list = res.markers || [];
      setMarkers(list);
      if (list.length > 0 && !selectedMarker) {
        setSelectedMarker(list[0]);
      }
    } catch (err) {
      console.error("Failed to load map markers:", err);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation denied or error:", err.message);
        setLocating(false);
        // Default to Colombo coordinates
        setUserLocation({ lat: 6.9271, lng: 79.8612 });
      }
    );
  };

  const filteredMarkers = markers.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q) ||
      m.address?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm overflow-hidden">
      {/* Left / Top: Interactive Visual Map Stage */}
      <div className="flex-1 flex flex-col">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8503A]/10 text-[#E8503A]">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                Interactive Local Merchant Map
              </h3>
              <p className="text-xs text-gray-500">
                {filteredMarkers.length} business{filteredMarkers.length !== 1 ? "es" : ""} with active flash deals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition active:scale-95 cursor-pointer"
            >
              <Navigation size={14} className={locating ? "animate-spin text-[#E8503A]" : "text-[#E8503A]"} />
              <span>{userLocation ? "Location Synced" : locating ? "Locating..." : "Use My GPS"}</span>
            </button>

            <button
              onClick={fetchMarkers}
              className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              title="Refresh Map"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Search inside map */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter merchants on map by name or city..."
            className="w-full rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-xs font-semibold text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-[#E8503A]"
          />
        </div>

        {/* Map Visualization Container */}
        <div className="relative h-[420px] w-full rounded-2xl bg-[#EAE8E3] border border-gray-200 overflow-hidden flex items-center justify-center select-none shadow-inner">
          {/* Subtle Grid / Map Texture */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(#C4C1B9 1px, transparent 1px), radial-gradient(#C4C1B9 1px, #EAE8E3 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 12px 12px"
            }}
          />

          {/* Map Decorative Vector Graphic (Stylized Geography & Roads) */}
          <svg
            className="absolute inset-0 h-full w-full opacity-35"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 500"
          >
            <path
              d="M 50 150 Q 200 80 400 160 T 750 200"
              fill="none"
              stroke="#D2CEC6"
              strokeWidth="24"
            />
            <path
              d="M 120 400 Q 300 320 500 380 T 780 320"
              fill="none"
              stroke="#D2CEC6"
              strokeWidth="20"
            />
            <path
              d="M 350 30 Q 380 200 420 450"
              fill="none"
              stroke="#D2CEC6"
              strokeWidth="16"
            />
            <circle cx="400" cy="220" r="140" fill="#E2DFD8" opacity="0.6" />
          </svg>

          {loading ? (
            <div className="relative z-10 flex flex-col items-center gap-2 text-gray-500">
              <span className="h-6 w-6 rounded-full border-2 border-[#E8503A] border-t-transparent animate-spin" />
              <span className="text-xs font-bold">Scanning local merchant locations...</span>
            </div>
          ) : filteredMarkers.length === 0 ? (
            <div className="relative z-10 text-center p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm max-w-sm">
              <Store size={28} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-800">No merchants found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try clearing filters to display registered businesses on the map.
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 p-8">
              {/* Plot Pins Dynamically */}
              {filteredMarkers.map((marker, index) => {
                const isSelected = selectedMarker?.id === marker.id;
                // Generate a distributed coordinate based on index / actual coords
                const posX = 20 + ((index * 29 + 17) % 65);
                const posY = 18 + ((index * 37 + 11) % 65);

                return (
                  <div
                    key={marker.id}
                    onClick={() => setSelectedMarker(marker)}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  >
                    {/* Pin Marker */}
                    <div
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        isSelected
                          ? "scale-125 z-30"
                          : "hover:scale-110"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-lg transition-colors ${
                          isSelected
                            ? "bg-[#E8503A] text-white ring-4 ring-[#E8503A]/30"
                            : "bg-[#172026] text-white group-hover:bg-[#E8503A]"
                        }`}
                      >
                        <Sparkles size={11} className="text-amber-300" />
                        <span>{marker.activeDealsCount}</span>
                      </div>

                      {/* Tooltip on hover */}
                      <div className="pointer-events-none absolute bottom-full mb-2 hidden -translate-x-1/2 left-1/2 group-hover:flex flex-col items-center whitespace-nowrap">
                        <div className="rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-xl">
                          {marker.name}
                        </div>
                        <div className="h-1.5 w-1.5 rotate-45 bg-gray-900 -mt-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* User Location Indicator */}
          {userLocation && (
            <div
              style={{ left: "50%", top: "52%" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center"
            >
              <div className="h-6 w-6 rounded-full bg-blue-500/30 animate-ping absolute" />
              <div className="h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md relative" />
            </div>
          )}

          {/* Bottom Map Legend */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-semibold text-gray-600 border border-gray-200/80 shadow-sm flex items-center gap-3 z-10">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#E8503A]" /> Merchant Pin
            </span>
            {userLocation && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Your Location
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right / Bottom: Selected Merchant Details & Active Deals Drawer */}
      <div className="w-full lg:w-96 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
        {selectedMarker ? (
          <div className="flex flex-col h-full">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8503A]">
                    {selectedMarker.category || "Merchant"}
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

              {/* Active Deals on this location */}
              <div className="mt-5">
                <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2.5">
                  Live Deals ({selectedMarker.deals?.length || 0})
                </h5>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {(selectedMarker.deals || []).map((deal) => (
                    <div
                      key={deal._id || deal.title}
                      onClick={() => onSelectDeal && onSelectDeal(deal)}
                      className="group/item flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-[#FFF0ED] hover:border-[#E8503A]/30 transition cursor-pointer"
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
                  ))}
                </div>
              </div>
            </div>

            {/* View Full Merchant Profile Button */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${selectedMarker.name} ${selectedMarker.address?.city || "Colombo"}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                <ExternalLink size={14} />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
            <Store size={36} className="mb-2 text-gray-300" />
            <p className="text-xs font-semibold">Select a merchant on the map to inspect deals</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapDiscoveryView;
