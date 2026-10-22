import { useState, useEffect } from "react";
import { Heart, MapPin, Clock3, ArrowRight, Sparkles } from "lucide-react";
import { discoveryApi } from "../services/api";

function DealCard({ deal, onOpen }) {
  const [isFavorite, setIsFavorite] = useState(deal.isFavorited || false);

  useEffect(() => {
    setIsFavorite(deal.isFavorited || false);
  }, [deal.isFavorited]);

  const handleClick = () => {
    if (onOpen) onOpen(deal);
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    const dealId = deal.id || deal._id;
    const nextVal = !isFavorite;
    setIsFavorite(nextVal);
    if (dealId) {
      try {
        await discoveryApi.toggleFavorite(dealId);
      } catch (err) {
        // If not logged in, maintain local state
      }
    }
  };

  return (
    <article
      onClick={handleClick}
      className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.09)] cursor-pointer"
    >
      {/* Image & Floating Overlays */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={deal.image}
          alt={deal.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
        />

        {/* Gradient dark scrim for bottom badges */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Discount Badge */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E8503A] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
          <Sparkles size={11} />
          {deal.discount}
        </div>

        {/* Favorite Heart Button (Member 3) */}
        <button
          onClick={handleFavoriteToggle}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 active:scale-90 ${
            isFavorite
              ? "bg-[#E8503A] text-white"
              : "bg-white/90 text-gray-600 hover:bg-white hover:text-[#E8503A]"
          }`}
          aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={15} className={isFavorite ? "fill-white" : ""} />
        </button>

        {/* Category Pill Over Image */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md">
          {deal.category}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Business / Merchant */}
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#E8503A]">
            {deal.business}
          </p>

          {/* Deal Title */}
          <h3 className="mt-1 text-[16px] font-bold leading-snug text-gray-900 group-hover:text-[#E8503A] transition-colors line-clamp-1">
            {deal.title}
          </h3>

          {/* Distance & Real-Time Countdown Indicators */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100/80 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
              <MapPin size={12} className="text-[#E8503A]" />
              {deal.distanceText || deal.distance || "Nearby"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF0ED] px-2 py-0.5 text-[11px] font-bold text-[#E8503A]">
              <Clock3 size={12} />
              {deal.time || "Limited time"}
            </span>
          </div>
        </div>

        {/* Price & Action Row (Always pinned to bottom) */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[19px] font-black text-gray-900">
                {deal.price}
              </span>
              {deal.oldPrice && (
                <span className="text-[12px] font-semibold text-gray-400 line-through">
                  {deal.oldPrice}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium text-emerald-600">
              Limited vouchers left
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-[#172026] px-3.5 py-2 text-[12px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#E8503A] hover:shadow-md active:scale-95"
          >
            <span>View Deal</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default DealCard;
