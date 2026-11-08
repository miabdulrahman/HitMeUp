import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Ticket,
  User,
  LogOut,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  X,
  Clock,
  Store,
  Heart,
  Star,
  MapPin,
  Edit3,
  Search,
  Compass,
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";
import {
  voucherApi,
  orderApi,
  discoveryApi,
  authApi,
  dealApi,
  uploadApi,
} from "../../services/api";
import { convertToWebP } from "../../utils/imageOptimizer";
import AICommandCenter from "../../components/AICommandCenter";
import DealDetailModal from "../../components/DealDetailModal";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const {
    user,
    isAuthenticated,
    logout,
    updateProfile: updateAuthProfile,
    loading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All deals");

  const [vouchers, setVouchers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [marketplaceDeals, setMarketplaceDeals] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [voucherFilter, setVoucherFilter] = useState("all");
  const [voucherSearch, setVoucherSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedVoucherForQR, setSelectedVoucherForQR] = useState(null);
  const [selectedDealForModal, setSelectedDealForModal] = useState(null);

  const [reviewModalVoucher, setReviewModalVoucher] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    setErrorMsg("");

    try {
      const [vouchersRes, ordersRes, favRes, dealsRes] =
        await Promise.allSettled([
          voucherApi.getMyVouchers(),
          orderApi.getMyOrders(),
          discoveryApi.getMyFavorites
            ? discoveryApi.getMyFavorites()
            : Promise.resolve({ favorites: [] }),
          dealApi.getDeals
            ? dealApi.getDeals()
            : Promise.resolve({ deals: [] }),
        ]);

      if (vouchersRes.status === "fulfilled") {
        setVouchers(
          vouchersRes.value?.vouchers || vouchersRes.value?.data || []
        );
      }
      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value?.orders || ordersRes.value?.data || []);
      }
      if (favRes.status === "fulfilled") {
        setFavorites(favRes.value?.favorites || []);
      }
      if (dealsRes.status === "fulfilled") {
        setMarketplaceDeals(
          dealsRes.value?.deals || dealsRes.value?.data || []
        );
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setErrorMsg("Could not synchronize account data. Please try refreshing.");
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

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
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
    showToast("Voucher serial copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRemoveFavorite = async (dealId, e) => {
    e?.stopPropagation();
    try {
      await discoveryApi.toggleFavorite(dealId);
      setFavorites((prev) => prev.filter((f) => (f._id || f.id) !== dealId));
      showToast("Deal removed from saved list");
    } catch (err) {
      console.error("Remove favorite error:", err);
      showToast("Could not remove saved deal");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalVoucher) return;

    setReviewSubmitting(true);
    try {
      const deal = reviewModalVoucher.dealId || {};
      const businessId =
        deal.businessId?._id ||
        deal.businessId ||
        reviewModalVoucher.businessId;

      await discoveryApi.addReview({
        businessId,
        dealId: deal._id || reviewModalVoucher.dealId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      showToast("Your review has been submitted");
      setReviewModalVoucher(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error("Review submit error:", err);
      showToast(err.message || "Could not submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };


  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      setUploadStatus("Converting avatar to WebP...");
      const webpFile = await convertToWebP(file, { maxWidth: 512, maxHeight: 512, quality: 0.9 });
      setUploadStatus("Uploading to cloud...");
      const res = await uploadApi.uploadImage(webpFile, "customers/avatars");
      if (res?.url) {
        await updateAuthProfile({ avatar: res.url });
        showToast("Profile avatar converted to WebP and updated.");
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      showToast(err.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      setUploadStatus("");
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCoverUploading(true);
      setUploadStatus("Converting cover to WebP...");
      const webpFile = await convertToWebP(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 });
      setUploadStatus("Uploading to cloud...");
      const res = await uploadApi.uploadImage(webpFile, "customers/covers");
      if (res?.url) {
        await updateAuthProfile({ coverImage: res.url });
        showToast("Profile cover converted to WebP and updated.");
      }
    } catch (err) {
      console.error("Cover upload failed:", err);
      showToast(err.message || "Failed to upload cover banner");
    } finally {
      setCoverUploading(false);
      setUploadStatus("");
      e.target.value = "";
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    try {
      await updateAuthProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      setIsEditingProfile(false);
      showToast("Profile details updated");
    } catch (err) {
      console.error("Update profile error:", err);
      showToast(err.message || "Could not update profile");
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    setPasswordUpdating(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({
        type: "success",
        text: "Password updated",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password updated");
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordMsg({
        type: "error",
        text: err.message || "Could not change password",
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleOpenDealModal = (deal) => {
    if (!deal) return;
    const formatted = {
      ...deal,
      id: deal._id || deal.id,
      _id: deal._id || deal.id,
      title: deal.title,
      description: deal.description,
      business:
        typeof deal.business === "string"
          ? deal.business
          : deal.businessId?.name || deal.businessName || "Local merchant",
      businessId: deal.businessId,
      category: deal.category || "Flash deal",
      price:
        typeof deal.price === "string"
          ? deal.price
          : `Rs. ${Number(deal.discountedPrice || 0).toLocaleString()}`,
      rawPrice: deal.rawPrice ?? deal.discountedPrice,
      oldPrice:
        deal.oldPrice ||
        (deal.originalPrice
          ? `Rs. ${Number(deal.originalPrice).toLocaleString()}`
          : ""),
      rawOldPrice: deal.rawOldPrice ?? deal.originalPrice,
      discount:
        deal.discount ||
        (deal.discountPercentage ? `${deal.discountPercentage}% off` : ""),
      discountPercentage: deal.discountPercentage || 0,
      image:
        deal.image ||
        deal.imageUrl ||
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
      location:
        deal.location ||
        deal.businessId?.address?.city ||
        deal.businessId?.address?.street ||
        "Sri Lanka",
      availableQuantity: deal.availableQuantity,
      vouchersLeft: deal.availableQuantity,
    };
    setSelectedDealForModal(formatted);
  };

  const activeVouchers = useMemo(() => {
    return vouchers.filter(
      (v) =>
        (v.status === "active" || v.status === "ACTIVE") &&
        (!v.expiresAt || new Date(v.expiresAt) > new Date())
    );
  }, [vouchers]);

  const redeemedVouchers = useMemo(() => {
    return vouchers.filter(
      (v) => v.status === "redeemed" || v.status === "REDEEMED"
    );
  }, [vouchers]);

  const expiredVouchers = useMemo(() => {
    return vouchers.filter(
      (v) =>
        v.status === "expired" ||
        v.status === "EXPIRED" ||
        (v.expiresAt &&
          new Date(v.expiresAt) < new Date() &&
          v.status !== "REDEEMED")
    );
  }, [vouchers]);

  const totalSavingsLkr = useMemo(() => {
    return vouchers.reduce((acc, v) => {
      const deal = v.dealId;
      if (deal && deal.originalPrice && deal.discountedPrice) {
        return acc + (deal.originalPrice - deal.discountedPrice);
      }
      return acc;
    }, 0);
  }, [vouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const isAct =
        (v.status === "active" || v.status === "ACTIVE") &&
        (!v.expiresAt || new Date(v.expiresAt) > new Date());
      const isRed = v.status === "redeemed" || v.status === "REDEEMED";
      const isExp =
        v.status === "expired" ||
        v.status === "EXPIRED" ||
        (v.expiresAt && new Date(v.expiresAt) < new Date() && !isRed);

      let matchesFilter = true;
      if (voucherFilter === "active") matchesFilter = isAct;
      else if (voucherFilter === "redeemed") matchesFilter = isRed;
      else if (voucherFilter === "expired") matchesFilter = isExp;

      const deal = v.dealId || {};
      const q = (voucherSearch || dashboardSearch).trim().toLowerCase();
      const matchesSearch =
        q === ""
          ? true
          : deal.title?.toLowerCase().includes(q) ||
            v.code?.toLowerCase().includes(q) ||
            deal.category?.toLowerCase().includes(q) ||
            deal.businessId?.name?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [vouchers, voucherFilter, voucherSearch, dashboardSearch]);

  const filteredMarketplaceDeals = useMemo(() => {
    const q = dashboardSearch.trim().toLowerCase();
    return marketplaceDeals.filter((deal) => {
      const cat = String(deal.category || "").toLowerCase();
      let matchesCat = true;
      if (selectedCategory === "Food & dining") {
        matchesCat =
          cat.includes("food") ||
          cat.includes("restaurant") ||
          cat.includes("cafe") ||
          cat.includes("dining");
      } else if (selectedCategory === "Beauty") {
        matchesCat =
          cat.includes("beauty") ||
          cat.includes("salon") ||
          cat.includes("spa") ||
          cat.includes("health");
      } else if (selectedCategory === "Fashion") {
        matchesCat =
          cat.includes("fashion") ||
          cat.includes("retail") ||
          cat.includes("clothing");
      } else if (selectedCategory === "Services") {
        matchesCat =
          cat.includes("service") ||
          cat.includes("fitness") ||
          cat.includes("entertainment") ||
          cat.includes("other");
      }

      const matchesSearch =
        q === "" ||
        deal.title?.toLowerCase().includes(q) ||
        deal.description?.toLowerCase().includes(q) ||
        deal.category?.toLowerCase().includes(q) ||
        deal.businessId?.name?.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [marketplaceDeals, selectedCategory, dashboardSearch]);

  const aiDealsPool = useMemo(() => {
    const favDeals = favorites.map((favorite) => favorite.deal || favorite);
    const combined = [...favDeals, ...marketplaceDeals];
    const seen = new Set();
    return combined.filter((d) => {
      const id = String(d?._id || d?.id || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [favorites, marketplaceDeals]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-2.5">
          <RefreshCw
            size={20}
            strokeWidth={1.5}
            className="animate-spin text-[#525252]"
          />
          <p className="text-[13px] text-[#737373]">Loading account...</p>
        </div>
      </div>
    );
  }

  const sectionTitles = {
    overview: "Overview",
    vouchers: "Voucher passes",
    favorites: "Saved deals",
    orders: "Order history",
    profile: "Account settings",
    ai: "Deal assistant",
  };

  return (
    <div className="dashboard-page dashboard-customer flex min-h-screen bg-[#FAFAFA] text-[#171717]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[#E4E4E7] bg-[#171717] px-4 py-2.5 text-[13px] font-medium text-white shadow-md">
          <Check size={14} strokeWidth={1.5} className="text-[#166534]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Left Sidebar (240px aligned navigation) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-[#E4E4E7] bg-[#F4F4F5] p-4 md:flex overflow-y-auto">
        <div>
          {/* Brand header */}
          <div className="mb-6 flex items-center justify-between px-2 pt-1">
            <Link to="/" className="inline-flex items-center" aria-label="HitMeUp Home">
              <img
                src={isDark ? "/logo-dark.png" : "/logo.png"}
                alt="HitMeUp"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="rounded-[5px] border border-[#E4E4E7] bg-white px-1.5 py-0.5 text-[11px] text-[#525252]">
              Shopper
            </span>
          </div>

          <p className="mb-2 px-2 text-[11px] font-medium text-[#737373]">
            Workspace
          </p>

          <nav className="flex flex-col gap-1">
            <SidebarBtn
              icon={<Home size={16} strokeWidth={1.5} />}
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <SidebarBtn
              icon={<Ticket size={16} strokeWidth={1.5} />}
              label="Voucher passes"
              badge={vouchers.length > 0 ? vouchers.length : null}
              active={activeTab === "vouchers"}
              onClick={() => setActiveTab("vouchers")}
            />
            <SidebarBtn
              icon={<Heart size={16} strokeWidth={1.5} />}
              label="Saved deals"
              badge={favorites.length > 0 ? favorites.length : null}
              active={activeTab === "favorites"}
              onClick={() => setActiveTab("favorites")}
            />
            <SidebarBtn
              icon={<ShoppingBag size={16} strokeWidth={1.5} />}
              label="Order history"
              badge={orders.length > 0 ? orders.length : null}
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
            />
            <SidebarBtn
              icon={<Compass size={16} strokeWidth={1.5} />}
              label="Deal assistant"
              active={activeTab === "ai"}
              onClick={() => setActiveTab("ai")}
            />
            <SidebarBtn
              icon={<User size={16} strokeWidth={1.5} />}
              label="Account settings"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </nav>

          <p className="mt-6 mb-2 px-2 text-[11px] font-medium text-[#737373]">
            Marketplace
          </p>
          <div className="flex flex-col gap-1">
            <Link
              to="/deals"
              className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-[#525252] transition-colors hover:bg-[#E4E4E7]/60 hover:text-[#171717]"
            >
              <MapPin size={16} strokeWidth={1.5} className="text-[#737373]" />
              <span>Street map &amp; deals</span>
            </Link>
            <Link
              to="/categories"
              className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-[#525252] transition-colors hover:bg-[#E4E4E7]/60 hover:text-[#171717]"
            >
              <Store size={16} strokeWidth={1.5} className="text-[#737373]" />
              <span>Browse categories</span>
            </Link>
          </div>
        </div>

        {/* Account footer */}
        <div className="border-t border-[#E4E4E7] pt-3">
          <div className="mb-2 flex items-center gap-2.5 px-2">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || "User"}
                className="h-8 w-8 shrink-0 rounded-lg object-cover border border-[#E4E4E7]"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E4E4E7] bg-white font-mono text-[12px] font-medium text-[#171717]">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#171717]">
                {user?.name}
              </p>
              <p className="truncate text-[11px] text-[#737373]">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-[#525252] transition-colors hover:bg-[#B91C1C]/10 hover:text-[#B91C1C] cursor-pointer"
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Single Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E4E4E7] bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center md:hidden" aria-label="HitMeUp Home">
              <img
                src={isDark ? "/logo-dark.png" : "/logo.png"}
                alt="HitMeUp"
                className="h-6.5 w-auto object-contain"
              />
            </Link>
            <h1 className="text-[16px] sm:text-[18px] font-medium tracking-[-0.02em] text-[#171717]">
              {sectionTitles[activeTab]}
            </h1>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 max-w-xl">
            <div className="relative hidden flex-1 sm:block max-w-xs">
              <Search
                size={15}
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"
              />
              <input
                value={dashboardSearch}
                onChange={(event) => {
                  setDashboardSearch(event.target.value);
                  if (activeTab !== "overview" && activeTab !== "vouchers") {
                    setActiveTab("overview");
                  }
                }}
                placeholder="Filter passes or deals..."
                aria-label="Filter passes or deals"
                className="h-9 w-full rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] pl-9 pr-8 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#171717] focus:bg-white focus:outline-none"
              />
              {dashboardSearch && (
                <button
                  type="button"
                  onClick={() => setDashboardSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                fetchData();
                showToast("Account data synced");
              }}
              disabled={loadingData}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] font-medium text-[#171717] transition-colors hover:bg-[#F4F4F5] disabled:opacity-50 cursor-pointer"
              title="Refresh passes"
            >
              <RefreshCw
                size={14}
                strokeWidth={1.5}
                className={loadingData ? "animate-spin text-[#D94832]" : "text-[#737373]"}
              />
              <span className="hidden sm:inline">
                {loadingData ? "Syncing..." : "Sync"}
              </span>
            </button>

            <Link
              to="/deals"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D94832] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#C23B26]"
            >
              <span>Browse deals</span>
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-[12px] font-medium text-[#B91C1C] hover:bg-[#B91C1C]/10 transition-colors cursor-pointer shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Tabs */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-[#E4E4E7] bg-white px-4 py-2 md:hidden">
          <MobileTabBtn
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <MobileTabBtn
            label={`Passes (${vouchers.length})`}
            active={activeTab === "vouchers"}
            onClick={() => setActiveTab("vouchers")}
          />
          <MobileTabBtn
            label={`Saved (${favorites.length})`}
            active={activeTab === "favorites"}
            onClick={() => setActiveTab("favorites")}
          />
          <MobileTabBtn
            label={`Orders (${orders.length})`}
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <MobileTabBtn
            label="Assistant"
            active={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />
          <MobileTabBtn
            label="Settings"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#B91C1C] hover:bg-[#B91C1C]/10 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut size={13} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>

        {/* Content Body */}
        <main className="mx-auto w-full max-w-[1320px] flex-1 space-y-6 p-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-[#B45309]/30 bg-[#B45309]/5 p-3.5 text-[13px] text-[#B45309]">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Numbers-Only Stat Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab("vouchers")}
                  className="rounded-xl border border-[#E4E4E7] bg-white p-5 transition-colors hover:border-[#171717]/30 cursor-pointer"
                >
                  <span className="text-[12px] font-medium text-[#525252]">
                    Active passes
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="font-mono text-[28px] font-medium leading-none text-[#171717] tabular-nums">
                      {activeVouchers.length}
                    </p>
                    {activeVouchers.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#166534]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#166534]" />
                        Ready
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[12px] text-[#525252]">
                    Available for counter redemption
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("favorites")}
                  className="rounded-xl border border-[#E4E4E7] bg-white p-5 transition-colors hover:border-[#171717]/30 cursor-pointer"
                >
                  <span className="text-[12px] font-medium text-[#525252]">Saved deals</span>
                  <p className="mt-2 font-mono text-[28px] font-medium leading-none text-[#171717] tabular-nums">
                    {favorites.length}
                  </p>
                  <p className="mt-2 text-[12px] text-[#525252]">
                    Bookmarked offers
                  </p>
                </div>

                <div className="rounded-xl border border-[#E4E4E7] bg-white p-5">
                  <span className="text-[12px] font-medium text-[#525252]">
                    Calculated savings
                  </span>
                  <p className="mt-2 font-mono text-[28px] font-medium leading-none text-[#171717] tabular-nums">
                    Rs. {totalSavingsLkr.toLocaleString()}
                  </p>
                  <p className="mt-2 text-[12px] text-[#525252]">
                    Across claimed passes
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("orders")}
                  className="rounded-xl border border-[#E4E4E7] bg-white p-5 transition-colors hover:border-[#171717]/30 cursor-pointer"
                >
                  <span className="text-[12px] font-medium text-[#525252]">
                    Orders &amp; claims
                  </span>
                  <p className="mt-2 font-mono text-[28px] font-medium leading-none text-[#171717] tabular-nums">
                    {orders.length}
                  </p>
                  <p className="mt-2 text-[12px] text-[#525252]">
                    Recorded transactions
                  </p>
                </div>
              </div>

              {/* Active Passes Section */}
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-6">
                <div className="mb-5 flex items-center justify-between border-b border-[#E4E4E7] pb-4">
                  <div>
                    <h2 className="text-[16px] font-medium text-[#171717]">
                      Active QR counter passes
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[#525252]">
                      Select any pass to open the scannable QR code for the
                      cashier
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("vouchers")}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-[#525252] hover:text-[#171717] cursor-pointer"
                  >
                    <span>All passes ({vouchers.length})</span>
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                </div>

                {activeVouchers.length === 0 ? (
                  <EmptyState
                    title="No active voucher passes"
                    description="Claim a nearby flash deal to generate a QR counter pass."
                    actionLabel="Browse nearby deals"
                    actionHref="/deals"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

              {/* Live Marketplace Feed with Category Filter */}
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-6">
                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-[#E4E4E7] pb-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-[16px] font-medium text-[#171717]">
                      {selectedCategory === "All deals"
                        ? "Available marketplace deals"
                        : `${selectedCategory}`}
                      {dashboardSearch.trim()
                        ? ` matching "${dashboardSearch}"`
                        : ""}
                    </h2>
                    <p className="mt-0.5 font-mono text-[12px] font-medium text-[#525252] tabular-nums">
                      {filteredMarketplaceDeals.length} active offer
                      {filteredMarketplaceDeals.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      "All deals",
                      "Food & dining",
                      "Beauty",
                      "Fashion",
                      "Services",
                    ].map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`h-8 whitespace-nowrap rounded-lg px-3 text-[12px] font-medium transition-colors cursor-pointer ${
                          selectedCategory === category
                            ? "bg-[#171717] text-white"
                            : "border border-[#E4E4E7] bg-[#FAFAFA] text-[#525252] hover:text-[#171717]"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredMarketplaceDeals.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[13px] text-[#525252]">
                      No deals matched {selectedCategory}
                      {dashboardSearch ? ` for "${dashboardSearch}"` : ""}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("All deals");
                        setDashboardSearch("");
                      }}
                      className="mt-2 text-[12px] font-medium text-[#D94832] hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMarketplaceDeals.slice(0, 6).map((deal) => (
                      <FavoriteCard
                        key={deal._id || deal.id}
                        deal={deal}
                        onRemove={null}
                        onSelect={handleOpenDealModal}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VOUCHER PASSES */}
          {activeTab === "vouchers" && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex w-fit items-center gap-1 rounded-lg border border-[#E4E4E7] bg-white p-1">
                  {[
                    { key: "all", label: "All passes", count: vouchers.length },
                    {
                      key: "active",
                      label: "Active",
                      count: activeVouchers.length,
                    },
                    {
                      key: "redeemed",
                      label: "Redeemed",
                      count: redeemedVouchers.length,
                    },
                    {
                      key: "expired",
                      label: "Expired",
                      count: expiredVouchers.length,
                    },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setVoucherFilter(f.key)}
                      className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors cursor-pointer ${
                        voucherFilter === f.key
                          ? "bg-[#171717] text-white"
                          : "text-[#525252] hover:text-[#171717]"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                          voucherFilter === f.key
                            ? "bg-white/15 text-white"
                            : "bg-[#F4F4F5] text-[#737373]"
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative flex w-full max-w-xs items-center">
                  <Search
                    size={14}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-3 text-[#737373]"
                  />
                  <input
                    type="text"
                    placeholder="Search passes by title or serial..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E4E4E7] bg-white pl-9 pr-8 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#171717] focus:outline-none"
                  />
                  {voucherSearch && (
                    <button
                      onClick={() => setVoucherSearch("")}
                      className="absolute right-2.5 text-[#737373] hover:text-[#171717] cursor-pointer"
                    >
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>

              {filteredVouchers.length === 0 ? (
                <div className="rounded-xl border border-[#E4E4E7] bg-white p-12 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] text-[#525252]">
                    <Ticket size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[15px] font-medium text-[#171717]">
                    No {voucherFilter !== "all" ? voucherFilter : ""} voucher
                    passes found
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#737373]">
                    {voucherSearch
                      ? "No passes matched your search query."
                      : "Claim a nearby flash deal to generate a digital QR pass."}
                  </p>
                  <Link
                    to="/deals"
                    className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D94832] px-4 text-[13px] font-medium text-white hover:bg-[#C23B26]"
                  >
                    <span>Browse deals</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          {/* TAB 3: SAVED DEALS */}
          {activeTab === "favorites" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-medium text-[#171717]">
                    Saved deals
                  </h2>
                  <p className="text-[13px] text-[#737373]">
                    Bookmarked offers you can claim before their batch timer
                    ends
                  </p>
                </div>
                <Link
                  to="/deals"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-[#D94832] hover:underline"
                >
                  <span>Explore deals</span>
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>

              {favorites.length === 0 ? (
                <div className="rounded-xl border border-[#E4E4E7] bg-white p-12 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] text-[#525252]">
                    <Heart size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[15px] font-medium text-[#171717]">
                    No saved deals yet
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#737373]">
                    Select the heart button on any deal card to bookmark it
                    here.
                  </p>
                  <Link
                    to="/deals"
                    className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D94832] px-4 text-[13px] font-medium text-white hover:bg-[#C23B26]"
                  >
                    <span>Browse deals</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.map((deal) => (
                    <FavoriteCard
                      key={deal._id || deal.id}
                      deal={deal}
                      onRemove={handleRemoveFavorite}
                      onSelect={handleOpenDealModal}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === "orders" && (
            <div className="overflow-hidden rounded-xl border border-[#E4E4E7] bg-white">
              <div className="border-b border-[#E4E4E7] p-5">
                <h2 className="text-[16px] font-medium text-[#171717]">
                  Order &amp; claim history
                </h2>
                <p className="mt-0.5 text-[13px] text-[#737373]">
                  Transaction records for all claimed passes and checkouts
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No orders recorded yet"
                    description="Your checkout and voucher claim records will appear here."
                    actionLabel="Browse deals"
                    actionHref="/deals"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b border-[#E4E4E7] bg-[#FAFAFA] text-[12px] font-medium text-[#737373]">
                      <tr>
                        <th className="px-5 py-3 font-medium">Reference</th>
                        <th className="px-5 py-3 font-medium">Deal</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E4E7] text-[#171717]">
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          className="transition-colors hover:bg-[#FAFAFA]"
                        >
                          <td className="px-5 py-3.5 font-mono text-[12px] text-[#525252]">
                            {order.orderNumber || order._id}
                          </td>
                          <td className="px-5 py-3.5 font-medium">
                            {order.dealId?.title || "Flash deal pass"}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-medium tabular-nums">
                            Rs. {Number(order.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-[5px] px-2 py-0.5 font-mono text-[11px] font-medium ${
                                order.status === "PAID" ||
                                order.status === "COMPLETED"
                                  ? "bg-[#166534]/10 text-[#166534]"
                                  : order.status === "PENDING"
                                  ? "bg-[#B45309]/10 text-[#B45309]"
                                  : "bg-[#B91C1C]/10 text-[#B91C1C]"
                              }`}
                            >
                              {order.status || "PAID"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[12px] text-[#737373] tabular-nums">
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Profile Cover & Avatar Header */}
              <div className="overflow-hidden rounded-xl border border-[#E4E4E7] bg-white lg:col-span-12">
                {/* Cover Banner */}
                <div className="relative h-44 w-full sm:h-52 bg-gradient-to-r from-[#2A2521] via-[#1E1B18] to-[#141210]">
                  {user?.coverImage ? (
                    <img
                      src={user.coverImage}
                      alt="Profile cover banner"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center opacity-25">
                      <ImageIcon className="h-12 w-12 text-white" strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Change Cover Button */}
                  <label className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur transition-colors hover:bg-black/80 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={coverUploading}
                      className="hidden"
                    />
                    <Camera size={13} strokeWidth={1.5} />
                    <span>{coverUploading ? uploadStatus || "Converting to WebP..." : "Change cover"}</span>
                  </label>
                </div>

                {/* Profile Identity Bar */}
                <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-end">
                  <div className="flex items-end gap-4">
                    {/* Floating Avatar with Camera Badge */}
                    <div className="relative -mt-14 h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-white shadow-md">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name || "User"}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#171717] font-mono text-[22px] font-semibold text-white">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <label className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#D94832] text-white shadow-sm hover:bg-[#C23B26] cursor-pointer" title="Update profile photo">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={avatarUploading}
                          className="hidden"
                        />
                        <Camera size={13} strokeWidth={2} />
                      </label>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-[20px] font-semibold tracking-tight text-[#171717]">
                          {user?.name || "Shopper"}
                        </h1>
                        <span className="rounded border border-[#E4E4E7] bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-medium capitalize text-[#525252]">
                          {user?.role || "Customer"}
                        </span>
                        <span className="rounded border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 font-mono text-[11px] text-[#16A34A]">
                          WebP optimized
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-[#737373]">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[12px] text-[#737373]">
                    <span>Images auto-converted to WebP before upload</span>
                  </div>
                </div>
              </div>
              <div className="space-y-5 rounded-xl border border-[#E4E4E7] bg-white p-6 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
                  <div>
                    <h2 className="text-[16px] font-medium text-[#171717]">
                      Personal details
                    </h2>
                    <p className="text-[13px] text-[#737373]">
                      Manage your shopper contact details
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[12px] font-medium text-[#171717] hover:bg-[#F4F4F5] cursor-pointer"
                  >
                    <Edit3 size={13} strokeWidth={1.5} />
                    <span>{isEditingProfile ? "Cancel" : "Edit"}</span>
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#525252]">
                        Full name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] focus:border-[#D94832] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#525252]">
                        Phone number
                      </label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+94 77 123 4567"
                        className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] focus:border-[#D94832] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#737373]">
                        Email address (read-only)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-[#F4F4F5] px-3 text-[13px] text-[#737373] cursor-not-allowed"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="h-9 px-3 text-[13px] font-medium text-[#525252] hover:text-[#171717] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileUpdating}
                        className="h-9 rounded-lg bg-[#D94832] px-4 text-[13px] font-medium text-white hover:bg-[#C23B26] disabled:opacity-50 cursor-pointer"
                      >
                        {profileUpdating ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                      <span className="block text-[11px] text-[#737373]">
                        Full name
                      </span>
                      <p className="mt-1 text-[14px] font-medium text-[#171717]">
                        {user?.name || "—"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                      <span className="block text-[11px] text-[#737373]">
                        Email address
                      </span>
                      <p className="mt-1 text-[14px] font-medium text-[#171717]">
                        {user?.email || "—"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                      <span className="block text-[11px] text-[#737373]">
                        Contact phone
                      </span>
                      <p className="mt-1 font-mono text-[13px] text-[#171717]">
                        {user?.phone || "Not set"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                      <span className="block text-[11px] text-[#737373]">
                        Account role
                      </span>
                      <p className="mt-1 text-[14px] font-medium capitalize text-[#171717]">
                        {user?.role || "Customer"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Card */}
              <div className="space-y-4 rounded-xl border border-[#E4E4E7] bg-white p-6 lg:col-span-5">
                <div className="border-b border-[#E4E4E7] pb-4">
                  <h2 className="text-[16px] font-medium text-[#171717]">
                    Change password
                  </h2>
                  <p className="text-[13px] text-[#737373]">
                    Update your login credentials
                  </p>
                </div>

                {passwordMsg.text && (
                  <div
                    className={`rounded-lg border p-3 text-[13px] ${
                      passwordMsg.type === "success"
                        ? "border-[#166534]/25 bg-[#166534]/5 text-[#166534]"
                        : "border-[#B91C1C]/25 bg-[#B91C1C]/5 text-[#B91C1C]"
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-[#525252]">
                      Current password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] focus:border-[#D94832] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-[#525252]">
                      New password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="At least 6 characters"
                      className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] focus:border-[#D94832] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-[#525252]">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] focus:border-[#D94832] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="mt-2 h-10 w-full rounded-lg bg-[#171717] text-[13px] font-medium text-white transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
                  >
                    {passwordUpdating ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>

              {/* Account Session & Logout */}
              <div className="overflow-hidden rounded-xl border border-[#E4E4E7] bg-white p-5 lg:col-span-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#171717]">Account session</h3>
                    <p className="mt-0.5 text-[13px] text-[#737373]">Signed in as {user?.email} ({user?.role || "customer"})</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/10 px-4 text-[13px] font-medium text-[#B91C1C] hover:bg-[#B91C1C]/15 transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <LogOut size={15} strokeWidth={1.75} />
                    <span>Sign out of HitMeUp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DEAL ASSISTANT */}
          {activeTab === "ai" && (
            <AICommandCenter
              mode="customer"
              deals={aiDealsPool}
              user={user}
              onSelectRecommendedDeal={(deal) => {
                const id = deal._id || deal.dealId || deal.id;
                if (id) {
                  navigate(`/deals?deal=${id}`);
                } else {
                  navigate("/deals");
                }
              }}
            />
          )}
        </main>
      </div>

      {/* FULLSCREEN DIGITAL QR PASS MODAL */}
      {selectedVoucherForQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedVoucherForQR(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-[#E4E4E7] bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3.5">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#525252]">
                <QrCode size={14} strokeWidth={1.5} className="text-[#D94832]" />
                <span>Counter voucher pass</span>
              </span>
              <button
                onClick={() => setSelectedVoucherForQR(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#737373] hover:bg-[#F4F4F5] hover:text-[#171717] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <span className="inline-block rounded-md bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-medium text-[#525252]">
                {selectedVoucherForQR.dealId?.category || "Flash deal"}
              </span>
              <h3 className="text-[16px] font-medium text-[#171717]">
                {selectedVoucherForQR.dealId?.title || "Store voucher pass"}
              </h3>
              {selectedVoucherForQR.dealId?.businessId?.name && (
                <p className="text-[12px] text-[#737373]">
                  {selectedVoucherForQR.dealId.businessId.name}
                </p>
              )}
            </div>

            <div className="my-5 inline-block rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4">
              {selectedVoucherForQR.qrData ? (
                <img
                  src={selectedVoucherForQR.qrData}
                  alt={`QR code for ${selectedVoucherForQR.code}`}
                  className="mx-auto h-44 w-44 rounded-lg border border-[#E4E4E7] bg-white p-2"
                />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center rounded-lg bg-[#F4F4F5] text-[#737373]">
                  <QrCode size={44} strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="ticket-divider-app my-4" />

            <div>
              <span className="mb-1 block text-[11px] text-[#737373]">
                Voucher serial code
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 py-1.5 font-mono text-[18px] font-medium text-[#171717]">
                  {selectedVoucherForQR.code}
                </span>
                <button
                  onClick={(e) => handleCopyCode(selectedVoucherForQR.code, e)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4E4E7] bg-white text-[#525252] hover:bg-[#F4F4F5] cursor-pointer"
                  title="Copy serial code"
                >
                  {copiedCode === selectedVoucherForQR.code ? (
                    <Check size={16} strokeWidth={1.5} className="text-[#166534]" />
                  ) : (
                    <Copy size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-1 text-[12px] text-[#737373]">
              <span
                className={`inline-block rounded-[5px] px-2.5 py-0.5 font-mono text-[11px] font-medium ${
                  selectedVoucherForQR.status === "ACTIVE"
                    ? "bg-[#166534]/10 text-[#166534]"
                    : "bg-[#F4F4F5] text-[#525252]"
                }`}
              >
                Status: {selectedVoucherForQR.status}
              </span>
              <p className="pt-1">
                Show this pass to the cashier at checkout to apply your discount.
              </p>
            </div>

            <button
              onClick={() => setSelectedVoucherForQR(null)}
              className="mt-5 h-10 w-full rounded-lg bg-[#171717] text-[13px] font-medium text-white hover:bg-[#D94832] cursor-pointer"
            >
              Close pass
            </button>
          </div>
        </div>
      )}

      {/* REVIEW STORE MODAL */}
      {reviewModalVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setReviewModalVoucher(null)}
        >
          <div
            className="relative w-full max-w-md space-y-4 rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3.5">
              <div>
                <h3 className="text-[15px] font-medium text-[#171717]">
                  Review store &amp; deal
                </h3>
                <p className="text-[12px] text-[#737373]">
                  Share your counter redemption experience
                </p>
              </div>
              <button
                onClick={() => setReviewModalVoucher(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#737373] hover:bg-[#F4F4F5] hover:text-[#171717] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#525252]">
                  Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        size={22}
                        strokeWidth={1.5}
                        className={
                          star <= reviewRating
                            ? "fill-[#B45309] text-[#B45309]"
                            : "text-[#D4D4D8]"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-mono text-[12px] text-[#525252] tabular-nums">
                    {reviewRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#525252]">
                  Comment
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="How was the item and counter redemption?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3 text-[13px] text-[#171717] focus:border-[#D94832] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalVoucher(null)}
                  className="h-9 px-3 text-[13px] font-medium text-[#525252] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="h-9 rounded-lg bg-[#D94832] px-4 text-[13px] font-medium text-white hover:bg-[#C23B26] disabled:opacity-50 cursor-pointer"
                >
                  {reviewSubmitting ? "Submitting..." : "Post review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Detail & Claim Pass Modal */}
      <DealDetailModal
        deal={selectedDealForModal}
        isOpen={Boolean(selectedDealForModal)}
        onClose={() => {
          setSelectedDealForModal(null);
          // Refresh customer vouchers so newly claimed passes show up immediately
          fetchData();
        }}
      />
    </div>
  );
};

// Sub-component: Perforated Voucher Pass Card
const VoucherCard = ({
  voucher,
  onShowQR,
  onCopyCode,
  copiedCode,
  onReview,
}) => {
  const deal = voucher.dealId || {};
  const business = deal.businessId || {};
  const isActive =
    voucher.status === "ACTIVE" &&
    (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date());
  const isRedeemed = voucher.status === "REDEEMED";

  return (
    <div
      onClick={onShowQR}
      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[#E4E4E7] bg-white p-5 transition-colors duration-150 hover:border-[#171717]/30 cursor-pointer"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-medium text-[#525252]">
            {deal.category || "Flash deal"}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 font-mono text-[11px] font-medium ${
              isActive
                ? "bg-[#166534]/10 text-[#166534]"
                : isRedeemed
                ? "bg-[#F4F4F5] text-[#525252]"
                : "bg-[#F4F4F5] text-[#737373]"
            }`}
          >
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#166534]" />
            )}
            {voucher.status}
          </span>
        </div>

        <div>
          <h4 className="line-clamp-1 text-[15px] font-medium text-[#171717] group-hover:text-[#D94832]">
            {deal.title || "Store promotion"}
          </h4>
          {business.name && (
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#737373]">
              <Store size={12} strokeWidth={1.5} />
              <span>{business.name}</span>
            </p>
          )}
        </div>

        <div className="ticket-divider-app my-3" />

        <div className="flex items-center gap-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-2.5">
          {voucher.qrData ? (
            <img
              src={voucher.qrData}
              alt="QR Code"
              className="h-12 w-12 shrink-0 rounded-md border border-[#E4E4E7] bg-white p-1"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#F4F4F5] text-[#737373]">
              <QrCode size={18} strokeWidth={1.5} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <span className="block text-[10px] text-[#737373]">
              Serial code
            </span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="truncate font-mono text-[13px] font-medium text-[#171717]">
                {voucher.code}
              </span>
              <button
                onClick={(e) => onCopyCode(voucher.code, e)}
                className="shrink-0 rounded p-1 text-[#737373] hover:bg-[#E4E4E7] hover:text-[#171717] cursor-pointer"
                title="Copy serial"
              >
                {copiedCode === voucher.code ? (
                  <Check size={13} strokeWidth={1.5} className="text-[#166534]" />
                ) : (
                  <Copy size={13} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#737373]">
          <span className="flex items-center gap-1 font-mono tabular-nums">
            <Clock size={11} strokeWidth={1.5} />
            <span>
              {voucher.expiresAt
                ? `Valid until ${new Date(voucher.expiresAt).toLocaleDateString()}`
                : "Active window"}
            </span>
          </span>
          {isRedeemed && voucher.redeemedAt && (
            <span className="font-medium text-[#525252]">Redeemed</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-[#E4E4E7] pt-3">
        <button
          onClick={onShowQR}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 text-[12px] font-medium text-[#171717] transition-colors group-hover:border-[#171717] group-hover:bg-[#171717] group-hover:text-white cursor-pointer"
        >
          <QrCode size={13} strokeWidth={1.5} />
          <span>Open QR pass</span>
        </button>

        {isRedeemed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReview(voucher);
            }}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-[12px] font-medium text-[#525252] hover:bg-[#F4F4F5] cursor-pointer"
            title="Review store"
          >
            <Star size={12} strokeWidth={1.5} className="text-[#B45309]" />
            <span>Review</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Sub-component: Saved / Marketplace Deal Card
const FavoriteCard = ({ deal, onRemove, onSelect }) => {
  const dealId = deal._id || deal.id;
  const business = deal.businessId || {};

  return (
    <div
      onClick={() => onSelect && onSelect(deal)}
      className="flex flex-col justify-between rounded-xl border border-[#E4E4E7] bg-white p-4 transition-all duration-150 hover:border-[#171717]/40 hover:shadow-xs cursor-pointer group"
    >
      <div>
        <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg border border-[#E4E4E7] bg-[#F4F4F5]">
          <img
            src={
              deal.imageUrl ||
              deal.image ||
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
            }
            alt={deal.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
          />
          {onRemove && (
            <div className="absolute right-2.5 top-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(dealId, e);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E4E4E7] bg-white/95 text-[#D94832] cursor-pointer hover:bg-white shadow-xs"
                title="Remove from saved"
              >
                <Heart
                  size={14}
                  strokeWidth={1.5}
                  className="fill-[#D94832] text-[#D94832]"
                />
              </button>
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <span className="rounded-[5px] bg-[#171717]/85 px-2 py-0.5 text-[11px] text-white">
              {deal.category || "Flash deal"}
            </span>
          </div>
        </div>

        <h4 className="line-clamp-1 text-[14px] font-medium text-[#171717] group-hover:text-[#D94832] transition-colors">
          {deal.title}
        </h4>
        {business.name && (
          <p className="mt-0.5 text-[12px] text-[#525252]">{business.name}</p>
        )}

        <div className="mt-3 flex items-center justify-between font-mono text-[12px] tabular-nums">
          <div>
            <span className="text-[14px] font-medium text-[#171717]">
              Rs. {Number(deal.discountedPrice || 0).toLocaleString()}
            </span>
            {deal.originalPrice && (
              <span className="ml-1.5 text-[11px] text-[#71717A] line-through">
                Rs. {Number(deal.originalPrice || 0).toLocaleString()}
              </span>
            )}
          </div>
          <span className="rounded-[5px] bg-[#D94832]/10 px-2 py-0.5 text-[11px] font-medium text-[#D94832]">
            {deal.discountPercentage}% off
          </span>
        </div>
      </div>

      <div className="mt-3.5 border-t border-[#E4E4E7] pt-3">
        <Link
          to={`/deals?dealId=${dealId}&deal=${dealId}`}
          onClick={(e) => {
            if (onSelect) {
              e.preventDefault();
              e.stopPropagation();
              onSelect(deal);
            }
          }}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#171717] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#D94832] cursor-pointer"
        >
          <Ticket size={13} strokeWidth={1.5} />
          <span>View &amp; claim pass</span>
        </Link>
      </div>
    </div>
  );
};

const SidebarBtn = ({ icon, label, badge = null, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-[13px] transition-colors duration-150 cursor-pointer ${
      active
        ? "bg-white font-medium text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        : "font-normal text-[#27272A] hover:bg-[#E4E4E7]/60 hover:text-[#171717]"
    }`}
  >
    <span className="flex items-center gap-2.5 truncate">
      <span className={active ? "text-[#D94832]" : "text-[#525252]"}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
    {badge !== null && (
      <span
        className={`rounded-[5px] px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
          active
            ? "bg-[#D94832]/10 font-medium text-[#D94832]"
            : "bg-[#E4E4E7] font-medium text-[#27272A]"
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
    className={`h-8 whitespace-nowrap rounded-lg px-3 text-[12px] font-medium transition-colors cursor-pointer ${
      active
        ? "bg-[#171717] text-white"
        : "border border-[#E4E4E7] bg-[#FAFAFA] text-[#27272A]"
    }`}
  >
    {label}
  </button>
);

const EmptyState = ({ title, description, actionLabel, actionHref }) => (
  <div className="space-y-2.5 py-10 text-center">
    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] text-[#525252]">
      <Ticket size={18} strokeWidth={1.5} />
    </div>
    <h4 className="text-[14px] font-medium text-[#171717]">{title}</h4>
    <p className="mx-auto max-w-sm text-[13px] text-[#525252]">{description}</p>
    <Link
      to={actionHref}
      className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D94832] px-4 text-[13px] font-medium text-white hover:bg-[#C23B26]"
    >
      <span>{actionLabel}</span>
      <ArrowRight size={13} strokeWidth={1.5} />
    </Link>
  </div>
);

export default CustomerDashboard;
