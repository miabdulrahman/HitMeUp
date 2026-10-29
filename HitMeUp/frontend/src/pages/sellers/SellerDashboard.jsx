import { useState, useEffect, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { dealApi, businessApi, voucherApi } from "../../services/api";
import { generateDeals } from "../../services/aiService";
import SellerLocationMapPicker from "../../components/SellerLocationMapPicker";
import {
  LogOut,
  ArrowLeft,
  ShieldCheck,
  PlusCircle,
  Tag,
  Clock,
  Edit3,
  Trash2,
  Play,
  Pause,
  Sparkles,
  Percent,
  Search,
  X,
  AlertCircle,
  Layers,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  Copy,
  Check,
  Ticket,
  Wand2,
  RefreshCw,
  LayoutGrid,
  List,
  Building2,
  TrendingUp,
  Flame,
  Share2,
  DollarSign,
  Navigation,
  Globe,
  Crosshair,
  Compass
} from "lucide-react";

const SellerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const user = location.state?.user || authUser;

  // Role Guard: Customers are redirected to customer dashboard, unauthenticated to login
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (user.role === "customer" || user.role === "buyer") {
        navigate("/customer/dashboard", { replace: true });
        return;
      }
    }
  }, [user, authLoading, navigate]);

  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    category: "Restaurant",
    phone: "",
    city: "Colombo",
    address: "",
    openingHours: "09:00 AM - 09:00 PM",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  // Deals State
  const [deals, setDeals] = useState([]);
  const [rawMetrics, setRawMetrics] = useState({ total: 0, active: 0, draft: 0, expired: 0, cancelled: 0 });
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // all, active, draft, expired
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [lastSynced, setLastSynced] = useState(null);

  // Deal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Voucher POS Quick-Redeem State
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);

  // Deal Form State
  const initialFormState = {
    title: "",
    description: "",
    category: "Restaurant",
    originalPrice: "",
    discountPercentage: 30,
    durationHours: 24,
    availableQuantity: 30,
    status: "active",
    terms: "Valid during store operating hours. One voucher per customer."
  };
  const [formData, setFormData] = useState(initialFormState);

  // AI Deal Generation State
  const [aiProduct, setAiProduct] = useState("");
  const [aiTargetCustomer, setAiTargetCustomer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);

  // Fetch Business Profile
  const fetchBusinessProfile = async () => {
    try {
      setLoadingBusiness(true);
      const res = await businessApi.getMyBusiness();
      if (res?.business) {
        setBusinessProfile(res.business);
        const coords = res.business.location?.coordinates || [79.8612, 6.9271];
        setProfileForm({
          name: res.business.name || "",
          category: res.business.category || "Restaurant",
          phone: res.business.phone || user?.phone || "",
          city: res.business.address?.city || "Colombo",
          address: res.business.address?.street || "",
          openingHours: res.business.openingHours || "09:00 AM - 09:00 PM",
          description: res.business.description || "",
          latitude: coords[1] || 6.9271,
          longitude: coords[0] || 79.8612,
        });
      }
    } catch (err) {
      console.info("Business profile not yet set up or using default:", err?.message);
    } finally {
      setLoadingBusiness(false);
    }
  };

  // Fetch Business Deals
  const fetchMyDeals = async () => {
    try {
      setLoadingDeals(true);
      const response = await dealApi.getMyDeals();
      const loadedDeals = response.deals || [];
      setDeals(loadedDeals);
      if (response.metrics) {
        setRawMetrics(response.metrics);
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error("Failed to fetch business deals:", err);
    } finally {
      setLoadingDeals(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "seller" || user.role === "business" || user.role === "admin")) {
      fetchBusinessProfile();
      fetchMyDeals();
    }
  }, [user]);

  // Dynamic Calculated Metrics (Combines backend metrics with live deals data fallback)
  const metrics = useMemo(() => {
    const totalCount = deals.length;
    const activeCount = deals.filter((d) => d.status === "active").length;
    const draftCount = deals.filter((d) => d.status === "draft").length;
    const expiredCount = deals.filter(
      (d) => d.status === "expired" || (d.endDate && new Date(d.endDate) < new Date())
    ).length;
    const totalVouchersPool = deals.reduce((acc, d) => acc + (Number(d.availableQuantity) || 0), 0);
    const avgDiscountRate = totalCount > 0
      ? Math.round(deals.reduce((acc, d) => acc + (Number(d.discountPercentage) || 0), 0) / totalCount)
      : 0;

    return {
      total: rawMetrics.total || totalCount,
      active: rawMetrics.active !== undefined && rawMetrics.active > 0 ? rawMetrics.active : activeCount,
      draft: rawMetrics.draft !== undefined && rawMetrics.draft > 0 ? rawMetrics.draft : draftCount,
      expired: rawMetrics.expired !== undefined && rawMetrics.expired > 0 ? rawMetrics.expired : expiredCount,
      totalVouchersPool,
      avgDiscountRate
    };
  }, [deals, rawMetrics]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Form Field Change & Dynamic Price Calculation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (formError) setFormError("");
  };

  // Calculated Price preview
  const originalPriceNum = Number(formData.originalPrice) || 0;
  const discountPctNum = Number(formData.discountPercentage) || 0;
  const calculatedDiscountedPrice = originalPriceNum > 0
    ? Math.max(0, Math.round(originalPriceNum * (1 - discountPctNum / 100)))
    : 0;
  const savingsAmount = originalPriceNum - calculatedDiscountedPrice;

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDeal(null);
    setFormData({
      ...initialFormState,
      category: businessProfile?.category || "Restaurant"
    });
    setAiProduct("");
    setAiTargetCustomer("");
    setFormError("");
    setShowAiHelper(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title || "",
      description: deal.description || "",
      category: deal.category || businessProfile?.category || "Restaurant",
      originalPrice: deal.originalPrice || "",
      discountPercentage: deal.discountPercentage || 30,
      durationHours: 24,
      availableQuantity: deal.availableQuantity || 30,
      status: deal.status || "active",
      terms: deal.terms || "Valid during store operating hours. One voucher per customer."
    });
    setFormError("");
    setShowAiHelper(false);
    setIsModalOpen(true);
  };

  // AI Deal Generation Trigger
  const handleGenerateAIDeal = async () => {
    const productName = aiProduct.trim();
    const originalPrice = Number.parseFloat(formData.originalPrice);

    if (!productName) {
      setFormError("Enter a product or service name for AI deal generation (e.g. 'Crispy Chicken Burger').");
      return;
    }

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      setFormError("Enter a valid original price in the pricing field first.");
      return;
    }

    setAiLoading(true);
    setFormError("");

    try {
      const response = await generateDeals({
        businessName: businessProfile?.name || user?.businessName || user?.name || "Merchant Store",
        businessType: formData.category || "Restaurant",
        productOrService: productName,
        originalPrice,
        targetCustomers: aiTargetCustomer.trim() || "General Shoppers",
      });

      const generated = response.deal || response.result || response;

      if (!generated || typeof generated !== "object") {
        throw new Error("Invalid AI deal response format");
      }

      const updates = {};
      if (typeof generated.title === "string" && generated.title.trim()) {
        updates.title = generated.title.trim();
      }
      if (typeof generated.description === "string" && generated.description.trim()) {
        updates.description = generated.description.trim();
      }
      const discount = Number(
        generated.discountPercentage ??
        generated.discount ??
        generated.suggestedDiscount
      );
      if (Number.isFinite(discount) && discount >= 1 && discount <= 99) {
        updates.discountPercentage = discount;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("AI did not return readable deal fields. Try a different prompt.");
      }

      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));

      showToast("NVIDIA AI suggestions applied! Review and launch your flash deal.");
    } catch (error) {
      console.error("AI deal generation Error:", error);
      setFormError(error.message || "Failed to generate AI deal recommendations");
    } finally {
      setAiLoading(false);
    }
  };

  // Submit Deal (Create or Update)
  const handleSubmitDeal = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      if (editingDeal) {
        await dealApi.updateDeal(editingDeal._id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          originalPrice: Number(formData.originalPrice),
          discountPercentage: Number(formData.discountPercentage),
          availableQuantity: Number(formData.availableQuantity),
          status: formData.status,
          terms: formData.terms
        });
        showToast("Flash deal updated successfully!");
      } else {
        await dealApi.createDeal({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          originalPrice: Number(formData.originalPrice),
          discountPercentage: Number(formData.discountPercentage),
          durationHours: Number(formData.durationHours),
          availableQuantity: Number(formData.availableQuantity),
          status: formData.status,
          terms: formData.terms
        });
        showToast("Flash deal launched to marketplace!");
      }

      setIsModalOpen(false);
      fetchMyDeals();
    } catch (err) {
      console.error("Save deal error:", err);
      setFormError(err.message || "Failed to save flash deal");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status (Publish / Pause)
  const handleToggleStatus = async (deal) => {
    const nextStatus = deal.status === "active" ? "draft" : "active";
    try {
      await dealApi.updateDealStatus(deal._id, nextStatus);
      showToast(`Deal switched to ${nextStatus === "active" ? "Live" : "Paused"}!`);
      fetchMyDeals();
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast("Failed to update status");
    }
  };

  // Delete Deal
  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm("Are you sure you want to permanently delete this flash promotion?")) {
      return;
    }
    try {
      await dealApi.deleteDeal(dealId);
      showToast("Deal permanently removed.");
      fetchMyDeals();
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete deal");
    }
  };

  // Copy Deal Link
  const handleCopyLink = (dealId) => {
    const url = `${window.location.origin}/deals`;
    navigator.clipboard?.writeText(url);
    setCopiedId(dealId);
    showToast("Direct marketplace link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Submit Store Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const lat = parseFloat(profileForm.latitude);
      const lng = parseFloat(profileForm.longitude);

      const payload = {
        name: profileForm.name.trim(),
        category: profileForm.category,
        phone: profileForm.phone.trim(),
        openingHours: profileForm.openingHours.trim(),
        description: profileForm.description.trim(),
        address: {
          city: profileForm.city.trim(),
          street: profileForm.address.trim(),
          country: "Sri Lanka"
        }
      };

      // Include GeoJSON location if valid coordinates provided
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        payload.location = {
          type: "Point",
          coordinates: [lng, lat] // GeoJSON: [longitude, latitude]
        };
      }

      const res = await businessApi.updateMyBusiness(payload);
      if (res?.business) {
        setBusinessProfile(res.business);
      }
      showToast("Store profile & location updated successfully!");
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error("Profile update error:", err);
      showToast(err.message || "Failed to update business profile");
    }
  };

  // GPS auto-detect handler for profile modal
  const handleDetectMyLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfileForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocatingGPS(false);
        showToast("GPS location detected successfully!");
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setLocatingGPS(false);
        showToast("Could not detect location. Please enter coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search address and geocode using Google Maps Geocoding (free embed)
  const handleSearchAddress = async () => {
    if (!locationSearchQuery.trim()) return;
    try {
      // Use Nominatim (free, open) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchQuery.trim())}&limit=1`
      );
      const results = await response.json();
      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        setProfileForm((prev) => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6),
        }));
        showToast(`Location found: ${display_name.split(',').slice(0,2).join(',')}`);
      } else {
        showToast("No results found. Try a more specific address.");
      }
    } catch (err) {
      console.error("Address search error:", err);
      showToast("Address search failed. Please enter coordinates manually.");
    }
  };

  // Quick POS Voucher Redemption
  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCodeInput.trim()) return;

    setRedeemLoading(true);
    setRedeemResult(null);

    try {
      const res = await voucherApi.redeemVoucher({
        voucherCode: voucherCodeInput.trim(),
        businessId: businessProfile?._id
      });

      setRedeemResult({
        success: true,
        message: res.message || "Voucher successfully verified & redeemed!",
        data: res.voucher || res.redemption || { code: voucherCodeInput.trim() },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setVoucherCodeInput("");
      showToast("Customer voucher redeemed & recorded!");
    } catch (err) {
      setRedeemResult({
        success: false,
        message: err.message || "Invalid or already redeemed voucher code. Please check customer pass."
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesFilter =
        activeFilter === "all" ? true : deal.status === activeFilter;
      const matchesSearch =
        searchQuery.trim() === ""
          ? true
          : deal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [deals, activeFilter, searchQuery]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-3 border-[#E8503A] border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-gray-600 tracking-wide uppercase">Connecting to Merchant Center...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4 text-center">
        <p className="text-sm font-semibold text-gray-700">User session expired.</p>
        <Link
          to="/login"
          className="mt-4 rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D43A26] transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const storeName = businessProfile?.name || user?.businessName || `${user.name}'s Store`;
  const storeCategory = businessProfile?.category || "Restaurant";
  const storeCity = businessProfile?.address?.city || "Colombo";

  const filterTabs = [
    { key: "all", label: "All Deals", count: metrics.total },
    { key: "active", label: "Live & Active", count: metrics.active },
    { key: "draft", label: "Drafts", count: metrics.draft },
    { key: "expired", label: "Expired", count: metrics.expired }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] pb-20 selection:bg-[#E8503A] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#111827] px-5 py-3 text-xs font-bold text-white shadow-2xl border border-white/10 animate-bounce">
          <Sparkles size={16} className="text-[#FFB703]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 px-6 sm:px-10 py-3.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-black tracking-tight text-[#1A1A1A]">
            HitMe<span className="text-[#E8503A]">Up</span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#E8503A]/10 px-3 py-0.5 text-[11px] font-extrabold text-[#E8503A] uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-[#E8503A] animate-pulse" />
            Merchant Center
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#E8503A] transition"
          >
            <ArrowLeft size={14} />
            <span>Browse Marketplace</span>
          </Link>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
            <p className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">
              {storeName} • Merchant
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl p-5 sm:p-8 space-y-7">
        
        {/* Merchant Store Hero Banner Card */}
        <div className="relative rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-[#FF4A2F]/10 to-[#FFB703]/10 blur-2xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF4A2F] via-[#E8503A] to-[#D43A26] text-white shadow-lg shadow-[#E8503A]/25 ring-4 ring-[#E8503A]/10">
                <Store size={32} />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    Verified Store
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    {storeCategory}
                  </span>
                  {lastSynced && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {storeName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={13} className="text-[#E8503A]" />
                    {storeCity}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Phone size={13} className="text-gray-400" />
                    {businessProfile?.phone || user.phone || "+94 77 123 4567"}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={13} className="text-gray-400" />
                    {businessProfile?.openingHours || "09:00 AM - 09:00 PM"}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  fetchBusinessProfile();
                  fetchMyDeals();
                  showToast("Data refreshed from database!");
                }}
                disabled={loadingDeals}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Sync latest database deals"
              >
                <RefreshCw size={14} className={loadingDeals ? "animate-spin text-[#E8503A]" : "text-gray-500"} />
                <span>{loadingDeals ? "Syncing..." : "Sync"}</span>
              </button>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all shadow-2xs cursor-pointer"
                title="Pin your store location on interactive map"
              >
                <MapPin size={14} className="text-[#E8503A]" />
                <span>Pin Store on Map</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4A2F] via-[#E8503A] to-[#D43A26] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#E8503A]/25 hover:shadow-lg hover:shadow-[#E8503A]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>Create Flash Deal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Metrics Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Deals */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <Layers size={16} />
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">{metrics.total}</p>
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
              <span>All flash promotions</span>
            </p>
          </div>

          {/* Card 2: Active Deals */}
          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                <Tag size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-emerald-950">{metrics.active}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live Now
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Live on shopper marketplace</p>
          </div>

          {/* Card 3: Draft Deals */}
          <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-white p-5 shadow-xs hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Draft Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock size={16} />
              </span>
            </div>
            <p className="text-3xl font-black text-amber-950">{metrics.draft}</p>
            <p className="text-[11px] text-amber-700/80 mt-1">Ready for scheduled publish</p>
          </div>

          {/* Card 4: NVIDIA AI Assistant */}
          <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">AI Deal Copilot</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Sparkles size={16} />
                </span>
              </div>
              <p className="text-base font-extrabold text-blue-950">NVIDIA AI Ready</p>
            </div>
            <button
              onClick={() => {
                handleOpenCreate();
                setShowAiHelper(true);
              }}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
            >
              <Wand2 size={13} /> Auto-draft deal &rarr;
            </button>
          </div>
        </div>

        {/* Storefront Discovery Pin Status Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8503A]/10 text-[#E8503A] shrink-0">
              <MapPin size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Storefront Discovery Pin
                </h3>
                {profileForm.latitude && profileForm.longitude ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    Pinned ({parseFloat(profileForm.latitude).toFixed(3)}°N, {parseFloat(profileForm.longitude).toFixed(3)}°E)
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    Pin Not Set
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {profileForm.latitude && profileForm.longitude
                  ? `Your store pin is live for buyers on the Discovery Map in ${storeCity}. Click below to adjust or fine-tune.`
                  : "Pin your storefront on the interactive map so buyers can discover and get directions to your shop."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-[#E8503A] transition-all cursor-pointer shadow-xs"
          >
            <Compass size={14} className="text-[#FFB703]" />
            <span>{profileForm.latitude && profileForm.longitude ? "Adjust Pin on Map" : "Pin Store on Map"}</span>
          </button>
        </div>

        {/* POS Customer Voucher Verification & Quick Redemption */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A] border border-orange-100">
                <Ticket size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  Customer Voucher Verification & Redemption
                </h2>
                <p className="text-xs text-gray-500">
                  Customer presenting a digital voucher or QR pass? Enter their unique voucher code below to redeem.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRedeemVoucher} className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Ticket size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. VOUCH-48192 OR ENTER 8-DIGIT VOUCHER CODE"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 placeholder:text-gray-400 uppercase tracking-wider focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={redeemLoading || !voucherCodeInput.trim()}
              className="w-full sm:w-auto h-11 rounded-xl bg-[#111827] px-6 text-xs font-bold text-white shadow-xs hover:bg-[#E8503A] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {redeemLoading && (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              <span>Verify & Redeem Voucher</span>
            </button>
          </form>

          {/* Redemption Feedback Banner */}
          {redeemResult && (
            <div
              className={`mt-4 rounded-2xl p-4 text-xs font-medium flex items-start gap-3 animate-fadeIn ${
                redeemResult.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {redeemResult.success ? (
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-extrabold text-sm">{redeemResult.message}</p>
                {redeemResult.success && (
                  <p className="text-[11px] text-emerald-700">
                    Voucher marked as <strong>REDEEMED</strong> at {redeemResult.timestamp}. Customer order fulfilled.
                  </p>
                )}
              </div>
              <button
                onClick={() => setRedeemResult(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Deals Management Section */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Section Header & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">Your Flash Promotions</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-extrabold text-gray-700">
                  {filteredDeals.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Filter, pause, edit, and monitor your active deals</p>
            </div>

            {/* Filter Pills, Search & View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs with Dynamic Counters */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === tab.key
                        ? "bg-white text-gray-900 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        activeFilter === tab.key
                          ? "bg-[#E8503A]/10 text-[#E8503A]"
                          : "bg-gray-200/80 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "grid" ? "bg-white text-[#E8503A] shadow-2xs" : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "table" ? "bg-white text-[#E8503A] shadow-2xs" : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Table View"
                >
                  <List size={15} />
                </button>
              </div>

              {/* Search bar */}
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 py-1.5 pl-8 pr-7 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Deals Grid / List */}
          {loadingDeals ? (
            <div className="py-20 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-3">
              <span className="h-7 w-7 rounded-full border-2 border-[#E8503A] border-t-transparent animate-spin" />
              <span className="font-semibold">Retrieving your deals from database...</span>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A]">
                <Tag size={26} />
              </div>
              <h3 className="text-base font-bold text-gray-900">No flash deals found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery || activeFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "Launch your first flash deal now to attract customers during quiet store hours!"}
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-bold text-white hover:bg-[#D43A26] transition-colors cursor-pointer shadow-xs"
              >
                <PlusCircle size={15} />
                <span>Create Flash Deal</span>
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDeals.map((deal) => {
                const isActive = deal.status === "active";
                const isDraft = deal.status === "draft";
                const isExpired = deal.status === "expired" || (deal.endDate && new Date(deal.endDate) < new Date());
                const discountedPrice = deal.discountedPrice || (deal.originalPrice * (1 - deal.discountPercentage / 100));
                const savings = deal.originalPrice - discountedPrice;

                return (
                  <div
                    key={deal._id}
                    className="group rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges Strip */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                          {deal.category || "General"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isDraft
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : isExpired
                              ? "bg-gray-100 text-gray-500 border-gray-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {deal.status}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-extrabold text-gray-900 line-clamp-1 group-hover:text-[#E8503A] transition-colors">
                        {deal.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {deal.description}
                      </p>

                      {/* Pricing Box with Savings Pill */}
                      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-orange-50/30 border border-gray-100 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400 line-through">
                              Rs. {Number(deal.originalPrice).toLocaleString()}
                            </span>
                            <span className="text-base font-black text-[#E8503A]">
                              Rs. {Math.round(discountedPrice).toLocaleString()}
                            </span>
                          </div>
                          {savings > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600">
                              Save Rs. {Math.round(savings).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <span className="rounded-lg bg-[#E8503A] px-2.5 py-1 text-xs font-black text-white shadow-2xs">
                          {deal.discountPercentage}% OFF
                        </span>
                      </div>

                      {/* Availability & Duration Progress */}
                      <div className="mt-3 text-[11px] text-gray-500 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            <span>Ends: {deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "Limited Time"}</span>
                          </span>
                          <span className="font-bold text-gray-700">{deal.availableQuantity || 30} vouchers left</span>
                        </div>

                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#E8503A] h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(15, (deal.availableQuantity || 30)))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStatus(deal)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {isActive ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isActive ? "Pause" : "Go Live"}</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink(deal._id)}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                        title="Copy deal link"
                      >
                        {copiedId === deal._id ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(deal)}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                        title="Edit Deal"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteDeal(deal._id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
                        title="Delete Deal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Deal Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Original</th>
                    <th className="p-3.5">Flash Price</th>
                    <th className="p-3.5">Discount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {filteredDeals.map((deal) => {
                    const discounted = deal.discountedPrice || (deal.originalPrice * (1 - deal.discountPercentage / 100));
                    return (
                      <tr key={deal._id} className="hover:bg-gray-50/70 transition">
                        <td className="p-3.5 font-bold text-gray-900 max-w-[200px] truncate">{deal.title}</td>
                        <td className="p-3.5">{deal.category || "General"}</td>
                        <td className="p-3.5 text-gray-400 line-through">Rs. {Number(deal.originalPrice).toLocaleString()}</td>
                        <td className="p-3.5 font-extrabold text-[#E8503A]">Rs. {Math.round(discounted).toLocaleString()}</td>
                        <td className="p-3.5 font-bold">{deal.discountPercentage}%</td>
                        <td className="p-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              deal.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {deal.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleToggleStatus(deal)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                          >
                            {deal.status === "active" ? "Pause" : "Live"}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(deal)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteDeal(deal._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CREATE / EDIT FLASH DEAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 my-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8503A]/10 text-[#E8503A]">
                  <Tag size={18} />
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  {editingDeal ? "Edit Flash Deal" : "Create Flash Promotion"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner in modal */}
            {formError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Deal Form */}
            <form onSubmit={handleSubmitDeal} className="mt-5 space-y-4">
              
              {/* AI Copilot Accordion */}
              {!editingDeal && (
                <div className="rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#E8503A]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                        NVIDIA AI Deal Assistant
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiHelper(!showAiHelper)}
                      className="text-[11px] font-bold text-[#E8503A] hover:underline cursor-pointer"
                    >
                      {showAiHelper ? "Hide Assistant" : "Open Assistant"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Enter your item name and original price below, and NVIDIA AI will craft the optimal headline and discount.
                  </p>

                  {(showAiHelper || !formData.title) && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Product or Special Offer Name
                        </label>
                        <input
                          type="text"
                          value={aiProduct}
                          onChange={(e) => setAiProduct(e.target.value)}
                          placeholder="e.g. Crispy Fried Chicken Burger Combo"
                          className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#E8503A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Target Shoppers (Optional)
                        </label>
                        <input
                          type="text"
                          value={aiTargetCustomer}
                          onChange={(e) => setAiTargetCustomer(e.target.value)}
                          placeholder="e.g. University Students, Office Lunch Crowd"
                          className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#E8503A]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAIDeal}
                        disabled={aiLoading || !aiProduct.trim() || !formData.originalPrice}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4A2F] to-[#E8503A] py-2.5 text-xs font-bold text-white shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {aiLoading ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Crafting with AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Auto-Generate Deal with NVIDIA AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Deal Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. 50% OFF Afternoon Special Roast Combo"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Category & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Retail">Retail</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Health & Beauty">Health & Beauty</option>
                    <option value="Salon">Salon</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Available Quantity</label>
                  <input
                    type="number"
                    name="availableQuantity"
                    min="1"
                    required
                    value={formData.availableQuantity}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Pricing Section with Dynamic Calculator */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Original Price (Rs.)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    min="1"
                    required
                    placeholder="1500"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Discount (%)</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      name="discountPercentage"
                      min="1"
                      max="99"
                      required
                      placeholder="30"
                      value={formData.discountPercentage}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-3 pr-8 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                    />
                    <Percent size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Live Calculator Visual Feedback */}
              {originalPriceNum > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 text-[11px] block">Customer Pays</span>
                    <span className="text-base font-black text-[#E8503A]">
                      Rs. {calculatedDiscountedPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-bold block text-[11px]">
                      Customer Saves: Rs. {savingsAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {discountPctNum}% instant markdown
                    </span>
                  </div>
                </div>
              )}

              {/* Flash Duration Presets */}
              {!editingDeal && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Deal Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "2 Hours", val: 2 },
                      { label: "6 Hours", val: 6 },
                      { label: "24 Hours", val: 24 },
                      { label: "3 Days", val: 72 }
                    ].map((dur) => (
                      <button
                        key={dur.val}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, durationHours: dur.val }))}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          formData.durationHours === dur.val
                            ? "bg-[#E8503A] text-white border-[#E8503A]"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Deal Details & Inclusions</label>
                <textarea
                  name="description"
                  required
                  rows="2"
                  placeholder="Describe what is included in this limited-time flash promotion..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Terms */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Terms & Conditions</label>
                <input
                  type="text"
                  name="terms"
                  placeholder="e.g. Valid dine-in only. One voucher per customer."
                  value={formData.terms}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Initial Status */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-gray-700">Mode:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={handleInputChange}
                    className="text-[#E8503A] focus:ring-[#E8503A]"
                  />
                  <span>Live Immediately</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === "draft"}
                    onChange={handleInputChange}
                    className="text-[#E8503A] focus:ring-[#E8503A]"
                  />
                  <span>Save as Draft</span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#D43A26] transition-all disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
                >
                  {formLoading && (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  )}
                  <span>{editingDeal ? "Update Deal" : "Launch Deal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STORE PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Store size={16} />
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  Edit Store Profile
                </h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Store / Business Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Category</label>
                  <select
                    value={profileForm.category}
                    onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Retail">Retail</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Health & Beauty">Health & Beauty</option>
                    <option value="Salon">Salon</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">City / District</label>
                  <input
                    type="text"
                    required
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Operating Hours</label>
                  <input
                    type="text"
                    value={profileForm.openingHours}
                    onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Store Address</label>
                <input
                  type="text"
                  placeholder="e.g. 124 Galle Road, Bambalapitiya"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Store Description</label>
                <textarea
                  rows="2"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  placeholder="Briefly describe your store and offerings..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* ══════ INTERACTIVE STORE LOCATION MAP PINNER ══════ */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8503A]/10 text-[#E8503A]">
                      <MapPin size={15} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-900">
                        Pin Store Location on Interactive Map
                      </label>
                      <p className="text-[10px] text-gray-500">
                        Click on the map or drag the pin to set your storefront for buyers
                      </p>
                    </div>
                  </div>
                  {profileForm.latitude && profileForm.longitude && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      Pin Placed
                    </span>
                  )}
                </div>

                <SellerLocationMapPicker
                  latitude={profileForm.latitude}
                  longitude={profileForm.longitude}
                  storeName={profileForm.name || storeName || "My Store"}
                  onChange={({ latitude, longitude }) => {
                    setProfileForm((prev) => ({
                      ...prev,
                      latitude,
                      longitude
                    }));
                  }}
                  onAddressDetected={({ street, city }) => {
                    setProfileForm((prev) => ({
                      ...prev,
                      address: prev.address ? prev.address : street,
                      city: prev.city ? prev.city : city
                    }));
                  }}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#D43A26] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <MapPin size={13} />
                  <span>Save Profile & Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;