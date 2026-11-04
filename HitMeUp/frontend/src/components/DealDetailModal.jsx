import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Clock,
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
  QrCode,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { voucherApi } from "../services/api";
import DealReviewsSection from "./DealReviewsSection";
import { calculateDealTimer } from "../utils/dealTimer";

function DealDetailModal({ deal, isOpen, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [voucherCopied, setVoucherCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [claimError, setClaimError] = useState("");
  const [currentStock, setCurrentStock] = useState(30);
  const [timer, setTimer] = useState(() => calculateDealTimer(deal));

  useEffect(() => {
    if (deal) {
      setClaimSuccess(null);
      setClaimError("");
      const initialStock =
        deal.availableQuantity !== undefined
          ? deal.availableQuantity
          : typeof deal.vouchersLeft === "number"
          ? deal.vouchersLeft
          : 30;
      setCurrentStock(initialStock);
      setIsFavorited(deal.isFavorited || false);
      setTimer(calculateDealTimer(deal));
    }
  }, [deal]);

  useEffect(() => {
    if (!isOpen || !deal) return;

    setTimer(calculateDealTimer(deal));
    const interval = setInterval(() => {
      setTimer(calculateDealTimer(deal));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, deal]);

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
    if (timer.isExpired) {
      setClaimError("This flash deal has expired and can no longer be claimed.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: { notice: "Sign in to claim this voucher pass" },
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
      setClaimError(
        err.message || "Could not claim voucher. Batch may be sold out or expired."
      );
    } finally {
      setClaiming(false);
    }
  };

  const savings =
    deal.rawOldPrice && deal.rawPrice ? deal.rawOldPrice - deal.rawPrice : null;

  const isSoldOut = currentStock <= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1F1B16]/55 p-4 backdrop-blur-xs sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] shadow-[0_12px_32px_rgba(31,27,22,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#FDFBF7]/95 text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF] cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="overflow-y-auto">
          {/* Header Image Cover */}
          <div className="relative h-60 w-full overflow-hidden border-b border-[#E6E0D6] bg-[#1F1B16] sm:h-68">
            <img
              src={deal.image}
              alt={deal.title}
              className={`h-full w-full object-cover transition-all ${
                timer.isExpired ? "grayscale-50 contrast-85 opacity-70" : "opacity-90"
              }`}
            />
            <div className="absolute inset-0 bg-[#1F1B16]/45" />

            {/* Top tags */}
            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-[#D94832] px-2.5 py-1 font-mono text-[12px] font-medium text-white tabular-nums">
                {deal.discount}
              </span>
              {deal.category && (
                <span className="rounded-md bg-[#1F1B16]/80 px-2.5 py-1 text-[12px] font-normal text-[#FDFBF7]">
                  {deal.category}
                </span>
              )}
              {timer.isExpired && (
                <span className="rounded-md bg-[#B91C1C] px-2.5 py-1 font-mono text-[12px] font-medium text-white">
                  Expired
                </span>
              )}
            </div>

            {/* Bottom merchant & title */}
            <div className="absolute bottom-5 left-5 right-5 text-[#FDFBF7]">
              <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#EFE9DF]">
                <span>{deal.business}</span>
                <span className="inline-flex items-center gap-1 rounded-[5px] border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] text-[#FDFBF7]">
                  <ShieldCheck size={12} strokeWidth={1.5} />
                  <span>Verified merchant</span>
                </span>
              </div>
              <h2 className="mt-1.5 text-[22px] font-medium leading-snug text-[#FDFBF7] sm:text-[24px]">
                {deal.title}
              </h2>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="space-y-6 p-6 sm:p-7">
            {/* Expired Warning Banner */}
            {timer.isExpired && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/10 p-3.5 text-[13px] text-[#B91C1C]">
                <AlertCircle size={18} strokeWidth={1.75} className="shrink-0" />
                <span className="font-medium">
                  This flash promotion ended on schedule. Passes can no longer be reserved.
                </span>
              </div>
            )}

            {/* Price & Availability Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] p-4">
              <div className="flex items-baseline gap-2.5 font-mono tabular-nums">
                <span className="text-[26px] font-medium text-[#1F1B16]">
                  {deal.price}
                </span>
                {deal.oldPrice && (
                  <span className="text-[14px] text-[#7B7266] line-through">
                    {deal.oldPrice}
                  </span>
                )}
                {savings && !timer.isExpired && (
                  <span className="rounded-[5px] bg-[#166534]/10 px-2 py-0.5 font-sans text-[12px] font-medium text-[#166534]">
                    Save Rs. {savings.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono text-[12px] tabular-nums">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${
                    timer.isExpired
                      ? "border-[#B91C1C]/30 bg-[#B91C1C]/10 text-[#B91C1C]"
                      : timer.isUrgent
                      ? "border-[#D94832]/40 bg-[#D94832]/10 text-[#D94832] font-semibold"
                      : "border-[#E6E0D6] bg-[#FDFBF7] text-[#5E554A]"
                  }`}
                >
                  <Clock
                    size={13}
                    strokeWidth={1.5}
                    className={
                      timer.isExpired
                        ? "text-[#B91C1C]"
                        : timer.isUrgent
                        ? "text-[#D94832] animate-pulse"
                        : "text-[#D94832]"
                    }
                  />
                  <span>{timer.text}</span>
                </div>

                <div
                  className={`rounded-md border px-2.5 py-1 font-medium ${
                    timer.isExpired
                      ? "border-[#E6E0D6] bg-[#EFE9DF] text-[#7B7266]"
                      : isSoldOut
                      ? "border-[#B91C1C]/20 bg-[#B91C1C]/10 text-[#B91C1C]"
                      : "border-[#E6E0D6] bg-[#FDFBF7] text-[#1F1B16]"
                  }`}
                >
                  {timer.isExpired
                    ? "Closed"
                    : isSoldOut
                    ? "Sold out"
                    : `${currentStock} passes left`}
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {claimError && (
              <div className="flex items-center gap-2 rounded-lg border border-[#B91C1C]/25 bg-[#B91C1C]/5 p-3.5 text-[13px] text-[#B91C1C]">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            {/* Perforated Claimed Voucher Pass */}
            {claimSuccess && (
              <div className="rounded-xl border border-[#166534]/30 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#166534] text-white">
                      <Check size={16} strokeWidth={2} />
                    </span>
                    <div>
                      <h4 className="text-[14px] font-medium text-[#1F1B16]">
                        Counter voucher pass issued
                      </h4>
                      <p className="text-[12px] text-[#5E554A]">
                        Present this QR code or serial at the store register
                      </p>
                    </div>
                  </div>
                  <span className="rounded-[5px] bg-[#166534]/10 px-2.5 py-1 font-mono text-[11px] font-medium text-[#166534] capitalize">
                    {claimSuccess.status}
                  </span>
                </div>

                <div className="ticket-divider my-4" />

                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  {claimSuccess.qrData ? (
                    <div className="flex flex-col items-center shrink-0">
                      <img
                        src={claimSuccess.qrData}
                        alt="Digital Voucher QR Pass"
                        className="h-28 w-28 rounded-lg border border-[#E6E0D6] bg-white p-1.5"
                      />
                      <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-[#7B7266]">
                        <QrCode size={11} strokeWidth={1.5} />
                        <span>Scan at counter</span>
                      </span>
                    </div>
                  ) : null}

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <span className="text-[11px] font-medium text-[#7B7266]">
                      Voucher serial code
                    </span>
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <span className="rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-3 py-1.5 font-mono text-[18px] font-medium text-[#1F1B16]">
                        {claimSuccess.code}
                      </span>
                      <button
                        onClick={() => handleCopyVoucherCode(claimSuccess.code)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] text-[#5E554A] transition-colors hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
                        title="Copy code"
                      >
                        {voucherCopied ? (
                          <Check size={14} className="text-[#166534]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <p className="text-[12px] text-[#5E554A]">
                      Saved to your account passes. Cashier will verify before applying the discount.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Location & Contact Details */}
            <div className="rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] p-4.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[14px] font-medium text-[#1F1B16]">
                    {deal.business}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#5E554A]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} strokeWidth={1.5} className="text-[#7B7266]" />
                      <span>{deal.location || deal.distance || "Sri Lanka"}</span>
                    </span>
                    {deal.distanceText && (
                      <span className="text-[#7B7266]">· {deal.distanceText}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[12px] font-medium text-[#1F1B16]">
                  <Star size={13} className="fill-[#1F1B16] text-[#1F1B16]" />
                  <span>{deal.rating || 4.8}</span>
                  <span className="text-[#7B7266]">({deal.reviewsCount || 24})</span>
                </div>
              </div>

              {deal.terms && (
                <div className="mt-3.5 border-t border-[#E6E0D6] pt-3 text-[12px] text-[#5E554A]">
                  <span className="font-medium text-[#1F1B16]">Terms: </span>
                  <span>{deal.terms}</span>
                </div>
              )}
            </div>

            {/* Deal Description */}
            <div>
              <h4 className="text-[13px] font-medium text-[#1F1B16]">
                Offer overview
              </h4>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#5E554A]">
                {deal.description || "Limited neighborhood discount voucher."}
              </p>
            </div>

            {/* Verified Reviews Section */}
            <DealReviewsSection
              dealId={deal._id || deal.id}
              initialRating={deal.rating}
              initialReviewCount={deal.reviewsCount}
            />

            {/* Action Buttons */}
            {!claimSuccess && (
              <div className="flex flex-col items-center gap-2.5 pt-2 sm:flex-row">
                <button
                  onClick={handleShare}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-4 text-[13px] font-medium text-[#1F1B16] transition-colors hover:bg-[#EFE9DF] sm:w-auto cursor-pointer"
                >
                  {copied ? (
                    <Check size={15} strokeWidth={1.5} className="text-[#166534]" />
                  ) : (
                    <Share2 size={15} strokeWidth={1.5} />
                  )}
                  <span>{copied ? "Link copied" : "Share"}</span>
                </button>

                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-[13px] font-medium transition-colors sm:w-auto cursor-pointer ${
                    isFavorited
                      ? "border-[#D94832]/30 bg-[#D94832]/10 text-[#D94832]"
                      : "border-[#E6E0D6] bg-[#F7F4EE] text-[#1F1B16] hover:bg-[#EFE9DF]"
                  }`}
                >
                  <Heart
                    size={15}
                    strokeWidth={1.5}
                    className={isFavorited ? "fill-[#D94832] text-[#D94832]" : ""}
                  />
                  <span>{isFavorited ? "Saved" : "Save"}</span>
                </button>

                {timer.isExpired ? (
                  <div className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#EFE9DF] px-6 text-[13px] font-medium text-[#7B7266] cursor-not-allowed">
                    <span>Offer expired</span>
                  </div>
                ) : isSoldOut ? (
                  <div className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#EFE9DF] px-6 text-[13px] font-medium text-[#7B7266] cursor-not-allowed">
                    <span>Batch sold out</span>
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="flex h-11 w-full flex-1 items-center justify-center gap-2 rounded-lg bg-[#D94832] px-6 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#C23B26] disabled:opacity-60 cursor-pointer"
                  >
                    {claiming ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Issuing voucher pass...</span>
                      </>
                    ) : (
                      <>
                        <Ticket size={16} strokeWidth={1.5} />
                        <span>Claim voucher pass</span>
                        <ArrowRight size={15} strokeWidth={1.5} />
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
