import { useState, useEffect } from "react";
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
  Copy,
  AlertCircle,
  QrCode
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { voucherApi } from "../services/api";

function DealDetailModal({ deal, isOpen, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [voucherCopied, setVoucherCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Claim State
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null); // holds claimed voucher object
  const [claimError, setClaimError] = useState("");
  const [currentStock, setCurrentStock] = useState(30);

  useEffect(() => {
    if (deal) {
      setClaimSuccess(null);
      setClaimError("");
      const initialStock = deal.availableQuantity !== undefined
        ? deal.availableQuantity
        : (typeof deal.vouchersLeft === "number" ? deal.vouchersLeft : 30);
      setCurrentStock(initialStock);
    }
  }, [deal]);

  if (!isOpen || !deal) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyVoucherCode = (code) => {
    navigator.clipboard?.writeText(code);
    setVoucherCopied(true);
    setTimeout(() => setVoucherCopied(false), 2500);
  };

  const handleClaim = async () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { notice: "Please sign in to claim this exclusive flash voucher!" }
      });
      return;
    }

    const dealId = deal._id || deal.id;
    if (!dealId) {
      setClaimError("Deal reference not available");
      return;
    }

    setClaiming(true);
    setClaimError("");

    try {
      const response = await voucherApi.claimVoucher({ dealId });
      setClaimSuccess(response.voucher);
      if (response.remainingQuantity !== undefined) {
        setCurrentStock(response.remainingQuantity);
      } else {
        setCurrentStock((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Claim voucher error:", err);
      setClaimError(err.message || "Failed to claim voucher. It may be sold out.");
    } finally {
      setClaiming(false);
    }
  };

  const savings = deal.rawOldPrice && deal.rawPrice
    ? deal.rawOldPrice - deal.rawPrice
    : null;

  const isSoldOut = currentStock <= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur transition hover:bg-white hover:text-black hover:scale-105 cursor-pointer"
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
              <h2 className="mt-1 text-xl sm:text-2xl font-black leading-tight text-white drop-shadow-xs">
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
                  <span>{deal.time || "Expires soon"}</span>
                </div>
                <div
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isSoldOut
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "text-amber-800 bg-amber-50 border-amber-200/60"
                  }`}
                >
                  {isSoldOut ? "❌ Sold Out" : `🔥 ${currentStock} vouchers left`}
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {claimError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span className="font-semibold">{claimError}</span>
              </div>
            )}

            {/* CELEBRATORY CLAIMED PASS CARD */}
            {claimSuccess && (
              <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-400/80 p-6 shadow-xl animate-fadeIn space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                      <Check size={20} strokeWidth={3} />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                        Voucher Claimed Successfully!
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Present this pass to the store cashier for instant redemption
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                    {claimSuccess.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
                  {/* QR Code image */}
                  {claimSuccess.qrData ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={claimSuccess.qrData}
                        alt="Digital Voucher QR Pass"
                        className="h-28 w-28 rounded-xl border border-gray-200 p-1.5 bg-white shadow-xs"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 font-bold flex items-center gap-1">
                        <QrCode size={10} /> Scan at counter
                      </span>
                    </div>
                  ) : null}

                  {/* Voucher code & instructions */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Unique Voucher Code
                      </span>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                        <span className="font-mono text-xl font-black text-gray-900 tracking-wider bg-gray-50 px-3 py-1 rounded-xl border border-gray-200">
                          {claimSuccess.code}
                        </span>
                        <button
                          onClick={() => handleCopyVoucherCode(claimSuccess.code)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                          title="Copy Code"
                        >
                          {voucherCopied ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      Saved to your buyer account. You can view all your active passes any time in your dashboard.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    to="/customer/dashboard"
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-md transition cursor-pointer"
                  >
                    <Ticket size={16} />
                    <span>View in My Buyer Dashboard</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white/80 transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Location & Rating */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#E8503A] shrink-0" />
                <span className="font-semibold text-gray-900">{deal.location || deal.business}</span>
                {deal.distance && <span className="text-xs text-gray-400">({deal.distance})</span>}
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
                {deal.description || "Limited-time flash deal offered directly by verified local business. Redeem digital voucher in-store upon presenting your unique QR code or digital code."}
              </p>
            </div>

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
            {!claimSuccess && (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleShare}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 cursor-pointer"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
                  <span>{copied ? "Link Copied!" : "Share Deal"}</span>
                </button>

                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition cursor-pointer ${
                    isFavorited
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Heart size={16} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
                  <span>{isFavorited ? "Saved" : "Save"}</span>
                </button>

                {isSoldOut ? (
                  <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-6 py-3.5 text-sm font-bold text-gray-500 cursor-not-allowed">
                    <span>Sold Out</span>
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4A2F] to-[#E8503A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E8503A]/25 transition hover:shadow-xl hover:shadow-[#E8503A]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer"
                  >
                    {claiming ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Claiming Digital Voucher...</span>
                      </>
                    ) : (
                      <>
                        <Ticket size={18} />
                        <span>Claim Digital Voucher Now</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealDetailModal;
