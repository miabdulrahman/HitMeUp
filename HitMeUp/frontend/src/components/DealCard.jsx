import { useState, useEffect } from "react";
import { Heart, MapPin, Clock3, ArrowUpRight, AlertCircle } from "lucide-react";
import { discoveryApi } from "../services/api";
import { calculateDealTimer } from "../utils/dealTimer";

function DealCard({ deal, onOpen }) {
  const [isFavorite, setIsFavorite] = useState(deal.isFavorited || false);
  const [timer, setTimer] = useState(() => calculateDealTimer(deal));

  useEffect(() => {
    setIsFavorite(deal.isFavorited || false);
  }, [deal.isFavorited]);

  useEffect(() => {
    setTimer(calculateDealTimer(deal));

    const interval = setInterval(() => {
      setTimer(calculateDealTimer(deal));
    }, 1000);

    return () => clearInterval(interval);
  }, [deal]);

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
      } catch {
        // Maintain local state when signed out
      }
    }
  };

  const serialSuffix = String(deal.id || deal._id || "1042")
    .slice(-4)
    .toUpperCase();

  const isSoldOut =
    deal.availableQuantity === 0 || deal.vouchersLeft === 0;

  return (
    <article
      onClick={handleClick}
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-150 cursor-pointer ${
        timer.isExpired
          ? "border-[#E6E0D6] bg-[#F7F4EE]/70 opacity-80 hover:border-[#7B7266]"
          : "border-[#E6E0D6] bg-[#FDFBF7] hover:border-[#1F1B16]/35 shadow-[0_1px_3px_rgba(31,27,22,0.03)] hover:shadow-[0_4px_16px_rgba(31,27,22,0.06)]"
      }`}
    >
      {/* Image & Clean Overlays */}
      <div className="relative h-44 w-full overflow-hidden border-b border-[#E6E0D6] bg-[#EFE9DF]">
        <img
          src={deal.image}
          alt={deal.title}
          className={`h-full w-full object-cover transition-transform duration-300 ${
            timer.isExpired ? "grayscale-50 contrast-90" : "group-hover:scale-102"
          }`}
          loading="lazy"
        />

        {/* Discount Tag */}
        <div className="absolute left-3 top-3 inline-flex items-center rounded-md bg-[#D94832] px-2 py-0.5 font-mono text-[11px] font-medium text-white tabular-nums shadow-xs">
          {deal.discount}
        </div>

        {/* Expired / Sold Out Overlay Tag */}
        {timer.isExpired ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#1F1B16]/90 px-3 py-1 font-mono text-[12px] font-medium text-white backdrop-blur-xs shadow-md">
            OFFER EXPIRED
          </div>
        ) : isSoldOut ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#1F1B16]/90 px-3 py-1 font-mono text-[12px] font-medium text-white backdrop-blur-xs shadow-md">
            BATCH SOLD OUT
          </div>
        ) : null}

        {/* Save Button */}
        <button
          onClick={handleFavoriteToggle}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150 cursor-pointer ${
            isFavorite
              ? "border-[#D94832] bg-[#D94832] text-white"
              : "border-[#E6E0D6] bg-[#FDFBF7]/95 text-[#5E554A] hover:text-[#1F1B16]"
          }`}
          aria-label={isFavorite ? "Remove from saved deals" : "Save deal"}
        >
          <Heart size={15} strokeWidth={1.5} className={isFavorite ? "fill-white" : ""} />
        </button>

        {/* Category Tag */}
        {deal.category && (
          <div className="absolute bottom-2.5 left-3 rounded-md bg-[#1F1B16]/85 px-2 py-0.5 text-[11px] font-normal text-[#FDFBF7]">
            {deal.category}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[12px] font-medium text-[#7B7266]">
              {deal.business}
            </p>
            <span className="font-mono text-[11px] text-[#7B7266] tabular-nums">
              HMU-{serialSuffix}
            </span>
          </div>

          <h3 className="mt-1 text-[16px] font-medium leading-snug text-[#1F1B16] group-hover:text-[#D94832] transition-colors duration-150 line-clamp-1">
            {deal.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#5E554A]">
            <span className="inline-flex items-center gap-1 rounded-md border border-[#E6E0D6] bg-[#F7F4EE] px-2 py-0.5">
              <MapPin size={12} strokeWidth={1.5} className="text-[#7B7266]" />
              <span>{deal.distanceText || deal.distance || "Nearby"}</span>
            </span>

            {/* Live Ticking Countdown */}
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] tabular-nums ${
                timer.isExpired
                  ? "border-[#B91C1C]/25 bg-[#B91C1C]/10 text-[#B91C1C]"
                  : timer.isUrgent
                  ? "border-[#D94832]/30 bg-[#D94832]/10 text-[#D94832] font-semibold"
                  : "border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A]"
              }`}
            >
              {timer.isExpired ? (
                <AlertCircle size={12} strokeWidth={1.5} className="text-[#B91C1C]" />
              ) : (
                <Clock3
                  size={12}
                  strokeWidth={1.5}
                  className={timer.isUrgent ? "text-[#D94832] animate-pulse" : "text-[#D94832]"}
                />
              )}
              <span>{timer.text}</span>
            </span>
          </div>
        </div>

        {/* Signature Perforated Divider & Price Stub */}
        <div className="mt-4">
          <div className="ticket-divider mb-3.5" />
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-[17px] font-medium text-[#1F1B16]">
                {deal.price}
              </span>
              {deal.oldPrice && (
                <span className="text-[12px] text-[#7B7266] line-through">
                  {deal.oldPrice}
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                timer.isExpired
                  ? "border-[#E6E0D6] bg-[#EFE9DF] text-[#7B7266]"
                  : "border-[#E6E0D6] bg-[#F7F4EE] text-[#1F1B16] group-hover:border-[#1F1B16] group-hover:bg-[#1F1B16] group-hover:text-[#FDFBF7]"
              }`}
            >
              <span>{timer.isExpired ? "Ended" : "View pass"}</span>
              <ArrowUpRight size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default DealCard;
