import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { dealApi } from "../../services/api";
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
  Layers
} from "lucide-react";

const SellerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = location.state?.user || authUser;

  // Deals State
  const [deals, setDeals] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, draft: 0, expired: 0, cancelled: 0 });
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // all, active, draft, expired
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Deal Form State
  const initialFormState = {
    title: "",
    description: "",
    category: "Cafe",
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

  // Fetch Business Deals
  const fetchMyDeals = async () => {
    try {
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
    let isSubscribed = true;
    if (user) {
      dealApi.getMyDeals().then((response) => {
        if (!isSubscribed) return;
        setDeals(response.deals || []);
        if (response.metrics) {
          setMetrics(response.metrics);
        }
      }).catch((err) => {
        console.error("Failed to fetch business deals:", err);
      }).finally(() => {
        if (isSubscribed) setLoadingDeals(false);
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Toast Helper
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
    setFormData(initialFormState);
    setFormError("");
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
  }

  // Submit Deal (Create or Update)
  const handleSubmitDeal = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      if (editingDeal) {
        // Update
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
        // Create
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
            Merchant Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900">{user.name}</p>
            <p className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
              {user.role} • Member 2 Deals
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
        {/* Banner Card */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8503A] uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Flash Deal Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
              Create, publish, and manage real-time flash deals to fill slow business hours and drive immediate store foot traffic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4A2F] to-[#E8503A] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#E8503A]/25 hover:shadow-lg hover:shadow-[#E8503A]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <PlusCircle size={17} />
              <span>Create Flash Deal</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Site</span>
            </Link>
          </div>
        </div>

        {/* Real-Time Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <Layers size={16} />
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">{metrics.total}</p>
            <p className="text-[11px] text-gray-400 mt-1">All time promotions</p>
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
            <p className="text-[11px] text-emerald-700/80 mt-1">Available to customers now</p>
          </div>

          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Draft Deals</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Clock size={16} />
              </span>
            </div>
            <p className="text-3xl font-black text-amber-900">{metrics.draft}</p>
            <p className="text-[11px] text-amber-700/80 mt-1">Ready to publish</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Store Status</span>
              <ShieldCheck size={18} className="text-blue-500" />
            </div>
            <p className="text-lg font-black text-gray-900 truncate">
              {user.businessName || "Verified Store"}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Verified partner store</p>
          </div>
        </div>

        {/* Deals Management Section */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Section Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Your Flash Promotions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Filter, pause, edit, and monitor your active deals</p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeals.map((deal) => {
                const isActive = deal.status === "active";
                const isDraft = deal.status === "draft";
                const isExpired = deal.status === "expired";

                return (
                  <div
                    key={deal._id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between"
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
                            Rs. {deal.originalPrice}
                          </span>
                          <span className="text-base font-extrabold text-[#E8503A]">
                            Rs. {deal.discountedPrice}
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
                        <span>{deal.availableQuantity || 50} vouchers</span>
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
          )}
        </div>
      </main>

      {/* CREATE / EDIT FLASH DEAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
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
                    <option value="Cafe">Cafe</option>
                    <option value="Restaurant">Restaurant</option>
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
    </div>
  );
};

export default SellerDashboard;