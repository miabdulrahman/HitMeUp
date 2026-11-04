import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeCategory, getCategorySlug } from "../data/categories";
import DealCard from "./DealCard";
import DealDetailModal from "./DealDetailModal";
import MapDiscoveryView from "./MapDiscoveryView";
import { dealApi } from "../services/api";
import { isDealExpired } from "../utils/dealTimer";
import {
  Tag,
  ArrowRight,
  LayoutGrid,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

// Helper to generate dynamic endDates for sample passes
const getFutureDate = (secondsFromNow) =>
  new Date(Date.now() + secondsFromNow * 1000).toISOString();

const SHOWCASE_DEALS = [
  {
    id: "sample-1",
    title: "Afternoon espresso & sourdough tartlet for two",
    business: "Commons Roastery & Bakehouse",
    category: "Food",
    categorySlug: "food",
    price: "Rs. 1,950",
    rawPrice: 1950,
    oldPrice: "Rs. 3,000",
    rawOldPrice: 3000,
    discount: "35% off",
    discountPercentage: 35,
    image: "/hero-cover.jpg",
    endDate: getFutureDate(8078), // ~02h 14m
    time: "02h 14m left",
    distance: "Bambalapitiya, Colombo 04",
    location: "Bambalapitiya, Colombo 04",
    rating: 4.9,
    reviewsCount: 42,
    vouchersLeft: 6,
    status: "active",
    description:
      "Two single-origin flat whites or iced americanos paired with our freshly baked afternoon sourdough fruit tartlet platter.",
    highlights: ["Digital QR voucher pass", "Verified neighborhood store"],
    terms: "Valid between 2:30 PM and 6:00 PM. Present QR at counter.",
  },
  {
    id: "sample-2",
    title: "Artisan sourdough loaf & two iced cinnamon lattes",
    business: "Galle Road Bakehouse",
    category: "Food",
    categorySlug: "food",
    price: "Rs. 1,260",
    rawPrice: 1260,
    oldPrice: "Rs. 1,800",
    rawOldPrice: 1800,
    discount: "30% off",
    discountPercentage: 30,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    endDate: getFutureDate(5620), // ~01h 33m
    time: "01h 33m left",
    distance: "Wellawatte, Colombo 06",
    location: "Wellawatte, Colombo 06",
    rating: 4.8,
    reviewsCount: 29,
    vouchersLeft: 11,
    status: "active",
    description:
      "Freshly baked country sourdough loaf from our afternoon oven batch plus two house-spiced iced cinnamon lattes.",
    highlights: ["Digital QR voucher pass", "Walk-in counter pickup"],
    terms: "Valid until 7:30 PM today.",
  },
  {
    id: "sample-3",
    title: "45-minute weekday head, neck & shoulder therapy",
    business: "Ayur Botanica Lounge",
    category: "Health",
    categorySlug: "health",
    price: "Rs. 2,700",
    rawPrice: 2700,
    oldPrice: "Rs. 4,500",
    rawOldPrice: 4500,
    discount: "40% off",
    discountPercentage: 40,
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
    endDate: getFutureDate(11415), // ~03h 10m
    time: "03h 10m left",
    distance: "Kollupitiya, Colombo 03",
    location: "Kollupitiya, Colombo 03",
    rating: 4.9,
    reviewsCount: 38,
    vouchersLeft: 4,
    status: "active",
    description:
      "Relaxing warm herbal oil therapy for neck, shoulder, and upper back tension during quiet mid-afternoon studio hours.",
    highlights: ["Digital QR voucher pass", "Verified wellness studio"],
    terms: "Walk-in slot held for 2 hours after claiming pass.",
  },
  {
    id: "sample-4",
    title: "Handloom linen overshirt & tropical cotton tee bundle",
    business: "Ceylon Loom & Stitch",
    category: "Fashion",
    categorySlug: "fashion",
    price: "Rs. 4,200",
    rawPrice: 4200,
    oldPrice: "Rs. 6,000",
    rawOldPrice: 6000,
    discount: "30% off",
    discountPercentage: 30,
    image:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
    endDate: getFutureDate(19200), // ~05h 20m
    time: "05h 20m left",
    distance: "Havelock Town, Colombo 05",
    location: "Havelock Town, Colombo 05",
    rating: 4.7,
    reviewsCount: 19,
    vouchersLeft: 8,
    status: "active",
    description:
      "Breathable Sri Lankan handloom linen overshirt paired with a combed cotton everyday tee in stone, olive, or navy.",
    highlights: ["In-store fitting included", "Digital QR voucher pass"],
    terms: "Redeemable in store before 8:00 PM.",
  },
  {
    id: "sample-5",
    title: "65W GaN fast charger & braided USB-C cable kit",
    business: "Liberty Tech Counter",
    category: "Electronics",
    categorySlug: "electronics",
    price: "Rs. 4,900",
    rawPrice: 4900,
    oldPrice: "Rs. 7,000",
    rawOldPrice: 7000,
    discount: "30% off",
    discountPercentage: 30,
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80",
    endDate: getFutureDate(21600), // ~06h 00m
    time: "06h 00m left",
    distance: "Kollupitiya, Colombo 03",
    location: "Kollupitiya, Colombo 03",
    rating: 4.8,
    reviewsCount: 51,
    vouchersLeft: 9,
    status: "active",
    description:
      "Dual-port 65W GaN laptop and phone wall adapter bundled with a 100W nylon-braided Type-C cable and 6-month counter warranty.",
    highlights: ["6-month store warranty", "Tested at counter"],
    terms: "One pass per shopper.",
  },
  {
    id: "sample-6",
    title: "Express interior cabin vacuum & exterior foam wash",
    business: "Park Street Auto Detailers",
    category: "Services",
    categorySlug: "services",
    price: "Rs. 2,200",
    rawPrice: 2200,
    oldPrice: "Rs. 3,500",
    rawOldPrice: 3500,
    discount: "37% off",
    discountPercentage: 37,
    image:
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=900&q=80",
    endDate: getFutureDate(11700), // ~03h 15m
    time: "03h 15m left",
    distance: "Union Place, Colombo 02",
    location: "Union Place, Colombo 02",
    rating: 4.8,
    reviewsCount: 24,
    vouchersLeft: 5,
    status: "active",
    description:
      "35-minute snow-foam exterior wash, microfiber hand dry, tire dressing, and full interior cabin vacuum during off-peak bay hours.",
    highlights: ["No booking fee", "QR counter redemption"],
    terms: "Valid for sedans, hatchbacks, and compact SUVs.",
  },
  {
    id: "sample-7",
    title: "Off-peak 90-minute indoor badminton court + shuttlecock",
    business: "ShuttleHaus Arena",
    category: "Sports",
    categorySlug: "sports",
    price: "Rs. 1,600",
    rawPrice: 1600,
    oldPrice: "Rs. 2,500",
    rawOldPrice: 2500,
    discount: "36% off",
    discountPercentage: 36,
    image:
      "https://images.unsplash.com/photo-1626224583764-84786c71971e?auto=format&fit=crop&w=900&q=80",
    endDate: getFutureDate(17100), // ~04h 45m
    time: "04h 45m left",
    distance: "Nugegoda",
    location: "Nugegoda",
    rating: 4.9,
    reviewsCount: 33,
    vouchersLeft: 3,
    status: "active",
    description:
      "90-minute BWF-grade synthetic mat court booking for up to 4 players, including one feather shuttlecock tube.",
    highlights: ["Up to 4 players", "Instant counter check-in"],
    terms: "Valid until 5:30 PM.",
  },
  {
    id: "sample-8",
    title: "2-hour PS5 & racing simulator lounge pass for two",
    business: "Checkpoint Esports Cafe",
    category: "Games",
    categorySlug: "games",
    price: "Rs. 1,500",
    rawPrice: 1500,
    oldPrice: "Rs. 2,400",
    rawOldPrice: 2400,
    discount: "38% off",
    discountPercentage: 38,
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    endDate: getFutureDate(18000), // ~05h 00m
    time: "05h 00m left",
    distance: "Mount Lavinia",
    location: "Mount Lavinia",
    rating: 4.8,
    reviewsCount: 27,
    vouchersLeft: 7,
    status: "active",
    description:
      "Two-player couch co-op or sim-racing session with two complimentary chilled ginger beers.",
    highlights: ["Includes 2 drinks", "Digital QR voucher pass"],
    terms: "Present voucher at front desk.",
  },
];

function FeaturedDeals() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [dealsList, setDealsList] = useState([]);
  const [isUsingShowcase, setIsUsingShowcase] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("featured"); // featured | discount | price-asc | stock
  const [displayMode, setDisplayMode] = useState("grid"); // grid | map
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
        const response = await dealApi.getDeals();
        const liveDeals = response.deals || response.data || [];

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
                  distance: locationCity,
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

            if (formattedDeals.length > 0) {
              setDealsList(formattedDeals);
              setIsUsingShowcase(false);
            } else {
              setDealsList(SHOWCASE_DEALS.filter((d) => !isDealExpired(d)));
              setIsUsingShowcase(true);
            }
          } else {
            setDealsList(SHOWCASE_DEALS.filter((d) => !isDealExpired(d)));
            setIsUsingShowcase(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch database deals:", err.message);
        if (isMounted) {
          setDealsList(SHOWCASE_DEALS.filter((d) => !isDealExpired(d)));
          setIsUsingShowcase(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeals();

    return () => {
      isMounted = false;
    };
  }, []);

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
            d.category?.toLowerCase().includes(query)
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
            <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#7B7266]">
              <span className="h-2 w-2 rounded-full bg-[#166534]" />
              <span>
                {isUsingShowcase
                  ? "Neighborhood pass feed (sample preview)"
                  : "Live unexpired counter passes"}
              </span>
            </div>

            <h2 className="mt-1.5 text-[28px] sm:text-[32px] font-medium tracking-[-0.025em] text-[#1F1B16]">
              Deals near you
            </h2>
            <p className="mt-1.5 max-w-[54ch] text-[15px] text-[#5E554A]">
              Filter active markdowns by category, sort by discount, or open the
              full street map to explore pinned stores across Colombo.
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
            {/* Interactive Filter & Sort Toolbar */}
            <div className="mt-7 flex flex-col justify-between gap-3 rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-3 lg:flex-row lg:items-center">
              {/* Category Pills with Live Counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
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
                    className="h-8 w-full rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] pl-8 pr-7 text-[12px] text-[#1F1B16] placeholder-[#7B7266] focus:border-[#1F1B16] focus:bg-white focus:outline-none"
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

                <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-2.5">
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
                    <option value="featured">Sort: Featured</option>
                    <option value="discount">Highest discount</option>
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
