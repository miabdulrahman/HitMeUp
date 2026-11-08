import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeCategory, getCategorySlug } from "../data/categories";
import DealCard from "./DealCard";
import DealDetailModal from "./DealDetailModal";
import MapDiscoveryView from "./MapDiscoveryView";
import { dealApi, discoveryApi } from "../services/api";
import { useLocationContext } from "../context/LocationContext";
import { isDealExpired } from "../utils/dealTimer";
import {
  Tag,
  ArrowRight,
  LayoutGrid,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  Navigation,
} from "lucide-react";

function FeaturedDeals({ initialSearch = "" }) {
  const { userLocation, hasRealLocation, requestLocation, radius } = useLocationContext();
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [dealsList, setDealsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchFilter, setSearchFilter] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("discount"); // default to highest discount / top deals
  const [displayMode, setDisplayMode] = useState("grid"); // grid | map
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showNearby, setShowNearby] = useState(hasRealLocation);

  // Sync with real location state
  useEffect(() => {
    if (hasRealLocation) {
      setShowNearby(true);
    }
  }, [hasRealLocation]);

  const handleToggleNearby = () => {
    if (showNearby && hasRealLocation) {
      setShowNearby(false);
    } else if (hasRealLocation) {
      setShowNearby(true);
    } else {
      // Client not accepted location yet: request permission
      requestLocation();
      setShowNearby(true);
    }
  };

  useEffect(() => {
    if (typeof initialSearch === "string") {
      setSearchFilter(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchDeals = async () => {
      setLoading(true);
      try {
        let liveDeals = [];

        // If Show Nearby is active AND client accepted location, fetch nearby deals
        if (showNearby && hasRealLocation && userLocation?.latitude && userLocation?.longitude) {
          const res = await discoveryApi.getNearbyDeals({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
            radius: radius || 25,
          });
          liveDeals = res.deals || [];
        } else {
          // If client not accepted or Show Nearby is toggled off: show all top deals across platform
          const response = await dealApi.getDeals({
            limit: 50,
            sort: "discount_desc",
          });
          liveDeals = response.deals || response.data || [];
        }

        if (isMounted) {
          if (Array.isArray(liveDeals) && liveDeals.length > 0) {
            const formattedDeals = liveDeals
              .filter((d) => !isDealExpired(d))
              .map((d, index) => {
                const displayCat = normalizeCategory(d.category);
                const catSlug = getCategorySlug(d.category);
                const locationCity =
                  d.businessId?.address?.city ||
                  (typeof d.businessId?.address === "string"
                    ? d.businessId?.address
                    : "Colombo, Sri Lanka");

                return {
                  id: d._id || index + 1,
                  _id: d._id,
                  title: d.title,
                  business:
                    d.businessId?.name || d.businessName || "Local merchant",
                  businessId: d.businessId,
                  category: displayCat,
                  categorySlug: catSlug,
                  price: `Rs. ${d.discountedPrice?.toLocaleString() || d.price || "0"}`,
                  rawPrice: Number(d.discountedPrice || d.price || 0),
                  oldPrice: `Rs. ${d.originalPrice?.toLocaleString() || d.oldPrice || "0"}`,
                  rawOldPrice: Number(d.originalPrice || d.oldPrice || 0),
                  discount: `${d.discountPercentage || 0}% off`,
                  discountPercentage: Number(d.discountPercentage || 0),
                  image:
                    d.imageUrl ||
                    d.image ||
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
                  endDate: d.endDate,
                  startDate: d.startDate,
                  durationHours: d.durationHours,
                  status: d.status,
                  distance: d.distanceText || (d.distanceKm !== undefined && d.distanceKm !== null ? `${d.distanceKm} km away` : locationCity),
                  distanceText: d.distanceText || (d.distanceKm !== undefined && d.distanceKm !== null ? `${d.distanceKm} km away` : locationCity),
                  distanceKm: d.distanceKm,
                  location: locationCity,
                  rating: 4.8,
                  reviewsCount: 35,
                  vouchersLeft: Number(d.availableQuantity ?? 10),
                  description: d.description,
                  highlights: [
                    "Digital QR voucher pass",
                    "Verified neighborhood store",
                  ],
                  terms: d.terms || "Valid during store operating hours.",
                };
              });

            setDealsList(formattedDeals);
          } else {
            setDealsList([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch database deals:", err.message);
        if (isMounted) {
          setDealsList([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeals();

    return () => {
      isMounted = false;
    };
  }, [showNearby, hasRealLocation, userLocation, radius]);

  const categories = [
    "All",
    "Food",
    "Fashion",
    "Electronics",
    "Home",
    "Health",
    "Sports",
    "Services",
    "Games",
  ];

  const categoryCounts = useMemo(() => {
    const counts = { All: dealsList.length };
    categories.slice(1).forEach((cat) => {
      const targetSlug = getCategorySlug(cat);
      counts[cat] = dealsList.filter((d) => {
        const itemCatSlug = d.categorySlug || getCategorySlug(d.category);
        return (
          d.category?.toLowerCase() === cat.toLowerCase() ||
          itemCatSlug === targetSlug
        );
      }).length;
    });
    return counts;
  }, [dealsList]);

  const filteredDeals = useMemo(() => {
    const byCat =
      selectedCategory === "All"
        ? dealsList
        : dealsList.filter((d) => {
            const selectedLower = selectedCategory.toLowerCase();
            const targetSlug = getCategorySlug(selectedCategory);
            const itemCatSlug = d.categorySlug || getCategorySlug(d.category);
            return (
              d.category?.toLowerCase() === selectedLower ||
              itemCatSlug === targetSlug ||
              getCategorySlug(d.category) === targetSlug
            );
          });

    const query = searchFilter.trim().toLowerCase();
    const bySearch = !query
      ? byCat
      : byCat.filter(
          (d) =>
            d.title?.toLowerCase().includes(query) ||
            d.business?.toLowerCase().includes(query) ||
            d.location?.toLowerCase().includes(query) ||
            d.category?.toLowerCase().includes(query) ||
            d.description?.toLowerCase().includes(query)
        );

    const sorted = [...bySearch];
    if (sortBy === "discount") {
      sorted.sort(
        (a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)
      );
    } else if (sortBy === "price-asc") {
      sorted.sort((a, b) => (a.rawPrice || 0) - (b.rawPrice || 0));
    } else if (sortBy === "stock") {
      sorted.sort((a, b) => (a.vouchersLeft || 0) - (b.vouchersLeft || 0));
    }
    return sorted;
  }, [dealsList, selectedCategory, searchFilter, sortBy]);

  const handleOpenDeal = (deal) => {
    setSelectedDeal(deal);
    setModalOpen(true);
  };

  return (
    <section
      id="deals"
      className="border-b border-[#E6E0D6] bg-[#F7F4EE] py-20"
    >
      <div ref={sectionRef} className="reveal mx-auto max-w-[1200px] px-6">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#7B7266]">
              {showNearby && hasRealLocation ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-0.5 text-[11px] font-mono font-medium text-[#166534]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  <span>Showing deals near your location (within {radius}km)</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-2.5 py-0.5 text-[11px] font-medium text-[#C2410C]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#EA580C]" />
                    <span>Showing all top deals</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleNearby}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E6E0D6] bg-white px-2 py-0.5 text-[11px] font-medium text-[#D94832] transition-colors hover:bg-[#EFE9DF] cursor-pointer"
                  >
                    <Navigation size={11} strokeWidth={1.5} />
                    <span>Show nearby</span>
                  </button>
                </div>
              )}
            </div>

            <h2 className="mt-1.5 text-[28px] sm:text-[32px] font-medium tracking-[-0.025em] text-[#1F1B16]">
              {showNearby && hasRealLocation ? "Deals near you" : "All Top Deals"}
            </h2>
            <p className="mt-1.5 max-w-[54ch] text-[15px] text-[#5E554A]">
              {showNearby && hasRealLocation
                ? `Filter active markdowns by category, sort by discount, or open the full street map to explore pinned stores within ${radius}km.`
                : "Explore top verified flash markdowns and counter passes across all stores. Turn on 'Show nearby' to filter deals closest to your street."}
            </p>
          </div>

          {/* View Mode Switcher & Full Directory Link */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] p-1">
              <button
                type="button"
                onClick={() => setDisplayMode("grid")}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
                  displayMode === "grid"
                    ? "bg-[#1F1B16] text-[#FDFBF7]"
                    : "text-[#5E554A] hover:text-[#1F1B16]"
                }`}
              >
                <LayoutGrid size={14} strokeWidth={1.5} />
                <span>Pass grid</span>
              </button>

              {/* Direct Full Map View Navigator */}
              <button
                type="button"
                onClick={() => navigate("/deals?view=map")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-[#5E554A] hover:bg-[#EFE9DF] hover:text-[#1F1B16] transition-colors duration-150 cursor-pointer"
                title="Go to full street map view"
              >
                <MapPin size={14} strokeWidth={1.5} className="text-[#D94832]" />
                <span>Full map view</span>
              </button>
            </div>

            <button
              onClick={() => navigate("/deals?view=map")}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-3.5 text-[13px] font-medium text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF] cursor-pointer"
            >
              <span>Explore full map</span>
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {displayMode === "map" ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-3">
            <MapDiscoveryView onSelectDeal={handleOpenDeal} fullView={true} />
          </div>
        ) : (
          <>
            {/* Active Search Filter Banner */}
            {searchFilter && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-[13px] text-[#1F1B16]">
                  <span className="text-[#7B7266]">Filtered by:</span>
                  <span className="font-medium text-[#D94832]">"{searchFilter}"</span>
                  <span className="font-mono text-[11px] text-[#7B7266]">
                    ({filteredDeals.length} {filteredDeals.length === 1 ? "pass" : "passes"} found)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E0D6] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5E554A] transition-colors hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
                >
                  <X size={12} strokeWidth={1.5} />
                  <span>Clear filter</span>
                </button>
              </div>
            )}

            {/* Interactive Filter & Sort Toolbar */}
            <div className="mt-7 flex flex-col justify-between gap-3 rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-3 lg:flex-row lg:items-center">
              {/* Category Pills with Live Counts + Show Nearby Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                {/* Dedicated Show Nearby Filter Button */}
                <button
                  type="button"
                  onClick={handleToggleNearby}
                  className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                    showNearby && hasRealLocation
                      ? "bg-[#D94832] text-white shadow-xs"
                      : showNearby && !hasRealLocation
                      ? "border border-[#D94832] bg-[#FFF7ED] text-[#D94832]"
                      : "border border-[#E6E0D6] bg-white text-[#5E554A] hover:border-[#D94832]/50 hover:bg-[#F7F4EE] hover:text-[#D94832]"
                  }`}
                  title={
                    showNearby && hasRealLocation
                      ? "Currently showing deals near your street. Click to view all top deals."
                      : "Filter flash deals closest to your street"
                  }
                >
                  <Navigation
                    size={13}
                    strokeWidth={1.75}
                    className={showNearby && hasRealLocation ? "animate-pulse" : ""}
                  />
                  <span>Show nearby</span>
                  {showNearby && hasRealLocation && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  )}
                </button>

                <div className="h-5 w-px bg-[#E6E0D6] mx-0.5 shrink-0" />

                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
                        active
                          ? "bg-[#1F1B16] text-[#FDFBF7]"
                          : "bg-transparent text-[#5E554A] hover:bg-[#EFE9DF] hover:text-[#1F1B16]"
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          active ? "text-[#A89F91]" : "text-[#7B7266]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:w-56 sm:flex-initial">
                  <Search
                    size={14}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7B7266]"
                  />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter by dish or area..."
                    className="h-9 sm:h-8 w-full rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] pl-8 pr-7 text-[16px] sm:text-[12px] text-[#1F1B16] placeholder-[#7B7266] focus:border-[#1F1B16] focus:bg-white focus:outline-none"
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7B7266] hover:text-[#1F1B16]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="inline-flex h-9 sm:h-8 items-center gap-1.5 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-2.5">
                  <SlidersHorizontal
                    size={13}
                    strokeWidth={1.5}
                    className="text-[#7B7266]"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort deals"
                    className="bg-transparent text-[12px] font-medium text-[#1F1B16] focus:outline-none cursor-pointer"
                  >
                    <option value="discount">Highest discount (Top deals)</option>
                    <option value="featured">Featured passes</option>
                    <option value="price-asc">Lowest price (Rs.)</option>
                    <option value="stock">Ending soonest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Deals Cards Grid */}
            <div className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-80 flex-col rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-4"
                  >
                    <div className="h-40 w-full rounded-lg bg-[#EFE9DF]" />
                    <div className="mt-4 h-3.5 w-1/3 rounded bg-[#EFE9DF]" />
                    <div className="mt-2 h-4 w-3/4 rounded bg-[#EFE9DF]" />
                    <div className="mt-auto flex items-center justify-between border-t border-[#E6E0D6] pt-3">
                      <div className="h-4 w-1/4 rounded bg-[#EFE9DF]" />
                      <div className="h-7 w-1/3 rounded-lg bg-[#EFE9DF]" />
                    </div>
                  </div>
                ))
              ) : filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onOpen={handleOpenDeal} />
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-12 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A]">
                    <Tag size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[16px] font-medium text-[#1F1B16]">
                    No unexpired passes match your filter
                  </h3>
                  <p className="mx-auto mt-1 max-w-[44ch] text-[13px] text-[#7B7266]">
                    All promotions currently meeting this criteria have concluded.
                    Try clearing your search keyword or switching categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchFilter("");
                    }}
                    className="mt-4 inline-flex h-9 items-center rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-4 text-[13px] font-medium text-[#1F1B16] hover:bg-[#EFE9DF] cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <DealDetailModal
        deal={selectedDeal}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}

export default FeaturedDeals;
