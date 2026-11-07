import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, ArrowRight, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { categories, normalizeCategory, getCategorySlug } from "../data/categories";
import { dealApi } from "../services/api";

function SearchModal({ isOpen, onClose, onSelectDeal }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedCategory("all");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchLiveDeals = async () => {
      setLoading(true);
      try {
        const response = await dealApi.getDeals({ limit: 100 });
        const liveDeals = response.deals || response.data || [];
        if (isMounted) {
          if (Array.isArray(liveDeals)) {
            const formatted = liveDeals.map((d, index) => {
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
                category: displayCat,
                categorySlug: catSlug,
                price: `Rs. ${d.discountedPrice?.toLocaleString() || d.price || "0"}`,
                rawPrice: d.discountedPrice,
                oldPrice: `Rs. ${d.originalPrice?.toLocaleString() || d.oldPrice || "0"}`,
                rawOldPrice: d.originalPrice,
                discount: `${d.discountPercentage || 0}% off`,
                discountPercentage: d.discountPercentage || 0,
                image:
                  d.imageUrl ||
                  d.image ||
                  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
                distance: locationCity,
                time: "Active today",
                description: d.description,
              };
            });
            setDeals(formatted);
          } else {
            setDeals([]);
          }
        }
      } catch {
        if (isMounted) setDeals([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveDeals();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredDeals = deals.filter((deal) => {
    const qLower = query.trim().toLowerCase();
    const matchesQuery =
      !qLower ||
      deal.title?.toLowerCase().includes(qLower) ||
      deal.business?.toLowerCase().includes(qLower) ||
      deal.category?.toLowerCase().includes(qLower) ||
      deal.description?.toLowerCase().includes(qLower) ||
      deal.distance?.toLowerCase().includes(qLower);

    const matchesCategory =
      selectedCategory === "all" ||
      deal.categorySlug === selectedCategory ||
      deal.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesQuery && matchesCategory;
  });

  const popularKeywords = [
    "Burger",
    "Pizza",
    "Coffee",
    "Pastry",
    "Salon",
    "Gym",
    "Electronics",
  ];

  const handleCategoryClick = (catSlug) => {
    onClose();
    navigate(`/category/${catSlug}`);
  };

  const handleDealClick = (deal) => {
    onClose();
    if (onSelectDeal) {
      onSelectDeal(deal);
    } else {
      navigate(`/deals?dealId=${deal.id || deal._id}`);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/deals?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div
      className="ios-popup-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1F1B16]/50 p-4 backdrop-blur-xs sm:p-6 md:p-10"
      onClick={onClose}
    >
      <div
        className="ios-popup-card relative my-6 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] shadow-[0_12px_32px_rgba(31,27,22,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 border-b border-[#E6E0D6] px-5 py-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
            <Search size={18} strokeWidth={1.5} className="shrink-0 text-[#7B7266]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search deals, cafes, electronics, services..."
              className="w-full bg-transparent text-[15px] font-normal text-[#1F1B16] placeholder:text-[#7B7266] focus:outline-none"
            />
          </form>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-[#7B7266] hover:text-[#1F1B16]"
              title="Clear search"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-[5px] border border-[#E6E0D6] bg-[#F7F4EE] px-2 py-0.5 font-mono text-[11px] text-[#7B7266] transition-colors hover:text-[#1F1B16]"
          >
            Esc
          </button>
        </div>

        {/* Category Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E6E0D6] bg-[#F7F4EE] px-5 py-2.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`whitespace-nowrap rounded-md px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#1F1B16] text-[#FDFBF7]"
                : "border border-[#E6E0D6] bg-[#FDFBF7] text-[#5E554A] hover:text-[#1F1B16]"
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`whitespace-nowrap rounded-md px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-[#D94832] text-white"
                  : "border border-[#E6E0D6] bg-[#FDFBF7] text-[#5E554A] hover:text-[#1F1B16]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Quick suggestions when query is empty */}
        {!query && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E6E0D6] px-5 py-2.5 text-[12px]">
            <span className="text-[#7B7266]">Suggestions:</span>
            {popularKeywords.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="rounded-md border border-[#E6E0D6] bg-[#F7F4EE] px-2 py-0.5 text-[#5E554A] transition-colors hover:border-[#1F1B16]/30 hover:text-[#1F1B16]"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-[55vh] space-y-2.5 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 size={20} strokeWidth={1.5} className="mb-2 animate-spin text-[#D94832]" />
              <p className="text-[13px] text-[#7B7266]">Checking active passes...</p>
            </div>
          ) : filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => handleDealClick(deal)}
                className="group flex items-center justify-between gap-4 rounded-xl border border-[#E6E0D6] bg-white p-3.5 transition-colors duration-150 hover:border-[#1F1B16]/30 hover:bg-[#F7F4EE]/50 cursor-pointer"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E6E0D6] bg-[#EFE9DF]">
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] text-[#7B7266]">
                      <span className="font-medium text-[#5E554A]">
                        {deal.business}
                      </span>
                      <span>·</span>
                      <span>{deal.category}</span>
                    </div>

                    <h4 className="line-clamp-1 text-[14px] font-medium text-[#1F1B16] group-hover:text-[#D94832]">
                      {deal.title}
                    </h4>

                    <div className="mt-1 flex items-center gap-3 text-[12px] text-[#7B7266]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} strokeWidth={1.5} />
                        {deal.distance}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#D94832] tabular-nums">
                        <Clock size={11} strokeWidth={1.5} />
                        {deal.discount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end pl-2 font-mono tabular-nums">
                  <span className="text-[15px] font-medium text-[#1F1B16]">
                    {deal.price}
                  </span>
                  {deal.oldPrice && (
                    <span className="text-[11px] text-[#7B7266] line-through">
                      {deal.oldPrice}
                    </span>
                  )}
                  <div className="mt-1 inline-flex items-center gap-1 font-sans text-[11px] font-medium text-[#5E554A] group-hover:text-[#1F1B16]">
                    <span>View pass</span>
                    <ArrowRight size={11} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-[15px] font-medium text-[#1F1B16]">
                No matching deals found
              </p>
              <p className="mt-1 text-[13px] text-[#7B7266]">
                Try another keyword or browse by category
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="rounded-lg border border-[#E6E0D6] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1F1B16] hover:bg-[#EFE9DF]"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#E6E0D6] bg-[#F7F4EE] px-5 py-3 text-[12px] text-[#7B7266]">
          <span className="font-mono tabular-nums">
            {filteredDeals.length} active offers
          </span>
          <div className="flex items-center gap-4">
            {query.trim() && (
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="font-medium text-[#D94832] hover:underline cursor-pointer"
              >
                View all results &rarr;
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                navigate(`/categories`);
              }}
              className="font-medium text-[#1F1B16] hover:text-[#D94832]"
            >
              All categories &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
