import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeCategory, getCategorySlug } from "../data/categories";
import DealCard from "./DealCard";
import DealDetailModal from "./DealDetailModal";
import { dealApi } from "../services/api";
import { Flame, Sparkles, Filter } from "lucide-react";

function FeaturedDeals() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [dealsList, setDealsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  // Fetch deals directly from database
  useEffect(() => {
    let isMounted = true;
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const response = await dealApi.getDeals();
        const liveDeals = response.deals || response.data || [];

        if (isMounted) {
          if (Array.isArray(liveDeals)) {
            const formattedDeals = liveDeals.map((d, index) => {
              const displayCat = normalizeCategory(d.category);
              const catSlug = getCategorySlug(d.category);
              const locationCity =
                d.businessId?.address?.city ||
                (typeof d.businessId?.address === "string" ? d.businessId?.address : "Colombo, Sri Lanka");

              return {
                id: d._id || index + 1,
                title: d.title,
                business: d.businessId?.name || d.businessName || "Verified Merchant",
                category: displayCat,
                categorySlug: catSlug,
                price: `Rs. ${d.discountedPrice?.toLocaleString() || d.price || "0"}`,
                rawPrice: d.discountedPrice,
                oldPrice: `Rs. ${d.originalPrice?.toLocaleString() || d.oldPrice || "0"}`,
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
                highlights: ["Instant digital voucher", "Verified local merchant"],
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
        if (isMounted) setDealsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ["All", "Food", "Fashion", "Electronics", "Home", "Health", "Sports", "Services", "Games"];

  const filteredDeals =
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

  const handleOpenDeal = (deal) => {
    setSelectedDeal(deal);
    setModalOpen(true);
  };

  return (
    <section id="deals" className="bg-[#F7F5F2] py-24">
      <div ref={sectionRef} className="reveal mx-auto max-w-[1240px] px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-gray-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#E8503A]">
                Live Now
              </span>
            </div>

            <h2 className="mt-3 text-[32px] sm:text-[38px] font-black tracking-[-0.03em] text-[#1A1A1A] leading-tight">
              Deals near you
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xl">
              Limited-time discounts from top-rated restaurants, boutiques, and tech shops.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 hidden sm:inline">
              Showing {filteredDeals.length} active deals
            </span>
            <button
              onClick={() => navigate("/deals")}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:border-[#E8503A] hover:text-[#E8503A] transition-colors cursor-pointer"
            >
              <span>View All Deals</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-[#172026] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Deals Cards Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col h-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="h-44 w-full rounded-xl bg-gray-200" />
                <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
                <div className="mt-2 h-5 w-3/4 rounded bg-gray-200" />
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="h-5 w-1/4 rounded bg-gray-200" />
                  <div className="h-8 w-1/3 rounded-xl bg-gray-200" />
                </div>
              </div>
            ))
          ) : filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onOpen={handleOpenDeal} />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A] mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900">No active deals found</h3>
              <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                {selectedCategory === "All"
                  ? "There are currently no active deals in the database. Published deals from local sellers will appear here instantly!"
                  : `No deals currently found under "${selectedCategory}". Check back soon or select another category.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deal Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}

export default FeaturedDeals;