import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, Sparkles, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deals as allDeals } from "../data/deals";
import { categories } from "../data/categories";

function SearchModal({ isOpen, onClose, onSelectDeal }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter deals by query and selected category
  const filteredDeals = allDeals.filter((deal) => {
    const matchesQuery =
      !query.trim() ||
      deal.title.toLowerCase().includes(query.toLowerCase()) ||
      deal.business.toLowerCase().includes(query.toLowerCase()) ||
      deal.category.toLowerCase().includes(query.toLowerCase()) ||
      deal.description?.toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      deal.categorySlug === selectedCategory ||
      deal.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesQuery && matchesCategory;
  });

  const popularKeywords = ["Burger", "Pizza", "Earbuds", "Massage", "Gym", "Linen", "Cleaning", "VR"];

  const handleCategoryClick = (catSlug) => {
    onClose();
    navigate(`/category/${catSlug}`);
  };

  const handleDealClick = (deal) => {
    onClose();
    if (onSelectDeal) {
      onSelectDeal(deal);
    } else {
      navigate(`/category/${deal.categorySlug || "food"}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all my-6 flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <Search size={22} className="text-[#E8503A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search deals, restaurants, electronics, spas, items..."
            className="w-full bg-transparent text-base sm:text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 transition"
          >
            ESC
          </button>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto px-5 py-3 border-b border-gray-100 bg-gray-50/60 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === "all"
                ? "bg-[#172026] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-200/70 border border-gray-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.slug
                  ? "bg-[#E8503A] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-200/70 border border-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Popular Tags when query is empty */}
        {!query && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-gray-400">Popular:</span>
            {popularKeywords.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="rounded-md bg-white border border-gray-200 px-2.5 py-1 text-gray-600 hover:border-[#E8503A] hover:text-[#E8503A] transition"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => handleDealClick(deal)}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-3.5 transition-all duration-200 hover:border-[#E8503A]/40 hover:bg-gray-50/70 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-1 left-1 rounded bg-[#E8503A] px-1.5 py-0.5 text-[9px] font-black text-white">
                      {deal.discount}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8503A]">
                        {deal.business}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{deal.category}</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#E8503A] transition line-clamp-1">
                      {deal.title}
                    </h4>

                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-[#E8503A]" />
                        {deal.distance}
                      </span>
                      <span className="flex items-center gap-1 text-[#E8503A] font-medium">
                        <Clock size={11} />
                        {deal.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="text-base sm:text-lg font-black text-gray-900">
                    {deal.price}
                  </span>
                  {deal.oldPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {deal.oldPrice}
                    </span>
                  )}
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#E8503A] group-hover:translate-x-0.5 transition-transform">
                    <span>View Deal</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-base font-bold text-gray-700">No flash deals found</p>
              <p className="mt-1 text-sm text-gray-400">
                Try searching for another keyword or browse our categories.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-[#E8503A] hover:text-[#E8503A]"
                  >
                    Browse {cat.name} Deals
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-[#F7F5F2] px-5 py-3 text-xs text-gray-500">
          <span>Found {filteredDeals.length} active offers</span>
          <button
            onClick={() => {
              onClose();
              navigate(`/categories`);
            }}
            className="font-bold text-[#E8503A] hover:underline"
          >
            Explore all categories &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
