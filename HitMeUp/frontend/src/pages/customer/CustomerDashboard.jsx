import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Ticket,
  User,
  LogOut,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  X,
  Clock,
  Store,
  Tag,
  CheckCircle2,
  Heart,
  Star,
  MapPin,
  Phone,
  ExternalLink,
  Lock,
  Edit3,
  Search,
  Compass,
  Trash2,
  DollarSign
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { voucherApi, orderApi, discoveryApi, authApi } from "../../services/api";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile: updateAuthProfile, loading: authLoading } = useAuth();

  // Navigation tab: 'overview', 'vouchers', 'favorites', 'orders', 'profile'
  const [activeTab, setActiveTab] = useState("overview");

  // Core Data
  const [vouchers, setVouchers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [lastSynced, setLastSynced] = useState(null);

  // Vouchers Tab State
  const [voucherFilter, setVoucherFilter] = useState("all"); // 'all', 'active', 'redeemed', 'expired'
  const [voucherSearch, setVoucherSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedVoucherForQR, setSelectedVoucherForQR] = useState(null);

  // Review Modal State (For redeemed vouchers)
  const [reviewModalVoucher, setReviewModalVoucher] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: ""
  });
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Sync all customer data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    setErrorMsg("");

    try {
      const [vouchersRes, ordersRes, favRes] = await Promise.allSettled([
        voucherApi.getMyVouchers(),
        orderApi.getMyOrders(),
        discoveryApi.getMyFavorites ? discoveryApi.getMyFavorites() : Promise.resolve({ favorites: [] }),
      ]);

      if (vouchersRes.status === "fulfilled") {
        setVouchers(vouchersRes.value?.vouchers || vouchersRes.value?.data || []);
      }
      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value?.orders || ordersRes.value?.data || []);
      }
      if (favRes.status === "fulfilled") {
        setFavorites(favRes.value?.favorites || []);
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setErrorMsg("Failed to synchronize with server. Please refresh.");
    } finally {
      setLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    if (isAuthenticated) {
      void Promise.resolve().then(() => fetchData());
    }
  }, [authLoading, fetchData, isAuthenticated, navigate]);

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast("Voucher code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Remove deal from favorites
  const handleRemoveFavorite = async (dealId, e) => {
    e?.stopPropagation();
    try {
      await discoveryApi.toggleFavorite(dealId);
      setFavorites((prev) => prev.filter((f) => (f._id || f.id) !== dealId));
      showToast("Deal removed from saved items");
    } catch (err) {
      console.error("Remove favorite error:", err);
      showToast("Failed to remove favorite");
    }
  };

  // Submit Review for redeemed voucher
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalVoucher) return;

    setReviewSubmitting(true);
    try {
      const deal = reviewModalVoucher.dealId || {};
      const businessId = deal.businessId?._id || deal.businessId || reviewModalVoucher.businessId;

      await discoveryApi.addReview({
        businessId,
        dealId: deal._id || reviewModalVoucher.dealId,
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      showToast("Thank you! Review submitted successfully.");
      setReviewModalVoucher(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error("Review submit error:", err);
      showToast(err.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Update Profile Name & Phone
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    try {
      await updateAuthProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim()
      });
      setIsEditingProfile(false);
      showToast("Profile details updated successfully!");
    } catch (err) {
      console.error("Update profile error:", err);
      showToast(err.message || "Failed to update profile");
    } finally {
      setProfileUpdating(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    setPasswordUpdating(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Security credentials updated!");
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password" });
    } finally {
      setPasswordUpdating(false);
    }
  };

  // Calculated Metrics
  const activeVouchers = useMemo(() => {
    return vouchers.filter(
      (v) => (v.status === "active" || v.status === "ACTIVE") && (!v.expiresAt || new Date(v.expiresAt) > new Date())
    );
  }, [vouchers]);

  const redeemedVouchers = useMemo(() => {
    return vouchers.filter((v) => v.status === "redeemed" || v.status === "REDEEMED");
  }, [vouchers]);

  const expiredVouchers = useMemo(() => {
    return vouchers.filter(
      (v) => v.status === "expired" || v.status === "EXPIRED" || (v.expiresAt && new Date(v.expiresAt) < new Date() && v.status !== "REDEEMED")
    );
  }, [vouchers]);

  // Total Lifetime Savings Calculated
  const totalSavingsLkr = useMemo(() => {
    return vouchers.reduce((acc, v) => {
      const deal = v.dealId;
      if (deal && deal.originalPrice && deal.discountedPrice) {
        return acc + (deal.originalPrice - deal.discountedPrice);
      }
      return acc;
    }, 0);
  }, [vouchers]);

  // Filtered Vouchers with Search
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const isAct = (v.status === "active" || v.status === "ACTIVE") && (!v.expiresAt || new Date(v.expiresAt) > new Date());
      const isRed = v.status === "redeemed" || v.status === "REDEEMED";
      const isExp = v.status === "expired" || v.status === "EXPIRED" || (v.expiresAt && new Date(v.expiresAt) < new Date() && !isRed);

      let matchesFilter = true;
      if (voucherFilter === "active") matchesFilter = isAct;
      else if (voucherFilter === "redeemed") matchesFilter = isRed;
      else if (voucherFilter === "expired") matchesFilter = isExp;

      const deal = v.dealId || {};
      const q = voucherSearch.trim().toLowerCase();
      const matchesSearch =
        q === ""
          ? true
          : (deal.title?.toLowerCase().includes(q) ||
            v.code?.toLowerCase().includes(q) ||
            deal.category?.toLowerCase().includes(q) ||
            deal.businessId?.name?.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [vouchers, voucherFilter, voucherSearch]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-9 w-9 animate-spin text-[#E8503A]" />
          <p className="text-xs font-bold text-gray-600 tracking-wider uppercase">Loading your shopper account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#1A1A1A] selection:bg-[#E8503A] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#111827] px-5 py-3 text-xs font-bold text-white shadow-2xl border border-white/10 animate-bounce">
          <Sparkles size={16} className="text-[#FFB703]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-gray-200/90 bg-white p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 mb-8 group">
            <span className="text-2xl font-black tracking-tight text-[#1A1A1A]">
              HitMe<span className="text-[#E8503A]">Up</span>
            </span>
            <span className="ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-[#E8503A] border border-orange-200/60">
              Shopper
            </span>
          </Link>

          <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-3 px-3">
            Navigation Menu
          </p>

          <nav className="space-y-1">
            <SidebarBtn
              icon={<Home size={18} />}
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <SidebarBtn
              icon={<Ticket size={18} />}
              label="My Vouchers & Passes"
              badge={vouchers.length > 0 ? vouchers.length : null}
              badgeColor="orange"
              active={activeTab === "vouchers"}
              onClick={() => setActiveTab("vouchers")}
            />
            <SidebarBtn
              icon={<Heart size={18} />}
              label="Saved Deals"
              badge={favorites.length > 0 ? favorites.length : null}
              badgeColor="rose"
              active={activeTab === "favorites"}
              onClick={() => setActiveTab("favorites")}
            />
            <SidebarBtn
              icon={<ShoppingBag size={18} />}
              label="Order History"
              badge={orders.length > 0 ? orders.length : null}
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
            />
            <SidebarBtn
              icon={<User size={18} />}
              label="Profile & Settings"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </nav>
        </div>

        {/* Bottom Explore Links */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <Link
            to="/category/all"
            className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#E8503A] rounded-xl hover:bg-orange-50/50 transition-colors"
          >
            <Compass size={16} className="text-[#E8503A]" />
            <span>Interactive Map Discovery</span>
          </Link>
          <Link
            to="/#deals"
            className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#E8503A] rounded-xl hover:bg-orange-50/50 transition-colors"
          >
            <Sparkles size={16} className="text-amber-500" />
            <span>Browse Flash Marketplace</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-gray-200/90 bg-white/95 px-6 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                {activeTab === "overview" && "Shopper Hub Overview"}
                {activeTab === "vouchers" && "Digital Passes & QR Vouchers"}
                {activeTab === "favorites" && "Saved Flash Promotions"}
                {activeTab === "orders" && "Order & Payment History"}
                {activeTab === "profile" && "Account Profile & Security"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Welcome back, <span className="font-bold text-gray-800">{user?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {totalSavingsLkr > 0 && (
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200">
                <Sparkles size={13} className="text-emerald-600" />
                <span>Rs. {totalSavingsLkr.toLocaleString()} Saved</span>
              </span>
            )}

            <button
              onClick={() => {
                fetchData();
                showToast("Account data refreshed!");
              }}
              disabled={loadingData}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Sync latest voucher status"
            >
              <RefreshCw size={13} className={loadingData ? "animate-spin text-[#E8503A]" : "text-gray-500"} />
              <span>{loadingData ? "Syncing..." : "Sync"}</span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF4A2F] to-[#E8503A] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user?.name?.[0] || "U"}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</div>
                <div className="text-[10px] uppercase font-semibold text-emerald-600">Verified Shopper</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Horizontal Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 py-2 gap-2 overflow-x-auto md:hidden">
          <MobileTabBtn label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <MobileTabBtn label={`Vouchers (${vouchers.length})`} active={activeTab === "vouchers"} onClick={() => setActiveTab("vouchers")} />
          <MobileTabBtn label={`Saved (${favorites.length})`} active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} />
          <MobileTabBtn label={`Orders (${orders.length})`} active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
          <MobileTabBtn label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        </div>

        {/* Content Body */}
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-7">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-7">
              {/* Hero Welcome Banner */}
              <div className="relative rounded-3xl bg-gradient-to-r from-[#172026] via-[#1E293B] to-[#0F172A] p-6 sm:p-8 text-white shadow-md overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 relative z-10 max-w-lg">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-bold text-[#FFD19A] border border-white/15 backdrop-blur-md">
                    <Sparkles size={12} />
                    <span>Real-Time Deal Passport</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Ready to claim flash savings, {user?.name}?
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
                    You have <strong className="text-emerald-400 font-bold">{activeVouchers.length} active digital passes</strong> ready to present at store counters.
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab("vouchers")}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4A2F] to-[#E8503A] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#E8503A]/25 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <QrCode size={16} />
                    <span>View Digital Passes</span>
                  </button>
                  <Link
                    to="/#deals"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white hover:bg-white/20 transition-all backdrop-blur-md"
                  >
                    <span>Browse Marketplace</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Subtle background circle glow */}
                <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-[#E8503A]/20 blur-3xl" />
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active Passes</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                      <Ticket size={16} />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-emerald-950">{activeVouchers.length}</p>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 mt-1">Ready for in-store redemption</p>
                </div>

                <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/60 to-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Saved Wishlist</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white shadow-xs">
                      <Heart size={16} />
                    </span>
                  </div>
                  <p className="text-3xl font-black text-rose-950">{favorites.length}</p>
                  <p className="text-[11px] text-rose-700/80 mt-1">Deals bookmarked for quick claim</p>
                </div>

                <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Total Savings</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                      <Tag size={16} />
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-950">
                    Rs. {totalSavingsLkr.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-amber-700/80 mt-1">Saved from flash discounts</p>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Orders Made</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <ShoppingBag size={16} />
                    </span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{orders.length}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Checkout & voucher receipts</p>
                </div>
              </div>

              {/* Active Passes Section */}
              <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">Your Active QR Passes</h3>
                    <p className="text-xs text-gray-500">Tap any pass to enlarge the QR code for the cashier</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("vouchers")}
                    className="text-xs font-bold text-[#E8503A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all ({vouchers.length})</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {activeVouchers.length === 0 ? (
                  <EmptyState
                    title="No active passes right now"
                    description="Claim limited-time flash deals to generate instant QR passes you can redeem at stores."
                    actionLabel="Discover Flash Deals"
                    actionHref="/#deals"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeVouchers.slice(0, 3).map((voucher) => (
                      <VoucherCard
                        key={voucher._id}
                        voucher={voucher}
                        onShowQR={() => setSelectedVoucherForQR(voucher)}
                        onCopyCode={handleCopyCode}
                        copiedCode={copiedCode}
                        onReview={(v) => setReviewModalVoucher(v)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Deals Quick Peek */}
              {favorites.length > 0 && (
                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Heart size={15} />
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-base">Bookmarked Deals</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("favorites")}
                      className="text-xs font-bold text-[#E8503A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Wishlist ({favorites.length})</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.slice(0, 3).map((deal) => (
                      <FavoriteCard
                        key={deal._id || deal.id}
                        deal={deal}
                        onRemove={handleRemoveFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY VOUCHERS & PASSES */}
          {activeTab === "vouchers" && (
            <div className="space-y-6">
              {/* Filter Tabs & Search Strip */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-2 bg-gray-100/90 p-1 rounded-2xl w-fit">
                  {[
                    { key: "all", label: "All Passes", count: vouchers.length },
                    { key: "active", label: "Active Passes", count: activeVouchers.length },
                    { key: "redeemed", label: "Redeemed", count: redeemedVouchers.length },
                    { key: "expired", label: "Expired", count: expiredVouchers.length }
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setVoucherFilter(f.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        voucherFilter === f.key
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          voucherFilter === f.key
                            ? "bg-[#E8503A]/10 text-[#E8503A]"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Voucher Search Bar */}
                <div className="relative flex items-center max-w-xs w-full">
                  <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search passes by title or code..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-8 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:outline-hidden shadow-2xs"
                  />
                  {voucherSearch && (
                    <button
                      onClick={() => setVoucherSearch("")}
                      className="absolute right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {filteredVouchers.length === 0 ? (
                <div className="rounded-3xl border border-gray-200/80 bg-white p-12 text-center shadow-xs space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A]">
                    <Ticket size={28} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    No {voucherFilter !== "all" ? voucherFilter : ""} vouchers found
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {voucherSearch
                      ? "No passes match your search query. Try clearing the search bar."
                      : voucherFilter === "active"
                      ? "You don't have any active unredeemed passes right now."
                      : "Claim vouchers on any flash promotion to unlock instant discounts."}
                  </p>
                  <Link
                    to="/#deals"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D43A26] transition shadow-xs mt-2"
                  >
                    <span>Browse Flash Marketplace</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredVouchers.map((voucher) => (
                    <VoucherCard
                      key={voucher._id}
                      voucher={voucher}
                      onShowQR={() => setSelectedVoucherForQR(voucher)}
                      onCopyCode={handleCopyCode}
                      copiedCode={copiedCode}
                      onReview={(v) => setReviewModalVoucher(v)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED WISHLIST */}
          {activeTab === "favorites" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Saved Wishlist Promotions</h3>
                  <p className="text-xs text-gray-500">Track and claim your bookmarked flash deals before they expire</p>
                </div>
                <Link
                  to="/#deals"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8503A] hover:underline"
                >
                  <Sparkles size={14} />
                  <span>Discover more deals &rarr;</span>
                </Link>
              </div>

              {favorites.length === 0 ? (
                <div className="rounded-3xl border border-gray-200/80 bg-white p-12 text-center shadow-xs space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                    <Heart size={28} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Your wishlist is empty</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Click the heart icon on any deal card to save it here for fast tracking and instant claiming!
                  </p>
                  <Link
                    to="/#deals"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D43A26] transition shadow-xs mt-2"
                  >
                    <span>Explore Flash Deals</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {favorites.map((deal) => (
                    <FavoriteCard
                      key={deal._id || deal.id}
                      deal={deal}
                      onRemove={handleRemoveFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === "orders" && (
            <div className="rounded-3xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Order Receipts & Checkout Records</h3>
                  <p className="text-xs text-gray-500">Official transaction receipts for all claimed flash promotions</p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No orders placed yet"
                    description="Your checkout and payment history will be safely tracked here."
                    actionLabel="View Live Deals"
                    actionHref="/#deals"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Order Number</th>
                        <th className="px-6 py-3.5">Amount</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">
                            {order.orderNumber || order._id}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-[#E8503A]">
                            Rs. {Number(order.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                order.status === "PAID" || order.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : order.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {order.status || "PAID"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE & SETTINGS */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Profile Details Card */}
              <div className="lg:col-span-7 rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Personal Information</h3>
                    <p className="text-xs text-gray-500">Manage your verified shopper credentials</p>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+94 77 123 4567"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Email (Cannot be modified)</label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="w-full rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-xs text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileUpdating}
                        className="rounded-xl bg-[#E8503A] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#D43A26] transition cursor-pointer disabled:opacity-50"
                      >
                        {profileUpdating ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Full Name
                      </label>
                      <p className="text-sm font-bold text-gray-900">{user?.name || "N/A"}</p>
                    </div>

                    <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Email Address
                      </label>
                      <p className="text-sm font-bold text-gray-900">{user?.email || "N/A"}</p>
                    </div>

                    <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Contact Phone
                      </label>
                      <p className="text-sm font-bold text-gray-900">{user?.phone || "+94 77 123 4567"}</p>
                    </div>

                    <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Account Role
                      </label>
                      <p className="text-sm font-bold uppercase text-[#E8503A]">{user?.role || "Customer"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Password & Security Card */}
              <div className="lg:col-span-5 rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-base font-extrabold text-gray-900">Change Password</h3>
                  <p className="text-xs text-gray-500">Ensure your shopper account remains secure</p>
                </div>

                {passwordMsg.text && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      passwordMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="w-full mt-2 rounded-xl bg-[#111827] py-2.5 text-xs font-bold text-white hover:bg-[#E8503A] transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {passwordUpdating ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FULLSCREEN DIGITAL QR PASS MODAL (FOR SELLER SCANNING AT POS) */}
      {selectedVoucherForQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedVoucherForQR(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#E8503A] uppercase tracking-wider">
                <QrCode size={13} />
                Digital QR Voucher Pass
              </span>
              <button
                onClick={() => setSelectedVoucherForQR(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Deal Info */}
            <div className="space-y-1">
              <span className="rounded-full bg-orange-100/70 px-2.5 py-0.5 text-[10px] font-extrabold text-[#E8503A] uppercase tracking-wide">
                {selectedVoucherForQR.dealId?.category || "Flash Deal"}
              </span>
              <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                {selectedVoucherForQR.dealId?.title || "Exclusive Flash Promotion"}
              </h3>
              {selectedVoucherForQR.dealId?.businessId?.name && (
                <p className="text-xs text-gray-500 font-medium">
                  {selectedVoucherForQR.dealId.businessId.name}
                </p>
              )}
            </div>

            {/* Large QR Code Display for Scanning */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/80 inline-block shadow-inner mx-auto">
              {selectedVoucherForQR.qrData ? (
                <img
                  src={selectedVoucherForQR.qrData}
                  alt={`QR code for ${selectedVoucherForQR.code}`}
                  className="h-44 w-44 mx-auto rounded-xl bg-white p-2 border border-gray-100 shadow-xs"
                />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center bg-gray-100 rounded-xl text-gray-400">
                  <QrCode size={48} />
                </div>
              )}
            </div>

            {/* Unique Code Copy Bar */}
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Unique Digital Voucher Code
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-black text-gray-900 tracking-wider bg-gray-100 px-3.5 py-1.5 rounded-xl border border-gray-200">
                  {selectedVoucherForQR.code}
                </span>
                <button
                  onClick={(e) => handleCopyCode(selectedVoucherForQR.code, e)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode === selectedVoucherForQR.code ? (
                    <Check size={18} className="text-emerald-600" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Status & Instructions */}
            <div className="pt-2 text-xs text-gray-500 leading-relaxed space-y-1">
              <span
                className={`inline-block mb-1.5 rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                  selectedVoucherForQR.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : selectedVoucherForQR.status === "REDEEMED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Status: {selectedVoucherForQR.status}
              </span>
              <p className="text-[11px]">
                Present this screen to the store staff at checkout. They will scan the QR code to apply your promotion.
              </p>
            </div>

            <button
              onClick={() => setSelectedVoucherForQR(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-[#E8503A] transition cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* REVIEW STORE MODAL (FOR REDEEMED VOUCHERS) */}
      {reviewModalVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setReviewModalVoucher(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Star size={18} className="fill-amber-400" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Review Store & Flash Deal</h3>
                  <p className="text-[11px] text-gray-500">Rate your in-store redemption experience</p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalVoucher(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">
                    {reviewRating === 5 && "Excellent! ⭐⭐⭐⭐⭐"}
                    {reviewRating === 4 && "Great! ⭐⭐⭐⭐"}
                    {reviewRating === 3 && "Average ⭐⭐⭐"}
                    {reviewRating === 2 && "Poor ⭐⭐"}
                    {reviewRating === 1 && "Terrible ⭐"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Review</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Share details of your experience with the staff, food/product, and voucher redemption..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalVoucher(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#D43A26] transition disabled:opacity-50 cursor-pointer"
                >
                  {reviewSubmitting ? "Submitting..." : "Post Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Individual Voucher Card
const VoucherCard = ({ voucher, onShowQR, onCopyCode, copiedCode, onReview }) => {
  const deal = voucher.dealId || {};
  const business = deal.businessId || {};
  const isActive = voucher.status === "ACTIVE" && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date());
  const isRedeemed = voucher.status === "REDEEMED";
  const isExpired = voucher.status === "EXPIRED" || (voucher.expiresAt && new Date(voucher.expiresAt) < new Date() && !isRedeemed);

  return (
    <div
      onClick={onShowQR}
      className="group rounded-3xl border border-gray-200/90 bg-white p-5 shadow-xs hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div className="space-y-3">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600 uppercase tracking-wide">
            {deal.category || "Flash Deal"}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border flex items-center gap-1 ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isRedeemed
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
            {voucher.status}
          </span>
        </div>

        {/* Title & Store */}
        <div>
          <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1 group-hover:text-[#E8503A] transition-colors">
            {deal.title || "Flash Promotion"}
          </h4>
          {business.name && (
            <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
              <Store size={12} className="text-[#E8503A]" />
              <span>{business.name}</span>
            </p>
          )}
        </div>

        {/* QR Thumbnail & Code Section */}
        <div className="p-3 rounded-2xl bg-gray-50/90 border border-gray-100 flex items-center gap-3">
          {voucher.qrData ? (
            <img
              src={voucher.qrData}
              alt="QR Code"
              className="h-14 w-14 rounded-lg bg-white p-1 border border-gray-200 shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
              <QrCode size={20} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Voucher Code
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-sm font-black text-gray-900 truncate">
                {voucher.code}
              </span>
              <button
                onClick={(e) => onCopyCode(voucher.code, e)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition cursor-pointer shrink-0"
                title="Copy Code"
              >
                {copiedCode === voucher.code ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Validity date & Status */}
        <div className="text-[11px] text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span>
              {voucher.expiresAt ? `Valid till: ${new Date(voucher.expiresAt).toLocaleDateString()}` : "Limited Time"}
            </span>
          </span>
          {isRedeemed && voucher.redeemedAt && (
            <span className="text-[10px] text-blue-600 font-bold">
              Redeemed
            </span>
          )}
        </div>
      </div>

      {/* Card Action */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={onShowQR}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#FAF8F5] text-gray-800 hover:bg-[#E8503A] hover:text-white transition-all cursor-pointer border border-gray-200/80 hover:border-[#E8503A]"
        >
          <QrCode size={13} />
          <span>Show QR Pass</span>
        </button>

        {isRedeemed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReview(voucher);
            }}
            className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
            title="Leave a Store Review"
          >
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>Review</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Sub-component: Favorite / Wishlist Deal Card
const FavoriteCard = ({ deal, onRemove }) => {
  const dealId = deal._id || deal.id;
  const business = deal.businessId || {};

  return (
    <div className="group rounded-3xl border border-gray-200/90 bg-white p-4 shadow-xs hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="relative h-36 w-full rounded-2xl overflow-hidden mb-3 bg-gray-100">
          <img
            src={deal.imageUrl || deal.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"}
            alt={deal.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2.5 right-2.5">
            <button
              onClick={(e) => onRemove(dealId, e)}
              className="h-8 w-8 rounded-full bg-white/90 text-rose-500 hover:bg-white hover:scale-110 flex items-center justify-center shadow-md backdrop-blur-xs transition cursor-pointer"
              title="Remove from saved"
            >
              <Heart size={15} className="fill-rose-500 text-rose-500" />
            </button>
          </div>
          <div className="absolute bottom-2.5 left-2.5">
            <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
              {deal.category || "Flash Deal"}
            </span>
          </div>
        </div>

        <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1">{deal.title}</h4>
        {business.name && (
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{business.name}</p>
        )}

        <div className="mt-2.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-400 line-through text-[11px] mr-1.5">
              Rs. {Number(deal.originalPrice || 0).toLocaleString()}
            </span>
            <span className="font-black text-[#E8503A] text-sm">
              Rs. {Number(deal.discountedPrice || 0).toLocaleString()}
            </span>
          </div>
          <span className="rounded-lg bg-[#E8503A]/10 px-2 py-0.5 text-[10px] font-black text-[#E8503A]">
            {deal.discountPercentage}% OFF
          </span>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-gray-100">
        <Link
          to={`/deals?deal=${dealId}`}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#111827] text-white hover:bg-[#E8503A] transition-all cursor-pointer shadow-xs"
        >
          <Ticket size={13} />
          <span>Claim Digital Voucher</span>
        </Link>
      </div>
    </div>
  );
};

const SidebarBtn = ({ icon, label, badge = null, badgeColor = "gray", active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      active
        ? "bg-[#E8503A]/10 text-[#E8503A]"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {badge !== null && (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
          active
            ? "bg-[#E8503A] text-white"
            : badgeColor === "rose"
            ? "bg-rose-100 text-rose-700"
            : badgeColor === "orange"
            ? "bg-orange-100 text-[#E8503A]"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        {badge}
      </span>
    )}
  </button>
);

const MobileTabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      active ? "bg-[#E8503A] text-white" : "bg-gray-100 text-gray-700"
    }`}
  >
    {label}
  </button>
);

const EmptyState = ({ title, description, actionLabel, actionHref }) => (
  <div className="text-center py-10 space-y-3">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A]">
      <Ticket size={24} />
    </div>
    <h4 className="text-sm font-bold text-gray-900">{title}</h4>
    <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
      {description}
    </p>
    <Link
      to={actionHref}
      className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-bold text-white hover:bg-[#D43A26] transition shadow-xs mt-2"
    >
      <span>{actionLabel}</span>
      <ArrowRight size={13} />
    </Link>
  </div>
);

export default CustomerDashboard;