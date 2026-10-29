import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { dealApi, businessApi, voucherApi } from "../../services/api";
import { generateDeals } from "../../services/aiService";
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
  Building2
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
  });

  // Deals State
  const [deals, setDeals] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, draft: 0, expired: 0, cancelled: 0 });
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // all, active, draft, expired
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or table

  // Deal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // AI Deal Generation State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProduct, setAiProduct] = useState("");
  const [aiTargetCustomer, setAiTargetCustomer] = useState("");

  // Fetch Business Profile
  const fetchBusinessProfile = async () => {
    try {
      setLoadingBusiness(true);
      const res = await businessApi.getMyBusiness();
      if (res?.business) {
        setBusinessProfile(res.business);
        setProfileForm({
          name: res.business.name || "",
          category: res.business.category || "Restaurant",
          phone: res.business.phone || user?.phone || "",
          city: res.business.address?.city || "Colombo",
          address: res.business.address?.street || "",
          openingHours: res.business.openingHours || "09:00 AM - 09:00 PM",
          description: res.business.description || "",
        });
      }
    } catch (err) {
      console.info("Business profile not yet set up or using default:", err.message);
    } finally {
      setLoadingBusiness(false);
    }
  };

  // Fetch Business Deals
  const fetchMyDeals = async () => {
    try {
      setLoadingDeals(true);
      const response = await dealApi.getMyDeals();
      setDeals(response.deals || []);
      if (response.metrics) {
        setMetrics(response.metrics);
      }
    } catch (err) {
      console.error("Failed to fetch business deals:", err);
    } finally {
      setLoadingDeals(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "seller" || user.role === "business")) {
      fetchBusinessProfile();
      fetchMyDeals();
    }
  }, [user]);

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
    setFormError("");
    setShowAiHelper(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description,
      category: deal.category || "General",
      originalPrice: deal.originalPrice,
      discountPercentage: deal.discountPercentage,
      durationHours: 24,
      availableQuantity: deal.availableQuantity || 50,
      status: deal.status || "active",
      terms: deal.terms || ""
    });
    setFormError("");
    setShowAiHelper(false);
    setIsModalOpen(true);
  };

  const handleGenerateAIDeal = async () => {
    const productName = aiProduct.trim();
    const originalPrice = Number.parseFloat(formData.originalPrice);

    if (!productName) {
      setFormError("Enter a product or service name first");
      return;
    }

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      setFormError("Enter a valid original price before generating the deal");
      return;
    }

    setAiLoading(true);
    setFormError("");

    try {
      const response = await generateDeals({
        businessName: user.businessName || user.name,
        businessType: formData.category,
        productOrService: productName,
        originalPrice,
        targetCustomers: aiTargetCustomer || "General Customers",
      })

      console.log("AI deal response: ", response);

      const generated = response.deal || response.result || response;

      if (!generated || typeof generated !== "object" || Array.isArray(generated)) {
        throw new Error("Invalid AI deal response");
      }

      const updates = {};

      if (typeof generated.title === "string") {
        updates.title = generated.title;
      }

      if (typeof generated.description === "string") {
        updates.description = generated.description;
      }

      const discount = Number(
        generated.discountPercentage ??
        generated.discount ??
        generated.suggestedDiscount
      )

      if (Number.isFinite(discount) && discount >= 1 && discount <= 99) {
        updates.discountPercentage = discount;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("AI response does not contain recognized deal fields");
      }

      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));

      showToast("AI suggestions added! Review before publishing.");
    } catch (error) {
      console.error("AI deal generation Error: ", error);
      setFormError(error.message || "Failed to generate AI deals");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateAiDeal = handleGenerateAIDeal;

  // Submit Deal (Create or Update)
  const handleSubmitDeal = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      if (editingDeal) {
        await dealApi.updateDeal(editingDeal._id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          originalPrice: Number(formData.originalPrice),
          discountPercentage: Number(formData.discountPercentage),
          availableQuantity: Number(formData.availableQuantity),
          status: formData.status,
          terms: formData.terms
        });
        showToast("Deal updated successfully!");
      } else {
        await dealApi.createDeal({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          originalPrice: Number(formData.originalPrice),
          discountPercentage: Number(formData.discountPercentage),
          durationHours: Number(formData.durationHours),
          availableQuantity: Number(formData.availableQuantity),
          status: formData.status,
          terms: formData.terms
        });
        showToast("Flash deal launched successfully!");
      }

      setIsModalOpen(false);
      fetchMyDeals();
    } catch (err) {
      console.error("Save deal error:", err);
      setFormError(err.message || "Failed to save deal");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status (Publish / Pause)
  const handleToggleStatus = async (deal) => {
    const nextStatus = deal.status === "active" ? "draft" : "active";
    try {
      await dealApi.updateDealStatus(deal._id, nextStatus);
      showToast(`Deal ${nextStatus === "active" ? "published" : "paused"}!`);
      fetchMyDeals();
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast("Failed to update status");
    }
  };

  // Delete Deal
  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm("Are you sure you want to permanently delete this flash deal?")) {
      return;
    }
    try {
      await dealApi.deleteDeal(dealId);
      showToast("Deal deleted successfully.");
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
    showToast("Deal link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Store Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
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

      const res = await businessApi.updateMyBusiness(payload);
      if (res?.business) {
        setBusinessProfile(res.business);
      }
      showToast("Store profile updated successfully!");
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error("Profile update error:", err);
      showToast(err.message || "Failed to update business profile");
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
        message: res.message || "Voucher successfully redeemed!",
        data: res.voucher || res.redemption || { code: voucherCodeInput.trim() }
      });
      setVoucherCodeInput("");
      showToast("Voucher verified & redeemed successfully!");
    } catch (err) {
      setRedeemResult({
        success: false,
        message: err.message || "Invalid or already redeemed voucher code."
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  // Filtered Deals
  const filteredDeals = deals.filter((deal) => {
    const matchesFilter =
      activeFilter === "all" ? true : deal.status === activeFilter;
    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#E8503A]" />
          <p className="text-sm font-semibold text-gray-600">Loading merchant workspace...</p>
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
  const storeCategory = businessProfile?.category || "Retail";
  const storeCity = businessProfile?.address?.city || "Colombo";

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] pb-16 selection:bg-[#E8503A] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-xs font-bold text-white shadow-2xl border border-white/10 animate-bounce">
          <Sparkles size={15} className="text-[#FFD19A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 px-6 sm:px-10 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-black tracking-tight text-[#1A1A1A]">
            HitMe<span className="text-[#E8503A]">Up</span>
          </Link>
          <span className="rounded-full bg-[#E8503A]/10 px-3 py-0.5 text-[11px] font-extrabold text-[#E8503A] uppercase tracking-wider">
            Merchant Center
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#E8503A] transition"
          >
            <ArrowLeft size={14} />
            <span>Browse Marketplace</span>
          </Link>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900">{user.name}</p>
            <p className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">
              {storeName} • Merchant
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl p-5 sm:p-8 space-y-7">
        {/* Merchant Store Header Card */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF4A2F] to-[#E8503A] text-white shadow-lg shadow-[#E8503A]/25">
              <Store size={30} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  Verified Store
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                  {storeCategory}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {storeName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-[#E8503A]" />
                  {storeCity}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-gray-400" />
                  {businessProfile?.phone || user.phone || "+94 77 123 4567"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-gray-400" />
                  {businessProfile?.openingHours || "09:00 AM - 09:00 PM"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Edit3 size={15} />
              <span>Edit Store Profile</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4A2F] to-[#E8503A] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#E8503A]/25 hover:shadow-lg hover:shadow-[#E8503A]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <PlusCircle size={17} />
              <span>Create Flash Deal</span>
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <Layers size={16} />
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">{metrics.total}</p>
            <p className="text-[11px] text-gray-400 mt-1">All promotions created</p>
          </div>

          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Tag size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-emerald-900">{metrics.active}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Visible on marketplace now</p>
          </div>

          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Draft Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Clock size={16} />
              </span>
            </div>
            <p className="text-3xl font-black text-amber-900">{metrics.draft}</p>
            <p className="text-[11px] text-amber-700/80 mt-1">Ready for publishing</p>
          </div>

          <div className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">AI Assistant</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Sparkles size={16} />
              </span>
            </div>
            <p className="text-lg font-black text-blue-900">NVIDIA AI Ready</p>
            <button
              onClick={() => {
                handleOpenCreate();
                setShowAiHelper(true);
              }}
              className="mt-1 text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <Wand2 size={12} /> Auto-generate deal &rarr;
            </button>
          </div>
        </div>

        {/* POS Quick Voucher Redemption Widget */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#E8503A]">
                <Ticket size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  Customer Voucher Verification & Redemption
                </h2>
                <p className="text-xs text-gray-500">
                  Customer presenting a QR code voucher? Enter the unique digital voucher code below.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRedeemVoucher} className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Ticket size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. VOUCH-48192 or enter 8-digit voucher code"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-none uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={redeemLoading || !voucherCodeInput.trim()}
              className="w-full sm:w-auto rounded-xl bg-[#172026] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#E8503A] transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
              className={`mt-4 rounded-xl p-4 text-xs font-medium flex items-start gap-3 animate-fadeIn ${
                redeemResult.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {redeemResult.success ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">{redeemResult.message}</p>
                {redeemResult.success && (
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Order confirmed. Customer voucher marked as REDEEMED.
                  </p>
                )}
              </div>
              <button
                onClick={() => setRedeemResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Deals Management Section */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Section Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Your Flash Promotions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Filter, pause, edit, and monitor your active deals</p>
            </div>

            {/* Filter Pills, Search & View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                {["all", "active", "draft", "expired"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${activeFilter === tab
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded-lg transition ${
                    viewMode === "grid" ? "bg-white text-[#E8503A] shadow-xs" : "text-gray-400"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1 rounded-lg transition ${
                    viewMode === "table" ? "bg-white text-[#E8503A] shadow-xs" : "text-gray-400"
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
                  className="rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Deals Grid / List */}
          {loadingDeals ? (
            <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-3">
              <span className="h-6 w-6 rounded-full border-2 border-[#E8503A] border-t-transparent animate-spin" />
              <span>Loading your flash promotions...</span>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A]">
                <Tag size={26} />
              </div>
              <h3 className="text-base font-bold text-gray-900">No flash deals found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery || activeFilter !== "all"
                  ? "Try adjusting your search or status filters."
                  : "Launch your first flash deal now to attract customers during quiet hours!"}
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-bold text-white hover:bg-[#D43A26] transition-colors cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>Create Flash Deal</span>
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeals.map((deal) => {
                const isActive = deal.status === "active";
                const isDraft = deal.status === "draft";
                const isExpired = deal.status === "expired";

                return (
                  <div
                    key={deal._id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                          {deal.category || "General"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isDraft
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isExpired
                                ? "bg-gray-100 text-gray-500 border border-gray-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                          {deal.status}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{deal.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {deal.description}
                      </p>

                      {/* Pricing Box */}
                      <div className="mt-4 p-3 rounded-xl bg-gray-50/80 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 line-through mr-1.5">
                            Rs. {deal.originalPrice?.toLocaleString()}
                          </span>
                          <span className="text-base font-extrabold text-[#E8503A]">
                            Rs. {deal.discountedPrice?.toLocaleString()}
                          </span>
                        </div>
                        <span className="rounded-lg bg-[#E8503A]/10 px-2 py-0.5 text-xs font-black text-[#E8503A]">
                          {deal.discountPercentage}% OFF
                        </span>
                      </div>

                      {/* Availability & Dates */}
                      <div className="mt-3 text-[11px] text-gray-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          <span>Ends: {new Date(deal.endDate).toLocaleDateString()}</span>
                        </span>
                        <span>{deal.availableQuantity || 50} vouchers left</span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStatus(deal)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${isActive
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                      >
                        {isActive ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isActive ? "Pause" : "Publish"}</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink(deal._id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Copy deal link"
                      >
                        {copiedId === deal._id ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(deal)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Edit Deal"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteDeal(deal._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Deal Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Original</th>
                    <th className="p-3">Deal Price</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {filteredDeals.map((deal) => (
                    <tr key={deal._id} className="hover:bg-gray-50/70 transition">
                      <td className="p-3 font-bold text-gray-900">{deal.title}</td>
                      <td className="p-3">{deal.category || "General"}</td>
                      <td className="p-3 text-gray-400 line-through">Rs. {deal.originalPrice}</td>
                      <td className="p-3 font-extrabold text-[#E8503A]">Rs. {deal.discountedPrice}</td>
                      <td className="p-3 font-bold">{deal.discountPercentage}%</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            deal.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {deal.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => handleToggleStatus(deal)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          {deal.status === "active" ? "Pause" : "Live"}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(deal)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal._id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
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
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8503A]/10 text-[#E8503A]">
                  <Tag size={16} />
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  {editingDeal ? "Edit Flash Deal" : "Create New Flash Deal"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error in modal */}
            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* AI Generator Toggle Button (When creating new deal) */}
            {!editingDeal && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAiHelper(!showAiHelper)}
                  className="w-full flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 p-3 text-xs font-bold text-gray-800 hover:border-[#E8503A] transition"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#E8503A]" />
                    <span>Want NVIDIA AI to write your deal?</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#E8503A]">
                    {showAiHelper ? "Hide Assistant" : "Auto-Draft with AI &rarr;"}
                  </span>
                </button>

                {showAiHelper && (
                  <div className="mt-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 animate-fadeIn">
                    <p className="text-[11px] font-semibold text-gray-600">
                      Enter product or service name (e.g. <em>Chicken Burger Combo, Full Body Massage, AC Cleaning</em>):
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Crispy Chicken Burger with Fries"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#E8503A]"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAiDeal}
                        disabled={isGeneratingAi || !aiPrompt.trim()}
                        className="rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#D43A26] transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isGeneratingAi && (
                          <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        )}
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deal Form */}
            <form onSubmit={handleSubmitDeal} className="mt-5 space-y-4">

              {/* AI Deal Generator */}
              {!editingDeal && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 space-y-3">

                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#E8503A]" />
                    <h4 className="text-sm font-extrabold text-gray-900">
                      AI Deal Assistant
                    </h4>
                  </div>

                  <p className="text-xs text-gray-500">
                    Let AI suggest a title, description and discount for your flash deal.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Product or Service
                    </label>

                    <input
                      type="text"
                      value={aiProduct}
                      onChange={(e) => setAiProduct(e.target.value)}
                      placeholder="e.g. Chicken Burger"
                      className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Target Customers
                    </label>

                    <input
                      type="text"
                      value={aiTargetCustomer}
                      onChange={(e) => setAiTargetCustomer(e.target.value)}
                      placeholder="e.g. University Students"
                      className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs"
                    />
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Uses the original price and category entered in the form below.
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerateAIDeal}
                    disabled={
                      aiLoading ||
                      !aiProduct.trim() ||
                      !Number.isFinite(Number.parseFloat(formData.originalPrice)) ||
                      Number.parseFloat(formData.originalPrice) <= 0
                    }
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E8503A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#D43A26] disabled:opacity-60"
                  >
                    <Sparkles size={15} />
                    {aiLoading ? "AI is generating..." : "Generate with AI"}
                  </button>
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
                  <label className="block text-xs font-bold text-gray-700">Max Vouchers</label>
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
                      Rs. {calculatedDiscountedPrice}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-bold block text-[11px]">
                      Customer Saves: Rs. {savingsAmount}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {discountPctNum}% instant markdown
                    </span>
                  </div>
                </div>
              )}

              {/* Flash Duration */}
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
                        className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${formData.durationHours === dur.val
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
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs font-bold text-gray-700">Publish Mode:</label>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={handleInputChange}
                    className="text-[#E8503A] focus:ring-[#E8503A]"
                  />
                  <span>Publish Immediately (Active)</span>
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
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 my-6 max-h-[90vh] overflow-y-auto">
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

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#D43A26] transition-all"
                >
                  Save Store Profile
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