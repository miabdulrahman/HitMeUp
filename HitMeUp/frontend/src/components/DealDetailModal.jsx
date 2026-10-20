import { useState } from "react";
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Share2,
  Heart,
  Ticket,
  ArrowRight,
  Star,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DealDetailModal({ deal, isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [claimed, setClaimed] = useState(false);

  if (!isOpen || !deal) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const savings = deal.rawOldPrice && deal.rawPrice
    ? deal.rawOldPrice - deal.rawPrice
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur transition hover:bg-white hover:text-black hover:scale-105"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto">
          {/* Header Image Cover */}
          <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gray-900">
            <img
              src={deal.image}
              alt={deal.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />

            {/* Badges on image */}
            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8503A] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                <Sparkles size={13} />
                {deal.discount}
              </span>
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                {deal.category}
              </span>
            </div>

            {/* Bottom info on image */}
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF8C73]">
                <span>{deal.business}</span>
                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck size={11} /> Verified Partner
                </span>
              </div>
              <h2 className="mt-1 text-xl sm:text-2xl font-black leading-tight text-white drop-shadow-sm">
                {deal.title}
              </h2>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#F7F5F2] p-4 border border-gray-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">
                  {deal.price}
                </span>
                {deal.oldPrice && (
                  <span className="text-base font-semibold text-gray-400 line-through">
                    {deal.oldPrice}
                  </span>
                )}
                {savings && (
                  <span className="ml-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    Save Rs. {savings.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-bold text-[#E8503A] bg-[#FFF0ED] px-2.5 py-1 rounded-lg">
                  <Clock size={14} />
                  <span>{deal.time || "Expires today"}</span>
                </div>
                {deal.vouchersLeft && (
                  <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/50">
                    🔥 {deal.vouchersLeft} vouchers left
                  </div>
                )}
              </div>
            </div>

            {/* Location & Rating */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#E8503A] shrink-0" />
                <span className="font-semibold text-gray-900">{deal.location || deal.business}</span>
                <span className="text-xs text-gray-400">({deal.distance})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-amber-500">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span className="ml-1 font-bold text-gray-900">{deal.rating || 4.8}</span>
                </div>
                <span className="text-xs text-gray-400">({deal.reviewsCount || 42} reviews)</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                About This Flash Deal
              </h3>
              <p className="text-base leading-relaxed text-gray-700">
                {deal.description || "Limited-time flash deal offered directly by verified local business. Redeem digital voucher in-store or upon presentation."}
              </p>
            </div>

            {/* Highlights */}
            {deal.highlights && deal.highlights.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Deal Highlights
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {deal.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms */}
            {deal.terms && (
              <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-gray-900">
                  <Info size={14} className="text-gray-500" />
                  <span>Terms & Redemption Instructions</span>
                </div>
                <p>{deal.terms}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleShare}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
                <span>{copied ? "Link Copied!" : "Share Deal"}</span>
              </button>

              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  isFavorited
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Heart size={16} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
                <span>{isFavorited ? "Saved" : "Save"}</span>
              </button>

              {claimed ? (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg">
                  <Ticket size={18} />
                  <span>Voucher Claimed! Check Your Account</span>
                </div>
              ) : isAuthenticated ? (
                <Link
                  to="/customer/dashboard"
                  onClick={() => setClaimed(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#E8503A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E8503A]/25 transition hover:bg-[#D4402C] active:scale-98"
                >
                  <Ticket size={18} />
                  <span>Claim Digital Voucher Now</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#172026] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#E8503A] active:scale-98"
                >
                  <span>Sign Up & Grab Deal</span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealDetailModal;
