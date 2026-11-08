import { useState, useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  Star,
  Phone,
  Mail,
  Clock,
  Store,
  ShieldCheck,
  Ticket,
  ArrowRight,
  ExternalLink,
  Compass,
  CheckCircle2,
  AlertCircle,
  Tag,
  Share2,
  Check
} from "lucide-react";
import { businessApi, dealApi, discoveryApi } from "../services/api";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";

function SellerProfileModal({
  businessId,
  initialData = null,
  isOpen,
  onClose,
  onSelectDeal,
}) {
  const [business, setBusiness] = useState(initialData);
  const [deals, setDeals] = useState([]);
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    total: 0,
    averageRating: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("deals"); // 'deals' | 'reviews' | 'about'
  const [copiedShare, setCopiedShare] = useState(false);

  // Load business profile, active deals, and reviews
  const loadSellerData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      const [bizRes, dealsRes, reviewsRes] = await Promise.allSettled([
        businessApi.getById(businessId),
        dealApi.getDealsByBusiness(businessId),
        discoveryApi.getBusinessReviews(businessId, { limit: 20 }),
      ]);

      if (bizRes.status === "fulfilled" && bizRes.value?.business) {
        setBusiness(bizRes.value.business);
      } else if (initialData) {
        setBusiness(initialData);
      }

      if (dealsRes.status === "fulfilled") {
        setDeals(dealsRes.value?.deals || dealsRes.value?.data || []);
      }

      if (reviewsRes.status === "fulfilled") {
        setReviewsData({
          reviews: reviewsRes.value?.reviews || [],
          total: reviewsRes.value?.total || 0,
          averageRating: reviewsRes.value?.averageRating || 5.0,
        });
      }
    } catch (err) {
      console.error("Failed to load seller profile data:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId, initialData]);

  useEffect(() => {
    if (isOpen && businessId) {
      if (initialData) {
        setBusiness(initialData);
      }
      loadSellerData();
      setActiveTab("deals");
    }
  }, [isOpen, businessId, initialData, loadSellerData]);

  if (!isOpen) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const coverUrl = business?.coverImageUrl || business?.coverImage || DEFAULT_COVER;
  const logoUrl = business?.logoUrl || business?.logo || "";
  const storeName = business?.name || "Local Merchant Store";
  const category = business?.category || "Merchant";
  const city = business?.address?.city || "Colombo";
  const fullAddress = [
    business?.address?.street,
    business?.address?.city,
    business?.address?.postalCode,
    business?.address?.country || "Sri Lanka",
  ]
    .filter(Boolean)
    .join(", ");

  const lat =
    business?.latitude ||
    business?.location?.coordinates?.[1] ||
    6.9271;
  const lng =
    business?.longitude ||
    business?.location?.coordinates?.[0] ||
    79.8612;

  const avgRating = reviewsData.averageRating || 5.0;
  const totalReviews = reviewsData.total || reviewsData.reviews.length;

  return (
    <div
      className="ios-popup-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-[#1F1B16]/60 p-0 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="ios-popup-card relative my-0 sm:my-6 flex max-h-[92vh] sm:max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[26px] rounded-b-none sm:rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] shadow-[0_16px_40px_rgba(31,27,22,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Pill */}
        <div className="flex sm:hidden w-full items-center justify-center pt-2.5 pb-1">
          <div className="h-1 w-11 rounded-full bg-[#1F1B16]/20" />
        </div>

        {/* Top Floating Controls */}
        <div className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-full sm:rounded-lg border border-[#E6E0D6] bg-[#FDFBF7]/95 text-[#1F1B16] shadow-xs transition-colors hover:bg-[#EFE9DF] cursor-pointer"
            title="Share Store Link"
            aria-label="Share Store Link"
          >
            {copiedShare ? (
              <Check size={16} strokeWidth={2} className="text-[#166534]" />
            ) : (
              <Share2 size={16} strokeWidth={1.5} />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-full sm:rounded-lg border border-[#E6E0D6] bg-[#FDFBF7]/95 text-[#1F1B16] shadow-xs transition-colors hover:bg-[#EFE9DF] cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={17} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto">
          {/* Header Cover Banner */}
          <div className="relative h-48 w-full overflow-hidden border-b border-[#E6E0D6] bg-[#1F1B16] sm:h-60">
            <img
              src={coverUrl}
              alt={storeName}
              className="h-full w-full object-cover opacity-90 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F1B16]/85 via-[#1F1B16]/35 to-transparent" />

            {/* Category & Verified Badges on Cover */}
            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#1F1B16]/80 px-2.5 py-1 text-[11px] font-medium text-[#FDFBF7] backdrop-blur-xs">
                <Store size={12} strokeWidth={1.5} />
                <span>{category}</span>
              </span>
              {business?.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#166534]/90 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                  <ShieldCheck size={12} strokeWidth={1.5} />
                  <span>Verified Merchant</span>
                </span>
              )}
            </div>
          </div>

          {/* Store Profile Info Card (Overlapping Banner) */}
          <div className="relative px-5 sm:px-7 pt-0 pb-4">
            <div className="-mt-12 sm:-mt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
              <div className="flex items-end gap-3.5">
                {/* Logo / Avatar */}
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-[#FDFBF7] bg-white shadow-md">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={storeName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#D94832]/10 font-mono text-[24px] sm:text-[28px] font-bold text-[#D94832]">
                      {storeName[0]?.toUpperCase() || "S"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <h2 className="flex items-center gap-2 text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#1F1B16]">
                    <span className="truncate">{storeName}</span>
                    {business?.isVerified && (
                      <CheckCircle2
                        size={18}
                        className="text-[#166534] shrink-0"
                      />
                    )}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#5E554A]">
                    <span className="inline-flex items-center gap-1 font-medium text-[#1F1B16]">
                      <Star size={13} className="fill-[#1F1B16] text-[#1F1B16]" />
                      <span>{Number(avgRating).toFixed(1)}</span>
                      <span className="text-[#7B7266]">
                        ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
                      </span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-[#7B7266]" />
                      <span>{city}, Sri Lanka</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Direction Button */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(
                    storeName
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1F1B16] px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-[#D94832] cursor-pointer"
                >
                  <Compass size={14} strokeWidth={1.5} />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* Quick Contact & Hours Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] p-3 text-[12px] text-[#5E554A]">
              {business?.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-2 hover:text-[#D94832] transition-colors"
                >
                  <Phone size={13} strokeWidth={1.5} className="text-[#7B7266] shrink-0" />
                  <span className="truncate">{business.phone}</span>
                </a>
              )}
              {business?.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex items-center gap-2 hover:text-[#D94832] transition-colors"
                >
                  <Mail size={13} strokeWidth={1.5} className="text-[#7B7266] shrink-0" />
                  <span className="truncate">{business.email}</span>
                </a>
              )}
              <div className="inline-flex items-center gap-2">
                <Clock size={13} strokeWidth={1.5} className="text-[#7B7266] shrink-0" />
                <span className="truncate">
                  {business?.openingHours || "09:00 AM - 09:00 PM"}
                </span>
              </div>
            </div>

            {/* Store Description / Bio */}
            {business?.description && (
              <p className="mt-3.5 text-[13px] leading-relaxed text-[#5E554A]">
                {business.description}
              </p>
            )}

            {/* Tab Navigation */}
            <div className="mt-6 flex items-center gap-2 border-b border-[#E6E0D6] pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("deals")}
                className={`relative flex items-center gap-2 pb-2.5 px-3 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeTab === "deals"
                    ? "text-[#D94832]"
                    : "text-[#5E554A] hover:text-[#1F1B16]"
                }`}
              >
                <Tag size={14} strokeWidth={1.5} />
                <span>Available Deals</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] ${
                    activeTab === "deals"
                      ? "bg-[#D94832]/10 text-[#D94832]"
                      : "bg-[#E6E0D6] text-[#5E554A]"
                  }`}
                >
                  {deals.length}
                </span>
                {activeTab === "deals" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D94832] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`relative flex items-center gap-2 pb-2.5 px-3 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeTab === "reviews"
                    ? "text-[#D94832]"
                    : "text-[#5E554A] hover:text-[#1F1B16]"
                }`}
              >
                <Star size={14} strokeWidth={1.5} />
                <span>Reviews &amp; Ratings</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] ${
                    activeTab === "reviews"
                      ? "bg-[#D94832]/10 text-[#D94832]"
                      : "bg-[#E6E0D6] text-[#5E554A]"
                  }`}
                >
                  {totalReviews}
                </span>
                {activeTab === "reviews" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D94832] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("about")}
                className={`relative flex items-center gap-2 pb-2.5 px-3 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeTab === "about"
                    ? "text-[#D94832]"
                    : "text-[#5E554A] hover:text-[#1F1B16]"
                }`}
              >
                <MapPin size={14} strokeWidth={1.5} />
                <span>Location &amp; Info</span>
                {activeTab === "about" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D94832] rounded-full" />
                )}
              </button>
            </div>

            {/* TAB 1: ACTIVE DEALS TO CLAIM */}
            {activeTab === "deals" && (
              <div className="pt-5 pb-6">
                {loading ? (
                  <div className="py-12 text-center text-[13px] text-[#7B7266]">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#D94832] border-t-transparent mb-2" />
                    <p>Loading seller deals...</p>
                  </div>
                ) : deals.length === 0 ? (
                  <div className="rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] p-8 text-center">
                    <Ticket size={28} className="mx-auto mb-2 text-[#7B7266]" strokeWidth={1.5} />
                    <h4 className="text-[14px] font-medium text-[#1F1B16]">
                      No active deals right now
                    </h4>
                    <p className="mt-1 text-[12px] text-[#5E554A]">
                      This merchant currently doesn&apos;t have any active flash promotions. Check back soon!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {deals.map((deal) => {
                      const dealId = deal._id || deal.id;
                      const image =
                        deal.imageUrl ||
                        deal.image ||
                        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80";

                      return (
                        <div
                          key={dealId}
                          className="flex flex-col justify-between rounded-xl border border-[#E6E0D6] bg-white p-3.5 shadow-2xs transition-all hover:border-[#1F1B16]/30 hover:shadow-xs"
                        >
                          <div>
                            <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg bg-[#F7F4EE]">
                              <img
                                src={image}
                                alt={deal.title}
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-103"
                              />
                              <div className="absolute top-2.5 left-2.5">
                                <span className="rounded-md bg-[#D94832] px-2 py-0.5 font-mono text-[11px] font-medium text-white tabular-nums shadow-xs">
                                  {deal.discountPercentage}% OFF
                                </span>
                              </div>
                              <div className="absolute bottom-2 left-2">
                                <span className="rounded-[5px] bg-[#1F1B16]/80 px-2 py-0.5 text-[11px] text-white">
                                  {deal.category || category}
                                </span>
                              </div>
                            </div>

                            <h4 className="line-clamp-2 text-[14px] font-medium text-[#1F1B16]">
                              {deal.title}
                            </h4>

                            {deal.description && (
                              <p className="mt-1 line-clamp-2 text-[12px] text-[#5E554A]">
                                {deal.description}
                              </p>
                            )}

                            <div className="mt-3 flex items-baseline justify-between font-mono text-[12px] tabular-nums">
                              <div>
                                <span className="text-[15px] font-medium text-[#1F1B16]">
                                  Rs. {Number(deal.discountedPrice || 0).toLocaleString()}
                                </span>
                                {deal.originalPrice && (
                                  <span className="ml-1.5 text-[11px] text-[#7B7266] line-through">
                                    Rs. {Number(deal.originalPrice).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {deal.availableQuantity !== undefined && (
                                <span className="text-[11px] text-[#166534] font-medium">
                                  {deal.availableQuantity} left
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3.5 pt-3 border-t border-[#E6E0D6]">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectDeal) {
                                  // Pass deal with populated business name
                                  onSelectDeal({
                                    ...deal,
                                    business: storeName,
                                    businessId: business?._id || businessId,
                                    image,
                                    price: `Rs. ${Number(deal.discountedPrice || 0).toLocaleString()}`,
                                    oldPrice: deal.originalPrice
                                      ? `Rs. ${Number(deal.originalPrice).toLocaleString()}`
                                      : "",
                                    discount: `${deal.discountPercentage || 0}% off`,
                                  });
                                }
                              }}
                              className="inline-flex h-8.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1F1B16] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#D94832] cursor-pointer"
                            >
                              <Ticket size={13} strokeWidth={1.5} />
                              <span>View &amp; Claim Pass</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REVIEWS & RATINGS */}
            {activeTab === "reviews" && (
              <div className="pt-5 pb-6 space-y-5">
                {/* Score Summary Box */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white border border-[#E6E0D6] font-mono text-[24px] font-bold text-[#1F1B16]">
                      {Number(avgRating).toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[#1F1B16]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= Math.round(avgRating)
                                ? "fill-[#D94832] text-[#D94832]"
                                : "text-[#D4D4D8]"
                            }
                          />
                        ))}
                      </div>
                      <p className="mt-0.5 text-[12px] text-[#5E554A]">
                        Based on {totalReviews} verified customer review{totalReviews !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right text-[11px] text-[#7B7266]">
                    <span className="inline-flex items-center gap-1 text-[#166534] font-medium">
                      <ShieldCheck size={13} strokeWidth={1.5} />
                      <span>Verified Counter Redemptions</span>
                    </span>
                    <p className="mt-0.5">Reviews submitted after redeeming deals</p>
                  </div>
                </div>

                {/* Reviews List */}
                {reviewsData.reviews.length === 0 ? (
                  <div className="rounded-xl border border-[#E6E0D6] bg-white p-8 text-center text-[#5E554A]">
                    <Star size={28} className="mx-auto mb-2 text-[#7B7266]" strokeWidth={1.5} />
                    <h4 className="text-[14px] font-medium text-[#1F1B16]">
                      No customer reviews yet
                    </h4>
                    <p className="mt-1 text-[12px] text-[#7B7266]">
                      Claim an active flash deal from this merchant to leave the first review!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviewsData.reviews.map((rev) => {
                      const reviewerName = rev.userId?.name || "Customer";
                      const reviewerAvatar = rev.userId?.avatar;
                      const dateStr = rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Recent";

                      return (
                        <div
                          key={rev._id}
                          className="rounded-xl border border-[#E6E0D6] bg-white p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {reviewerAvatar ? (
                                <img
                                  src={reviewerAvatar}
                                  alt={reviewerName}
                                  className="h-8 w-8 rounded-full object-cover border border-[#E6E0D6]"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFE9DF] text-[12px] font-medium text-[#1F1B16]">
                                  {reviewerName[0]?.toUpperCase() || "C"}
                                </div>
                              )}
                              <div>
                                <p className="text-[13px] font-medium text-[#1F1B16]">
                                  {reviewerName}
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-[#7B7266]">
                                  <span className="font-mono tabular-nums">{dateStr}</span>
                                  {rev.dealId?.title && (
                                    <>
                                      <span>·</span>
                                      <span className="text-[#5E554A] truncate max-w-[200px]">
                                        {rev.dealId.title}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={13}
                                  className={
                                    s <= rev.rating
                                      ? "fill-[#D94832] text-[#D94832]"
                                      : "text-[#D4D4D8]"
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          {rev.comment && (
                            <p className="mt-2.5 text-[13px] leading-relaxed text-[#5E554A]">
                              &ldquo;{rev.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LOCATION & STORE INFO */}
            {activeTab === "about" && (
              <div className="pt-5 pb-6 space-y-4">
                <div className="rounded-xl border border-[#E6E0D6] bg-white p-5 space-y-4">
                  <h4 className="text-[14px] font-medium text-[#1F1B16]">
                    Store Address &amp; Navigation
                  </h4>

                  <div className="flex items-start gap-2.5 text-[13px] text-[#5E554A]">
                    <MapPin size={16} strokeWidth={1.5} className="text-[#D94832] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#1F1B16]">{storeName}</p>
                      <p className="mt-0.5">{fullAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#E6E0D6]">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(
                        storeName
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1F1B16] px-4 text-[12px] font-medium text-white hover:bg-[#D94832] transition-colors"
                    >
                      <Compass size={14} strokeWidth={1.5} />
                      <span>Directions in Google Maps</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${storeName} ${city}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-4 text-[12px] font-medium text-[#1F1B16] hover:bg-[#EFE9DF] transition-colors"
                    >
                      <ExternalLink size={13} strokeWidth={1.5} />
                      <span>Open on Google Maps</span>
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E6E0D6] bg-white p-5 space-y-3">
                  <h4 className="text-[14px] font-medium text-[#1F1B16]">
                    Operating Hours &amp; Information
                  </h4>
                  <div className="flex items-center gap-2 text-[13px] text-[#5E554A]">
                    <Clock size={15} strokeWidth={1.5} className="text-[#7B7266] shrink-0" />
                    <span>Every day: {business?.openingHours || "09:00 AM - 09:00 PM"}</span>
                  </div>
                  {business?.phone && (
                    <div className="flex items-center gap-2 text-[13px] text-[#5E554A]">
                      <Phone size={15} strokeWidth={1.5} className="text-[#7B7266] shrink-0" />
                      <span>Counter Hotline: {business.phone}</span>
                    </div>
                  )}
                  {business?.email && (
                    <div className="flex items-center gap-2 text-[13px] text-[#5E554A]">
                      <Mail size={15} strokeWidth={1.5} className="text-[#7B7266] shrink-0" />
                      <span>Customer Inquiries: {business.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerProfileModal;
