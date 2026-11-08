import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  LayoutGrid,
  Navigation,
  Map as MapIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DealCard from "../components/DealCard";
import DealDetailModal from "../components/DealDetailModal";
import SellerProfileModal from "../components/SellerProfileModal";
import MapDiscoveryView from "../components/MapDiscoveryView";
import { categories, normalizeCategory, getCategorySlug } from "../data/categories";
import { discoveryApi } from "../services/api";
import { useLocationContext } from "../context/LocationContext";
import { isDealExpired } from "../utils/dealTimer";

function CategoryPage({ defaultView }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentCategory = useMemo(() => {
    if (!slug || slug === "all") return null;
    return (
      categories.find(
        (c) =>
          c.slug.toLowerCase() === slug.toLowerCase() ||
          c.name.toLowerCase() === slug.toLowerCase()
      ) || null
    );
  }, [slug]);

  const [activeSlug, setActiveSlug] = useState(slug || "all");
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialSearch = searchParams.get("q") || searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("recommended");
  const [dealsList, setDealsList] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Parse viewMode from URL query (?view=map) or /map route or defaultView prop
  const initialView =
    searchParams.get("view") === "map" ||
    location.pathname === "/map" ||
    defaultView === "map"
      ? "map"
      : "grid";
  const [viewMode, setViewMode] = useState(initialView);

  const { userLocation: contextLocation, hasRealLocation, requestLocation: requestContextLocation } = useLocationContext();
  const [nearbyMode, setNearbyMode] = useState(hasRealLocation);
  const [nearbyRadius, setNearbyRadius] = useState(25);
  const userLocation = contextLocation;
  const [locating, setLocating] = useState(false);
  const [nearbyFallback, setNearbyFallback] = useState(null);

  // Sync viewMode and search query if URL changes
  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search") || "";
    setSearchQuery(q);

    if (searchParams.get("view") === "map" || location.pathname === "/map" || defaultView === "map") {
      setViewMode("map");
    } else if (searchParams.get("view") === "grid") {
      setViewMode("grid");
    }
  }, [searchParams, location.pathname, defaultView]);

  useEffect(() => {
    setActiveSlug(slug || "all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    const fetchCategoryDeals = async () => {
      setLoading(true);
      try {
        let liveDeals = [];
        const catName =
          currentCategory && currentCategory.name !== "All"
            ? currentCategory.name
            : undefined;

        if (nearbyMode && userLocation) {
          const response = await discoveryApi.getNearbyDeals({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
            radius: nearbyRadius,
            category: catName,
          });
          liveDeals = response.deals || [];
          if (response.isFallback) {
            setNearbyFallback({
              message: response.message,
              count: response.count,
              radius: nearbyRadius,
            });
          } else {
            setNearbyFallback(null);
          }
        } else {
          setNearbyFallback(null);
          const searchParamsObj = { sortBy, limit: 100 };
          if (catName) searchParamsObj.category = catName;
          const response = await discoveryApi.searchDeals(searchParamsObj);
          liveDeals = response.deals || [];
        }

        if (isMounted) {
          if (Array.isArray(liveDeals)) {
            const formattedLiveDeals = liveDeals
              .filter((d) => !isDealExpired(d))
              .map((d) => {
                const displayCat = normalizeCategory(d.category);
                const catSlug = getCategorySlug(d.category);
                const locationCity =
                  d.businessId?.address?.city ||
                  (typeof d.businessId?.address === "string"
                    ? d.businessId?.address
                    : "Colombo, Sri Lanka");

                return {
                  id: d._id,
                  _id: d._id,
                  title: d.title,
                  business:
                    d.businessId?.name || d.businessName || "Local merchant",
                  businessId: d.businessId,
                  category: displayCat,
                  categorySlug: catSlug,
                  price: `Rs. ${d.discountedPrice?.toLocaleString() || "0"}`,
                  rawPrice: d.discountedPrice,
                  oldPrice: `Rs. ${d.originalPrice?.toLocaleString() || "0"}`,
                  rawOldPrice: d.originalPrice,
                  discount: `${d.discountPercentage || 0}% off`,
                  discountPercentage: d.discountPercentage || 0,
                  image:
                    d.imageUrl ||
                    d.image ||
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
                  endDate: d.endDate,
                  startDate: d.startDate,
                  durationHours: d.durationHours,
                  status: d.status,
                  distance:
                    d.distanceText ||
                    (d.distanceKm !== undefined
                      ? `${d.distanceKm} km away`
                      : locationCity),
                  location: locationCity,
                  rating: 4.8,
                  reviewsCount: 35,
                  vouchersLeft: d.availableQuantity || 10,
                  description: d.description,
                  isFavorited: d.isFavorited || false,
                  highlights: [
                    "Digital QR voucher pass",
                    "Valid for counter redemption",
                    "Verified neighborhood store",
                  ],
                  terms: d.terms || "Present digital voucher code upon arrival.",
                };
              });

            setDealsList(formattedLiveDeals);
          } else {
            setDealsList([]);
          }
        }
      } catch (err) {
        console.error(
          "Failed to fetch category deals from discovery API:",
          err.message
        );
        if (isMounted) setDealsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategoryDeals();

    return () => {
      isMounted = false;
    };
  }, [currentCategory, nearbyMode, userLocation, nearbyRadius, sortBy]);

  // Auto-open deal modal if dealId is provided in URL query (?dealId=... or ?deal=... or ?id=...)
  useEffect(() => {
    const targetDealId =
      searchParams.get("dealId") ||
      searchParams.get("deal") ||
      searchParams.get("id");
    if (!targetDealId) return;

    if (dealsList.length > 0) {
      const match = dealsList.find(
        (d) => String(d.id || d._id) === String(targetDealId)
      );
      if (match) {
        setSelectedDeal(match);
        setModalOpen(true);
        return;
      }
    }

    discoveryApi
      .getDealDetails(targetDealId)
      .then((res) => {
        if (res.deal) {
          setSelectedDeal(res.deal);
          setModalOpen(true);
        }
      })
      .catch(() => {});
  }, [searchParams, dealsList]);

  const handleToggleNearby = () => {
    if (nearbyMode && hasRealLocation) {
      setNearbyMode(false);
      return;
    }

    if (hasRealLocation) {
      setNearbyMode(true);
      return;
    }

    requestContextLocation();
    setNearbyMode(true);
  };

  const handleSwitchView = (mode) => {
    setViewMode(mode);
    const params = new URLSearchParams(location.search);
    if (mode === "map") {
      params.set("view", "map");
    } else {
      params.delete("view");
    }
    const nextSearch = params.toString();
    navigate(nextSearch ? `?${nextSearch}` : location.pathname, { replace: true });
  };

  const handleSearchInput = (val) => {
    setSearchQuery(val);
    const params = new URLSearchParams(window.location.search);
    if (val.trim()) {
      params.set("q", val.trim());
    } else {
      params.delete("q");
      params.delete("search");
    }
    const newSearch = params.toString();
    const nextUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  };

  const filteredDeals = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return dealsList
      .filter((deal) => {
        // Enforce strictly active/unexpired
        if (isDealExpired(deal)) return false;

        const dealSlug = deal.categorySlug || getCategorySlug(deal.category);
        const matchesCategory =
          activeSlug === "all" ||
          dealSlug === activeSlug.toLowerCase() ||
          deal.category?.toLowerCase() === activeSlug.toLowerCase() ||
          (currentCategory &&
            (dealSlug === currentCategory.slug.toLowerCase() ||
              deal.category?.toLowerCase() ===
                currentCategory.name.toLowerCase() ||
              getCategorySlug(deal.category) ===
                currentCategory.slug.toLowerCase()));

        const matchesQuery =
          !qLower ||
          deal.title?.toLowerCase().includes(qLower) ||
          deal.business?.toLowerCase().includes(qLower) ||
          deal.category?.toLowerCase().includes(qLower) ||
          deal.description?.toLowerCase().includes(qLower) ||
          deal.location?.toLowerCase().includes(qLower) ||
          deal.distance?.toLowerCase().includes(qLower) ||
          deal.businessId?.name?.toLowerCase().includes(qLower) ||
          deal.businessId?.address?.city?.toLowerCase().includes(qLower) ||
          deal.businessId?.address?.street?.toLowerCase().includes(qLower);

        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "discount_desc") {
          return (b.discountPercentage || 0) - (a.discountPercentage || 0);
        }
        if (sortBy === "price_asc") {
          return (a.rawPrice || 0) - (b.rawPrice || 0);
        }
        if (sortBy === "price_desc") {
          return (b.rawPrice || 0) - (a.rawPrice || 0);
        }
        if (sortBy === "rating_desc") {
          return (b.rating || 0) - (a.rating || 0);
        }
        return 0;
      });
  }, [dealsList, activeSlug, searchQuery, sortBy, currentCategory]);

  const [profileModalBusinessId, setProfileModalBusinessId] = useState(null);

  const handleOpenDeal = (deal) => {
    if (!deal) return;
    const dealId = deal._id || deal.id;

    // Immediately format and display the modal
    const formatted = {
      ...deal,
      id: dealId,
      _id: dealId,
      title: deal.title,
      description: deal.description || "",
      business:
        typeof deal.business === "string"
          ? deal.business
          : deal.businessId?.name || deal.businessName || "Local merchant",
      businessId: deal.businessId,
      price:
        typeof deal.price === "string"
          ? deal.price
          : `Rs. ${Number(deal.discountedPrice || 0).toLocaleString()}`,
      rawPrice: deal.rawPrice ?? deal.discountedPrice,
      oldPrice:
        deal.oldPrice ||
        (deal.originalPrice
          ? `Rs. ${Number(deal.originalPrice).toLocaleString()}`
          : ""),
      rawOldPrice: deal.rawOldPrice ?? deal.originalPrice,
      discount:
        deal.discount ||
        (deal.discountPercentage ? `${deal.discountPercentage}% off` : ""),
      image:
        deal.image ||
        deal.imageUrl ||
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
      location:
        deal.location ||
        deal.businessId?.address?.city ||
        deal.businessId?.address?.street ||
        "Sri Lanka",
      availableQuantity: deal.availableQuantity,
      vouchersLeft: deal.availableQuantity,
    };
    setSelectedDeal(formatted);
    setModalOpen(true);

    // Fetch complete deal details from API in parallel to enrich terms and reviews
    if (dealId) {
      discoveryApi
        .getDealDetails(dealId)
        .then((res) => {
          if (res.deal) {
            const raw = res.deal;
            setSelectedDeal((prev) => ({
              ...prev,
              ...raw,
              id: raw._id || raw.id,
              _id: raw._id || raw.id,
              business:
                raw.businessId?.name ||
                raw.businessName ||
                prev?.business ||
                "Local merchant",
              businessId: raw.businessId,
              price: `Rs. ${Number(raw.discountedPrice || 0).toLocaleString()}`,
              rawPrice: raw.discountedPrice,
              oldPrice: raw.originalPrice
                ? `Rs. ${Number(raw.originalPrice).toLocaleString()}`
                : "",
              rawOldPrice: raw.originalPrice,
              discount: `${raw.discountPercentage || 0}% off`,
              image: raw.imageUrl || raw.image || prev?.image,
              availableQuantity: raw.availableQuantity,
              vouchersLeft: raw.availableQuantity,
              terms: raw.terms,
              description: raw.description,
            }));
          }
        })
        .catch(() => {});
    }
  };

  const IconComponent = currentCategory ? currentCategory.icon : LayoutGrid;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F4EE]">
      <Navbar />

      <main className="flex-1 pt-16 pb-28 lg:pb-20">
        {/* Category Header */}
        <section className="border-b border-[#E6E0D6] bg-[#FDFBF7] px-6 py-10">
          <div className="mx-auto max-w-[1200px]">
            {/* Breadcrumb */}
            <div className="mb-5 flex items-center gap-2 text-[12px] text-[#7B7266]">
              <Link to="/" className="hover:text-[#1F1B16]">
                Home
              </Link>
              <span>/</span>
              <Link to="/categories" className="hover:text-[#1F1B16]">
                Categories
              </Link>
              <span>/</span>
              <span className="font-medium text-[#1F1B16]">
                {currentCategory ? currentCategory.name : "All categories"}
              </span>
            </div>

            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] text-[#1F1B16]">
                  <IconComponent size={22} strokeWidth={1.5} />
                </div>

                <div>
                  <p className="text-[12px] font-medium text-[#7B7266]">
                    Neighborhood directory
                  </p>
                  <h1 className="mt-0.5 text-[28px] sm:text-[32px] font-medium tracking-[-0.025em] text-[#1F1B16]">
                    {viewMode === "map"
                      ? "Interactive Street Map"
                      : currentCategory
                      ? currentCategory.name
                      : "All flash deals"}
                  </h1>
                  <p className="mt-1.5 max-w-[56ch] text-[14px] text-[#5E554A]">
                    {viewMode === "map"
                      ? "Explore all verified merchant shops flagged across Colombo with active, unexpired counter passes."
                      : currentCategory
                      ? currentCategory.description
                      : "Browse active unexpired counter passes across cafes, retail shops, and local services."}
                  </p>
                </div>
              </div>

              {/* View Switcher: Grid vs Full Street Map */}
              <div className="flex items-center gap-1 self-start rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] p-1 md:self-center">
                <button
                  type="button"
                  onClick={() => handleSwitchView("grid")}
                  className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#1F1B16] text-[#FDFBF7]"
                      : "text-[#5E554A] hover:text-[#1F1B16]"
                  }`}
                >
                  <LayoutGrid size={14} strokeWidth={1.5} />
                  <span>Grid view</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchView("map")}
                  className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors cursor-pointer ${
                    viewMode === "map"
                      ? "bg-[#D94832] text-white shadow-xs"
                      : "text-[#5E554A] hover:text-[#1F1B16]"
                  }`}
                >
                  <MapIcon size={14} strokeWidth={1.5} />
                  <span>Street map</span>
                </button>
              </div>
            </div>

            {/* Category Filter Row */}
            <div className="mt-7 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-6 px-6 sm:mx-0 sm:px-0">
              <button
                onClick={() => {
                  setActiveSlug("all");
                  navigate(viewMode === "map" ? "/categories?view=map" : "/categories");
                }}
                className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeSlug === "all"
                    ? "bg-[#1F1B16] text-[#FDFBF7]"
                    : "border border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A] hover:text-[#1F1B16]"
                }`}
              >
                <LayoutGrid size={14} strokeWidth={1.5} />
                <span>All deals</span>
              </button>

              {categories.map((cat) => {
                const CatIcon = cat.icon;
                const isActive = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveSlug(cat.slug);
                      const target = `/category/${cat.slug}${viewMode === "map" ? "?view=map" : ""}`;
                      navigate(target);
                    }}
                    className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#D94832] text-white"
                        : "border border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A] hover:text-[#1F1B16]"
                    }`}
                  >
                    <CatIcon size={14} strokeWidth={1.5} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Deals Listing & Filter Section */}
        <section className="mx-auto max-w-[1200px] px-6 py-8">
          {viewMode === "map" ? (
            /* Full Street Map View */
            <div className="w-full">
              <MapDiscoveryView onSelectDeal={handleOpenDeal} fullView={true} />
            </div>
          ) : (
            <>
              {/* Controls Bar */}
              <div className="mb-7 flex flex-col items-stretch justify-between gap-3 rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-3.5 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    strokeWidth={1.5}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B7266]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder={`Filter ${
                      currentCategory ? currentCategory.name.toLowerCase() : "deals"
                    } by store or item...`}
                    className="h-10 sm:h-9 w-full rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] pl-9 pr-14 text-[16px] sm:text-[13px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:bg-white focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#7B7266] hover:text-[#1F1B16] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleToggleNearby}
                    disabled={locating}
                    className={`flex h-10 sm:h-9 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-medium transition-colors cursor-pointer ${
                      nearbyMode
                        ? "bg-[#D94832] text-white"
                        : "border border-[#E6E0D6] bg-[#F7F4EE] text-[#1F1B16] hover:bg-[#EFE9DF]"
                    }`}
                  >
                    <Navigation
                      size={13}
                      strokeWidth={1.5}
                      className={locating ? "animate-spin" : ""}
                    />
                    <span>
                      {locating
                        ? "Locating..."
                        : nearbyMode
                        ? "Nearby filter on"
                        : "Near my location"}
                    </span>
                  </button>

                  {nearbyMode && (
                    <select
                      value={nearbyRadius}
                      onChange={(e) => setNearbyRadius(Number(e.target.value))}
                      className="h-10 sm:h-9 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-3 text-[12px] font-medium text-[#1F1B16] focus:border-[#D94832] focus:outline-none cursor-pointer"
                    >
                      <option value={5}>Within 5 km</option>
                      <option value={15}>Within 15 km</option>
                      <option value={30}>Within 30 km</option>
                      <option value={50}>Within 50 km</option>
                    </select>
                  )}

                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <span className="text-[12px] text-[#7B7266]">Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-10 sm:h-9 flex-1 sm:flex-initial rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-3 text-[12px] font-medium text-[#1F1B16] focus:border-[#D94832] focus:outline-none cursor-pointer"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="discount_desc">Largest discount</option>
                      <option value="price_asc">Price: low to high</option>
                      <option value="price_desc">Price: high to low</option>
                      <option value="rating_desc">Customer rating</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fallback notice */}
              {nearbyMode && nearbyFallback && (
                <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-[#B45309]/30 bg-[#B45309]/5 p-4 text-[#1F1B16] sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#B45309]/25 bg-[#FDFBF7] text-[#B45309]">
                      <MapPin size={16} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-medium text-[#1F1B16]">
                        No active deals within {nearbyFallback.radius} km
                      </h4>
                      <p className="mt-0.5 text-[12px] text-[#5E554A]">
                        Showing all active offers sorted by distance from your
                        current coordinates.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNearbyRadius(50)}
                    className="shrink-0 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-3 py-1.5 text-[12px] font-medium text-[#1F1B16] hover:bg-[#EFE9DF] cursor-pointer"
                  >
                    Expand to 50 km
                  </button>
                </div>
              )}

              {loading ? (
                <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
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
                  ))}
                </div>
              ) : filteredDeals.length > 0 ? (
                <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onOpen={handleOpenDeal} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A]">
                    <Search size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[16px] font-medium text-[#1F1B16]">
                    No unexpired deals found
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-[13px] text-[#7B7266]">
                    {nearbyMode
                      ? `No active unexpired deals within ${nearbyRadius} km of your location. Try expanding the distance filter.`
                      : `No active unexpired deals matched "${searchQuery}" in this category.`}
                  </p>
                  <div className="mt-5 flex justify-center gap-2.5">
                    {nearbyMode && (
                      <button
                        onClick={() => setNearbyMode(false)}
                        className="rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-3.5 py-2 text-[12px] font-medium text-[#1F1B16] hover:bg-[#EFE9DF]"
                      >
                        Turn off distance filter
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchInput("")}
                        className="rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-3.5 py-2 text-[12px] font-medium text-[#1F1B16] hover:bg-[#EFE9DF]"
                      >
                        Clear search
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveSlug("all");
                        navigate("/categories");
                      }}
                      className="rounded-lg bg-[#D94832] px-3.5 py-2 text-[12px] font-medium text-white hover:bg-[#C23B26]"
                    >
                      All categories
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />

      <DealDetailModal
        deal={selectedDeal}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          openedDealIdRef.current = null;
          const nextParams = new URLSearchParams(location.search);
          nextParams.delete("dealId");
          nextParams.delete("deal");
          nextParams.delete("id");
          const nextQuery = nextParams.toString();
          navigate(nextQuery ? `?${nextQuery}` : location.pathname, {
            replace: true,
          });
        }}
        onOpenSellerProfile={(bizId) => {
          setModalOpen(false);
          setProfileModalBusinessId(bizId);
        }}
      />

      <SellerProfileModal
        businessId={profileModalBusinessId}
        isOpen={Boolean(profileModalBusinessId)}
        onClose={() => setProfileModalBusinessId(null)}
        onSelectDeal={handleOpenDeal}
      />
    </div>
  );
}

export default CategoryPage;
