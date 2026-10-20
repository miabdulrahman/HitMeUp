import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  MapPin,
  Heart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DealDetailModal from "../components/DealDetailModal";
import { categories, normalizeCategory, getCategorySlug } from "../data/categories";
import { deals as mockDeals } from "../data/deals";
import { dealApi } from "../services/api";

function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Selected Category (default to slug or "all")
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [dealsList, setDealsList] = useState(mockDeals);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state when URL param slug changes
  useEffect(() => {
    setActiveSlug(slug || "all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Fetch backend deals for this category if available
  useEffect(() => {
    let isMounted = true;
    const fetchCategoryDeals = async () => {
      setLoading(true);
      try {
        const catName = currentCategory ? currentCategory.name : undefined;
        const response = await dealApi.getDeals(catName ? { category: catName } : {});
        const liveDeals = response.deals || response.data || [];

        if (isMounted && Array.isArray(liveDeals) && liveDeals.length > 0) {
          const formattedLiveDeals = liveDeals.map((d) => {
            const displayCat = normalizeCategory(d.category);
            const catSlug = getCategorySlug(d.category);
            const locationCity =
              d.businessId?.address?.city ||
              (typeof d.businessId?.address === "string" ? d.businessId?.address : "Colombo, Sri Lanka");

            return {
              id: d._id,
              title: d.title,
              business: d.businessId?.name || d.businessName || "Verified Merchant",
              category: displayCat,
              categorySlug: catSlug,
              price: `Rs. ${d.discountedPrice?.toLocaleString() || "0"}`,
              rawPrice: d.discountedPrice,
              oldPrice: `Rs. ${d.originalPrice?.toLocaleString() || "0"}`,
              rawOldPrice: d.originalPrice,
              discount: `${d.discountPercentage || 0}% OFF`,
              discountPercentage: d.discountPercentage || 0,
              image:
                d.imageUrl ||
                d.image ||
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
              time: "Limited time",
              distance: locationCity,
              location: locationCity,
              rating: 4.8,
              reviewsCount: 35,
              vouchersLeft: d.availableQuantity || 10,
              description: d.description,
              highlights: [
                "Instant digital voucher",
                "Valid for direct redemption",
                "Verified local merchant",
              ],
              terms: d.terms || "Present digital voucher code upon arrival.",
            };
          });

          // Merge live deals with mock deals without duplicating
          setDealsList((prev) => {
            const combined = [...formattedLiveDeals, ...mockDeals];
            const seen = new Set();
            return combined.filter((item) => {
              const duplicate = seen.has(item.id);
              seen.add(item.id);
              return !duplicate;
            });
          });
        }
      } catch (err) {
        console.info("Using catalog deals for category:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategoryDeals();

    return () => {
      isMounted = false;
    };
  }, [currentCategory]);

  // Filter and sort items
  const filteredDeals = useMemo(() => {
    return dealsList
      .filter((deal) => {
        // Category match
        const dealSlug = deal.categorySlug || getCategorySlug(deal.category);
        const matchesCategory =
          activeSlug === "all" ||
          dealSlug === activeSlug.toLowerCase() ||
          deal.category?.toLowerCase() === activeSlug.toLowerCase() ||
          (currentCategory &&
            (dealSlug === currentCategory.slug.toLowerCase() ||
             deal.category?.toLowerCase() === currentCategory.name.toLowerCase() ||
             getCategorySlug(deal.category) === currentCategory.slug.toLowerCase()));

        // Search query match
        const matchesQuery =
          !searchQuery.trim() ||
          deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.description?.toLowerCase().includes(searchQuery.toLowerCase());

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
        return 0; // Default recommended
      });
  }, [dealsList, activeSlug, searchQuery, sortBy, currentCategory]);

  const handleOpenDeal = (deal) => {
    setSelectedDeal(deal);
    setModalOpen(true);
  };

  const IconComponent = currentCategory ? currentCategory.icon : LayoutGrid;

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-20">
        {/* Category Hero / Header Banner */}
        <section className="border-b border-gray-200/70 bg-white py-12 px-6">
          <div className="mx-auto max-w-[1240px]">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
              <Link to="/" className="hover:text-[#E8503A] transition">
                Home
              </Link>
              <span>/</span>
              <Link to="/categories" className="hover:text-[#E8503A] transition">
                Categories
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">
                {currentCategory ? currentCategory.name : "All Categories"}
              </span>
            </div>

            {/* Banner Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                  style={{
                    backgroundColor: currentCategory ? currentCategory.color : "#172026",
                  }}
                >
                  <IconComponent size={32} strokeWidth={2} />
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black uppercase tracking-widest text-[#E8503A]">
                      Flash Marketplace
                    </span>
                    {currentCategory?.badge && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-800 border border-amber-200">
                        {currentCategory.badge}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-[#1A1A1A]">
                    {currentCategory
                      ? `${currentCategory.name} Deals & Offers`
                      : "Explore All Flash Deals"}
                  </h1>

                  <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                    {currentCategory
                      ? currentCategory.description
                      : "Browse limited-time vouchers and discounts across top-rated local food, fashion, tech, home, and wellness providers."}
                  </p>
                </div>
              </div>

              {/* Quick Metrics Card */}
              <div className="flex items-center gap-4 bg-[#F7F5F2] border border-gray-200/70 rounded-2xl p-4 shrink-0">
                <div className="text-center px-2">
                  <span className="block text-2xl font-black text-gray-900">
                    {filteredDeals.length}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    Active Deals
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-gray-300" />
                <div className="text-center px-2">
                  <span className="block text-2xl font-black text-emerald-600">
                    Up to 50%
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    Max Discount
                  </span>
                </div>
              </div>
            </div>

            {/* Category Navigation Pills (Quick Switcher) */}
            <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setActiveSlug("all");
                  navigate("/categories");
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                  activeSlug === "all"
                    ? "bg-[#172026] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <LayoutGrid size={15} />
                <span>All Deals</span>
              </button>

              {categories.map((cat) => {
                const CatIcon = cat.icon;
                const isActive = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveSlug(cat.slug);
                      navigate(`/category/${cat.slug}`);
                    }}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-[#E8503A] text-white shadow-md shadow-[#E8503A]/25"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <CatIcon size={15} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Deals Listing & Filter Section */}
        <section className="mx-auto max-w-[1240px] px-6 py-8">
          {/* Controls Bar: Search + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-8">
            {/* Search within category */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search within ${currentCategory ? currentCategory.name : "deals"}...`}
                className="w-full rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 border border-transparent focus:border-[#E8503A] focus:bg-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#E8503A] transition"
              >
                <option value="recommended">Featured & Recommended</option>
                <option value="discount_desc">Highest Discount (%)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Deals Grid */}
          {filteredDeals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
              {filteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => handleOpenDeal(deal)}
                  className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-gray-300 cursor-pointer"
                >
                  {/* Image Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Discount Badge */}
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E8503A] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                      <Sparkles size={11} />
                      {deal.discount}
                    </div>

                    {/* Category Tag */}
                    <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md">
                      {deal.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      {/* Merchant name */}
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#E8503A]">
                        {deal.business}
                      </p>

                      {/* Title */}
                      <h3 className="mt-1 text-base font-bold leading-snug text-gray-900 group-hover:text-[#E8503A] transition-colors line-clamp-2">
                        {deal.title}
                      </h3>

                      {/* Location & Time */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                          <MapPin size={12} className="text-[#E8503A]" />
                          {deal.distance}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF0ED] px-2 py-0.5 text-[11px] font-bold text-[#E8503A]">
                          <Clock size={12} />
                          {deal.time}
                        </span>
                      </div>
                    </div>

                    {/* Price and Action Row */}
                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-gray-900">
                            {deal.price}
                          </span>
                          {deal.oldPrice && (
                            <span className="text-xs font-semibold text-gray-400 line-through">
                              {deal.oldPrice}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-emerald-600">
                          {deal.vouchersLeft ? `${deal.vouchersLeft} left` : "Flash deal active"}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeal(deal);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#172026] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 group-hover:bg-[#E8503A] active:scale-95"
                      >
                        <span>View Item</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 px-6 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A] mb-4">
                <Search size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                No matching flash deals found
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                We couldn't find any deals matching &quot;{searchQuery}&quot; in this category. Try clearing your search or browsing another category.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveSlug("all");
                    navigate("/categories");
                  }}
                  className="rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#D4402C] transition"
                >
                  View All Categories
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Item / Deal Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export default CategoryPage;
