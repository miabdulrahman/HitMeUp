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
  ExternalLink,
  Layers,
  Compass
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
  const [mapType, setMapType] = useState("m"); // 'm' for Roadmap, 'k' for Satellite

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
      if (list.length > 0) {
        setSelectedMarker((prev) => prev ? list.find((m) => m.id === prev.id) || list[0] : list[0]);
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
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation denied or error:", err.message);
        setLocating(false);
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

  // Calculate current Google Map embed target
  const mapCenterLat = selectedMarker?.latitude || userLocation?.lat || 6.9271;
  const mapCenterLng = selectedMarker?.longitude || userLocation?.lng || 79.8612;
  const mapLabel = selectedMarker ? `${selectedMarker.name}, ${selectedMarker.address?.city || "Colombo"}` : "Colombo, Sri Lanka";

  // Google Maps standard embed query
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${mapCenterLat},${mapCenterLng}+(${encodeURIComponent(
    mapLabel
  )})&t=${mapType}&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm overflow-hidden">
      {/* Left Column: Real Google Map Stage */}
      <div className="flex-1 flex flex-col">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8503A]/10 text-[#E8503A]">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span>Google Maps Discovery</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  Live GPS
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {filteredMarkers.length} verified merchant{filteredMarkers.length !== 1 ? "s" : ""} on map
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Satellite / Street Map Toggle */}
            <button
              onClick={() => setMapType(mapType === "m" ? "k" : "m")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition active:scale-95 cursor-pointer"
              title="Toggle Satellite / Road view"
            >
              <Layers size={14} className="text-[#E8503A]" />
              <span>{mapType === "m" ? "Satellite" : "Road Map"}</span>
            </button>

            {/* GPS Location Button */}
            <button
              onClick={handleGetLocation}
              disabled={locating}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 cursor-pointer ${
                userLocation
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Navigation size={14} className={locating ? "animate-spin text-blue-600" : "text-blue-600"} />
              <span>{locating ? "Locating..." : userLocation ? "My GPS Synced" : "Center on Me"}</span>
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
                onClick={() => setSelectedMarker(marker)}
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
                  {marker.activeDealsCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search inside map */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search stores or cities on map..."
            className="w-full rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-xs font-semibold text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-[#E8503A]"
          />
        </div>

        {/* Real Google Maps Container */}
        <div className="relative h-[430px] w-full rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shadow-inner">
          {loading ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-500 bg-gray-50">
              <span className="h-6 w-6 rounded-full border-2 border-[#E8503A] border-t-transparent animate-spin" />
              <span className="text-xs font-bold">Loading Google Maps...</span>
            </div>
          ) : (
            <iframe
              key={`${mapCenterLat}-${mapCenterLng}-${mapType}`}
              title="Google Maps Merchant Locator"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={googleMapEmbedUrl}
              className="h-full w-full rounded-2xl"
            />
          )}

          {/* Floating Current Location Badge */}
          {selectedMarker && (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 text-xs font-bold text-gray-800 border border-gray-200 shadow-md flex items-center gap-2 z-10 pointer-events-none">
              <MapPin size={15} className="text-[#E8503A]" />
              <div className="flex flex-col">
                <span className="text-gray-900 leading-tight">{selectedMarker.name}</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {selectedMarker.address?.city || "Colombo"}, Sri Lanka
                </span>
              </div>
            </div>
          )}
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
                <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2.5">
                  Available Flash Deals ({selectedMarker.deals?.length || 0})
                </h5>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {(selectedMarker.deals || []).length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                      No active deals currently for this location.
                    </div>
                  ) : (
                    (selectedMarker.deals || []).map((deal) => (
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
            <p className="text-xs font-semibold">Select a store to inspect its flash deals and location</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapDiscoveryView;
