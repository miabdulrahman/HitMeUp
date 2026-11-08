import { useState, useEffect, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { dealApi, businessApi, voucherApi, uploadApi } from "../../services/api";
import { convertToWebP } from "../../utils/imageOptimizer";
import { generateDeals } from "../../services/aiService";
import AICommandCenter from "../../components/AICommandCenter";
import SellerLocationMapPicker from "../../components/SellerLocationMapPicker";
import QrCameraScannerModal from "../../components/QrCameraScannerModal";
import {
  LogOut,
  Plus,
  Clock,
  Edit3,
  Trash2,
  Play,
  Pause,
  Search,
  X,
  AlertCircle,
  Layers,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  Check,
  Ticket,
  RefreshCw,
  LayoutGrid,
  List,
  Share2,
  Compass,
  BarChart3,
  Wand2,
  Upload,
  Camera,
  QrCode,
  Image as ImageIcon
} from "lucide-react";

const SellerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const user = location.state?.user || authUser;

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

  const [businessProfile, setBusinessProfile] = useState(null);
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
    logoUrl: "",
    coverImageUrl: "",
  });

  const [deals, setDeals] = useState([]);
  const [rawMetrics, setRawMetrics] = useState({ total: 0, active: 0, draft: 0, expired: 0, cancelled: 0 });
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [lastSynced, setLastSynced] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dealImageUploading, setDealImageUploading] = useState(false);
  const [dealUploadStatus, setDealUploadStatus] = useState("");
  const [storeLogoUploading, setStoreLogoUploading] = useState(false);
  const [storeCoverUploading, setStoreCoverUploading] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [autoRedeemOnScan, setAutoRedeemOnScan] = useState(true);

  const initialFormState = {
    title: "",
    description: "",
    category: "Restaurant",
    originalPrice: "",
    discountPercentage: 30,
    durationHours: 24,
    availableQuantity: 30,
    status: "active",
    terms: "Valid during store operating hours. One voucher per customer.",
    imageUrl: ""
  };
  const [formData, setFormData] = useState(initialFormState);

  const [aiProduct, setAiProduct] = useState("");
  const [aiTargetCustomer, setAiTargetCustomer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const fetchBusinessProfile = async () => {
    try {
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
          logoUrl: res.business.logoUrl || "",
          coverImageUrl: res.business.coverImageUrl || "",
        });
      }
    } catch (err) {
      console.info("Business profile not yet set up or using default:", err?.message);
    }
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (formError) setFormError("");
  };

  const originalPriceNum = Number(formData.originalPrice) || 0;
  const discountPctNum = Number(formData.discountPercentage) || 0;
  const calculatedDiscountedPrice = originalPriceNum > 0
    ? Math.max(0, Math.round(originalPriceNum * (1 - discountPctNum / 100)))
    : 0;
  const savingsAmount = originalPriceNum - calculatedDiscountedPrice;

  const isApproved =
    businessProfile?.applicationStatus === "approved" ||
    (businessProfile?.isVerified &&
      businessProfile?.applicationStatus !== "rejected" &&
      businessProfile?.applicationStatus !== "pending" &&
      businessProfile?.applicationStatus !== "under_review");

  const isSuspended =
    businessProfile?.status === "inactive" || Boolean(businessProfile?.suspensionReason);

  const handleOpenCreate = () => {
    if (isSuspended) {
      showToast("Your seller account is suspended. Deal publishing is disabled.");
      return;
    }
    if (!isApproved) {
      showToast("Your store is awaiting Super Admin approval. Deal publishing will unlock once approved.");
      return;
    }
    setIsProfileModalOpen(false);
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

  const handleOpenEdit = (deal) => {
    setIsProfileModalOpen(false);
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
      terms: deal.terms || "Valid during store operating hours. One voucher per customer.",
      imageUrl: deal.imageUrl || ""
    });
    setFormError("");
    setShowAiHelper(false);
    setIsModalOpen(true);
  };

  const handleOpenStoreModal = () => {
    setIsModalOpen(false);
    setActiveSection("store");
    setIsProfileModalOpen(true);
  };

  const handleGenerateAIDeal = async () => {
    const productName = aiProduct.trim();
    const originalPrice = Number.parseFloat(formData.originalPrice);

    if (!productName) {
      setFormError("Enter a product or service name to draft copy (e.g. 'Crispy Chicken Burger').");
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
        throw new Error("Invalid deal response format");
      }

      const updates = {};
      if (typeof generated.title === "string" && generated.title.trim()) {
        updates.title = generated.title.trim();
      }
      if (typeof generated.description === "string" && generated.description.trim()) {
        updates.description = generated.description.trim();
      }
      const rawDiscount = String(
        generated.discountPercentage ??
        generated.discount ??
        generated.suggestedDiscount ??
        ""
      ).replace(/[^0-9.]/g, "");
      const discount = Number(rawDiscount);
      if (Number.isFinite(discount) && discount >= 1 && discount <= 99) {
        updates.discountPercentage = Math.round(discount);
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("Could not generate readable deal fields. Try a more specific product name.");
      }

      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));

      showToast("Draft copy applied. Review and publish your deal.");
    } catch (error) {
      console.error("Deal generation error:", error);
      setFormError(error.message || "Failed to generate deal suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitDeal = async (e) => {
    e.preventDefault();
    if (isSuspended) {
      setFormError("Your seller account is currently suspended. Deal creation is disabled.");
      return;
    }
    if (!isApproved) {
      setFormError("Your store is awaiting Super Admin approval. Deals can only be published once approved.");
      return;
    }
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
          terms: formData.terms,
          imageUrl: formData.imageUrl || ""
        });
        showToast("Deal updated.");
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
          terms: formData.terms,
          imageUrl: formData.imageUrl || ""
        });
        showToast("Deal published to the neighborhood feed.");
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

  const handleToggleStatus = async (deal) => {
    const nextStatus = deal.status === "active" ? "draft" : "active";
    if (nextStatus === "active" && isSuspended) {
      showToast("Cannot activate deal while account is suspended.");
      return;
    }
    if (nextStatus === "active" && !isApproved) {
      showToast("Cannot activate deal while awaiting Super Admin approval.");
      return;
    }
    try {
      await dealApi.updateDealStatus(deal._id, nextStatus);
      showToast(`Deal switched to ${nextStatus === "active" ? "Live" : "Paused"}.`);
      fetchMyDeals();
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast(err.message || "Failed to update status");
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm("Permanently delete this deal?")) {
      return;
    }
    try {
      await dealApi.deleteDeal(dealId);
      showToast("Deal deleted.");
      fetchMyDeals();
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete deal");
    }
  };

  const handleCopyLink = (dealId) => {
    const url = `${window.location.origin}/deals?deal=${dealId}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(dealId);
    showToast("Deal link copied to clipboard.");
    setTimeout(() => setCopiedId(null), 2500);
  };

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
        },
        logoUrl: profileForm.logoUrl || "",
        coverImageUrl: profileForm.coverImageUrl || ""
      };

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        payload.location = {
          type: "Point",
          coordinates: [lng, lat]
        };
      }

      const res = await businessApi.updateMyBusiness(payload);
      if (res?.business) {
        setBusinessProfile(res.business);
      }
      showToast("Storefront details and map pin saved.");
      setIsProfileModalOpen(false);
      setActiveSection("home");
    } catch (err) {
      console.error("Profile update error:", err);
      showToast(err.message || "Failed to update business profile");
    }
  };


  const handleDealImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setDealImageUploading(true);
      setDealUploadStatus("Converting to WebP...");
      const webpFile = await convertToWebP(file, { maxWidth: 1600, maxHeight: 1200, quality: 0.85 });
      setDealUploadStatus("Uploading to cloud...");
      const res = await uploadApi.uploadImage(webpFile, "deals");
      if (res?.url) {
        setFormData((prev) => ({ ...prev, imageUrl: res.url }));
        showToast("Deal cover converted to WebP and uploaded.");
      }
    } catch (err) {
      console.error("Deal image upload error:", err);
      setFormError(err.message || "Failed to process and upload deal image");
    } finally {
      setDealImageUploading(false);
      setDealUploadStatus("");
      e.target.value = "";
    }
  };

  const handleStoreLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStoreLogoUploading(true);
      const webpFile = await convertToWebP(file, { maxWidth: 512, maxHeight: 512, quality: 0.9 });
      const res = await uploadApi.uploadImage(webpFile, "stores/logos");
      if (res?.url) {
        setProfileForm((prev) => ({ ...prev, logoUrl: res.url }));
        showToast("Store logo converted to WebP and uploaded.");
      }
    } catch (err) {
      console.error("Store logo upload error:", err);
      showToast(err.message || "Failed to upload store logo");
    } finally {
      setStoreLogoUploading(false);
      e.target.value = "";
    }
  };

  const handleStoreCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStoreCoverUploading(true);
      const webpFile = await convertToWebP(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 });
      const res = await uploadApi.uploadImage(webpFile, "stores/covers");
      if (res?.url) {
        setProfileForm((prev) => ({ ...prev, coverImageUrl: res.url }));
        showToast("Store cover banner converted to WebP and uploaded.");
      }
    } catch (err) {
      console.error("Store cover upload error:", err);
      showToast(err.message || "Failed to upload store cover banner");
    } finally {
      setStoreCoverUploading(false);
      e.target.value = "";
    }
  };

  const executeVoucherRedemption = async (codeToRedeem) => {
    const cleanCode = (codeToRedeem || "").trim().toUpperCase();
    if (!cleanCode) return;

    setRedeemLoading(true);
    setRedeemResult(null);

    try {
      const res = await voucherApi.redeemVoucher({
        voucherCode: cleanCode,
        businessId: businessProfile?._id
      });

      setRedeemResult({
        success: true,
        message: res.message || `Voucher ${cleanCode} verified and redeemed.`,
        data: res.voucher || res.redemption || { code: cleanCode },
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
      setVoucherCodeInput("");
      showToast(`Customer voucher ${cleanCode} redeemed.`);
      fetchMyDeals();
    } catch (err) {
      setRedeemResult({
        success: false,
        message: err.message || "Invalid or already redeemed voucher code. Check customer pass."
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    await executeVoucherRedemption(voucherCodeInput);
  };

  const handleQrCodeScanned = async (scannedCode) => {
    setIsQrScannerOpen(false);
    setVoucherCodeInput(scannedCode);
    if (autoRedeemOnScan) {
      await executeVoucherRedemption(scannedCode);
    } else {
      showToast(`Scanned code: ${scannedCode}`);
    }
  };

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
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E4E4E7] border-t-[#D94832]"></div>
          <p className="text-[13px] font-medium text-[#525252]">Loading merchant workspace...</p>
        </div>
      </div>
    );
  }

  const storeDisplayName = businessProfile?.name || user?.businessName || `${user?.name || "Merchant"}'s Store`;
  const storeCategory = businessProfile?.category || "Restaurant";
  const storeCity = businessProfile?.address?.city || "Colombo";
  const storeHours = businessProfile?.openingHours || "09:00 AM - 09:00 PM";
  const hasMapCoordinates =
    Array.isArray(businessProfile?.location?.coordinates) &&
    businessProfile.location.coordinates.length === 2 &&
    businessProfile.location.coordinates[0] !== 0;

  const navItems = [
    { key: "home", label: "Overview", icon: LayoutGrid },
    { key: "deals", label: "Store deals", icon: Layers, count: metrics.total },
    { key: "redeem", label: "Counter POS", icon: Ticket },
    { key: "ai", label: "Store insights", icon: BarChart3 },
    { key: "store", label: "Storefront & map pin", icon: Store },
  ];

  const sectionTitle = {
    home: "Merchant overview",
    deals: "Store deals",
    redeem: "Counter POS verification",
    ai: "Store insights",
    store: "Storefront & map pin"
  }[activeSection] || "Merchant overview";

  return (
    <div className="seller-dashboard-shell active-sec-${activeSection} flex min-h-screen bg-[#FAFAFA] text-[#171717]" data-active-section={activeSection}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-[#262626] bg-[#171717] px-4 py-3 text-[13px] font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar (240px Desktop App Shell) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-[#E4E4E7] bg-[#F4F4F5] lg:flex overflow-y-auto">
        <div>
          {/* Brand Header */}
          <div className="flex h-[60px] items-center justify-between border-b border-[#E4E4E7] px-4">
            <Link to="/" className="flex items-center" aria-label="HitMeUp Home">
              <img
                src={isDark ? "/logo-dark.png" : "/logo.png"}
                alt="HitMeUp"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <span className="rounded border border-[#D4D4D8] bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#525252]">
              Seller
            </span>
          </div>

          {/* Primary Action */}
          <div className="p-3 pb-1">
            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={!isApproved || isSuspended}
              title={
                isSuspended
                  ? "Seller account is suspended"
                  : !isApproved
                  ? "Awaiting Super Admin approval"
                  : "Create new flash deal"
              }
              className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors ${
                !isApproved || isSuspended
                  ? "bg-[#D4D4D8] text-[#71717A] cursor-not-allowed"
                  : "bg-[#D94832] text-white hover:bg-[#C23B26]"
              }`}
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              New deal
            </button>
          </div>

          {/* Aligned 36px Navigation Rows */}
          <nav className="p-3 space-y-0.5" aria-label="Merchant workspace">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.key === "store") {
                      handleOpenStoreModal();
                    } else {
                      setIsProfileModalOpen(false);
                      setActiveSection(item.key);
                    }
                  }}
                  className={`flex h-9 w-full items-center justify-between rounded-md px-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#E4E4E7]/80 text-[#171717]"
                      : "text-[#525252] hover:bg-[#E4E4E7]/40 hover:text-[#171717]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-[#525252]" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span className="font-mono text-[11px] tabular-nums text-[#737373]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="my-3 border-t border-[#E4E4E7]" />

            <Link
              to="/deals"
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-[#525252] transition-colors hover:bg-[#E4E4E7]/40 hover:text-[#171717]"
            >
              <Compass className="h-4 w-4 shrink-0 text-[#525252]" strokeWidth={1.5} />
              <span>Public deal feed</span>
            </Link>
          </nav>
        </div>

        {/* Store Account Footer */}
        <div className="border-t border-[#E4E4E7] p-3">
          <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
            {businessProfile?.logoUrl ? (
              <img
                src={businessProfile.logoUrl}
                alt={storeDisplayName}
                className="h-7 w-7 shrink-0 rounded-full object-cover border border-[#E4E4E7]"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#171717] font-mono text-[11px] font-medium text-white">
                {storeDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#171717]">
                {storeDisplayName}
              </p>
              <p className="truncate text-[11px] text-[#737373]">
                {storeCategory} · {storeCity}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[12px] font-medium text-[#525252] transition-colors hover:bg-[#E4E4E7]/50 hover:text-[#DC2626]"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Single Top Header (60px) */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#E4E4E7] bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center md:hidden" aria-label="HitMeUp Home">
              <img
                src={isDark ? "/logo-dark.png" : "/logo.png"}
                alt="HitMeUp"
                className="h-6 w-auto object-contain"
              />
            </Link>
            <h1 className="text-[15px] font-semibold text-[#171717]">
              {sectionTitle}
            </h1>
            {lastSynced && (
              <span className="hidden font-mono text-[11px] tabular-nums text-[#737373] md:inline-block">
                Synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative hidden w-56 sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#737373]" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeSection !== "deals" && activeSection !== "home") {
                    setActiveSection("deals");
                  }
                }}
                placeholder="Filter store deals..."
                className="h-8 w-full rounded-md border border-[#D4D4D8] bg-[#FAFAFA] pl-8 pr-7 text-[12px] text-[#171717] placeholder-[#737373] focus:border-[#171717] focus:bg-white focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchMyDeals}
              disabled={loadingDeals}
              title="Refresh store deals"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E4E4E7] bg-white px-2.5 text-[12px] font-medium text-[#525252] transition-colors hover:bg-[#F4F4F5] hover:text-[#171717]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingDeals ? "animate-spin text-[#D94832]" : ""}`} strokeWidth={1.5} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={!isApproved || isSuspended}
              title={
                isSuspended
                  ? "Seller account is suspended"
                  : !isApproved
                  ? "Awaiting Super Admin approval"
                  : "Create new flash deal"
              }
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors ${
                !isApproved || isSuspended
                  ? "bg-[#D4D4D8] text-[#71717A] cursor-not-allowed"
                  : "bg-[#D94832] text-white hover:bg-[#C23B26]"
              }`}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              New deal
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E4E4E7] bg-white px-2.5 text-[12px] font-medium text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Mobile Tab Strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E4E4E7] bg-[#F4F4F5] px-4 py-2 lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.key === "store") {
                  handleOpenStoreModal();
                } else {
                  setIsProfileModalOpen(false);
                  setActiveSection(item.key);
                }
              }}
              className={`shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium ${
                activeSection === item.key
                  ? "bg-[#171717] text-white"
                  : "text-[#525252]"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        {/* Workspace Canvas */}
        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
          {/* Super Admin Approval & Suspension Alert Banner */}
          {isSuspended ? (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">Merchant Account Suspended</h4>
                  <p className="mt-1 text-xs leading-relaxed text-red-700">
                    Your store has been suspended by administration{businessProfile?.suspensionReason ? ` (Reason: "${businessProfile.suspensionReason}")` : ""}. All your deals have been hidden from the buyer discovery feed, and publishing new deals is paused. Please contact Super Admin support to reactivate your store.
                  </p>
                </div>
              </div>
            </div>
          ) : !isApproved ? (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">Store Awaiting Super Admin Approval</h4>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    {businessProfile?.applicationStatus === "rejected"
                      ? `Your seller application was not approved (${businessProfile.rejectionReason || "Application rejected"}). You cannot publish deals until re-evaluated.`
                      : "Your merchant account is currently pending review by Super Admin. You can set up your store profile and preview draft deals, but deals will only become visible to buyers once approved."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Store Identity Bar (Shown on Overview & Store) */}
          {(activeSection === "home" || activeSection === "store") && (
            <div className="mb-6 overflow-hidden rounded-xl border border-[#E4E4E7] bg-white">
              {businessProfile?.coverImageUrl && (
                <div className="relative h-36 w-full sm:h-44 overflow-hidden bg-[#F4F4F5]">
                  <img
                    src={businessProfile.coverImageUrl}
                    alt={`${storeDisplayName} cover`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              )}
              <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  {businessProfile?.logoUrl ? (
                    <img
                      src={businessProfile.logoUrl}
                      alt={storeDisplayName}
                      className={`h-16 w-16 shrink-0 rounded-xl object-cover border-2 border-white shadow-sm ${
                        businessProfile?.coverImageUrl ? "-mt-10 relative z-10 bg-white" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#171717] font-mono text-[20px] font-semibold text-white border-2 border-white shadow-sm ${
                        businessProfile?.coverImageUrl ? "-mt-10 relative z-10" : ""
                      }`}
                    >
                      {storeDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                          Account Suspended
                        </span>
                      ) : businessProfile?.applicationStatus === "rejected" ? (
                        <span className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                          Application Rejected
                        </span>
                      ) : !isApproved ? (
                        <span className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending Super Admin Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-medium text-[#16A34A]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                          Verified Merchant
                        </span>
                      )}
                      <span className="rounded border border-[#E4E4E7] bg-[#FAFAFA] px-2 py-0.5 text-[11px] font-medium text-[#525252]">
                        {storeCategory}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] ${
                          hasMapCoordinates
                            ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]"
                            : "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]"
                        }`}
                      >
                        <MapPin className="h-3 w-3" strokeWidth={1.5} />
                        {hasMapCoordinates
                          ? `Pinned ${Number(businessProfile.location.coordinates[1]).toFixed(3)}°N, ${Number(businessProfile.location.coordinates[0]).toFixed(3)}°E`
                          : "Map pin not set"}
                      </span>
                    </div>

                    <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-[#171717]">
                      {storeDisplayName}
                    </h2>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#525252]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#737373]" strokeWidth={1.5} />
                        {businessProfile?.address?.street ? `${businessProfile.address.street}, ${storeCity}` : storeCity}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#737373]" strokeWidth={1.5} />
                        {storeHours}
                      </span>
                      {(businessProfile?.phone || user?.phone) && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="h-3.5 w-3.5 text-[#737373]" strokeWidth={1.5} />
                          {businessProfile?.phone || user?.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenStoreModal}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D4D4D8] bg-white px-3.5 text-[13px] font-medium text-[#171717] transition-colors hover:bg-[#F4F4F5]"
                  >
                    <Store className="h-3.5 w-3.5 text-[#D94832]" strokeWidth={1.5} />
                    Edit storefront & branding
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Numbers-Only Stat Strip (Shown on Overview & Deals) */}
          {(activeSection === "home" || activeSection === "deals") && (
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
                <p className="text-[12px] font-medium text-[#525252]">Total deals</p>
                <p className="mt-1.5 font-mono text-[28px] font-semibold leading-none tabular-nums text-[#171717]">
                  {metrics.total}
                </p>
                <p className="mt-1.5 text-[12px] text-[#737373]">
                  Avg. {metrics.avgDiscountRate}% off
                </p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
                <p className="text-[12px] font-medium text-[#525252]">Live in feed</p>
                <p className="mt-1.5 font-mono text-[28px] font-semibold leading-none tabular-nums text-[#16A34A]">
                  {metrics.active}
                </p>
                <p className="mt-1.5 text-[12px] text-[#737373]">
                  Claimable right now
                </p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
                <p className="text-[12px] font-medium text-[#525252]">Paused / drafts</p>
                <p className="mt-1.5 font-mono text-[28px] font-semibold leading-none tabular-nums text-[#D97706]">
                  {metrics.draft}
                </p>
                <p className="mt-1.5 text-[12px] text-[#737373]">
                  {metrics.expired} expired
                </p>
              </div>

              <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
                <p className="text-[12px] font-medium text-[#525252]">Open voucher pool</p>
                <p className="mt-1.5 font-mono text-[28px] font-semibold leading-none tabular-nums text-[#171717]">
                  {metrics.totalVouchersPool}
                </p>
                <p className="mt-1.5 text-[12px] text-[#737373]">
                  Remaining across deals
                </p>
              </div>
            </div>
          )}

          {/* Counter POS Voucher Redemption Card (Shown on Overview & POS) */}
          {(activeSection === "home" || activeSection === "redeem") && (
            <div className="seller-redeem-card mb-6 rounded-xl border border-[#E4E4E7] bg-white p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-[#D94832]" strokeWidth={1.5} />
                    <h3 className="text-[15px] font-semibold text-[#171717]">
                      Counter voucher verification
                    </h3>
                  </div>
                  <p className="mt-1 text-[13px] text-[#525252]">
                    Scan the customer&apos;s QR pass with your camera or enter their serial code (<span className="font-mono text-[12px] text-[#171717]">HMU-XXXX-XXXXXX</span>) at checkout.
                  </p>
                </div>

                <form onSubmit={handleRedeemVoucher} className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#D94832]/35 bg-[#D94832]/10 px-3.5 text-[13px] font-semibold text-[#D94832] transition-colors hover:bg-[#D94832] hover:text-white cursor-pointer"
                    title="Scan customer QR code using camera"
                  >
                    <Camera className="h-4 w-4" strokeWidth={1.75} />
                    <span>Scan QR</span>
                  </button>
                  <input
                    type="text"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                    placeholder="HMU-8420-CMB"
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-[#FAFAFA] px-3.5 font-mono text-[13px] uppercase tracking-wider text-[#171717] placeholder-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none sm:w-56"
                  />
                  <button
                    type="submit"
                    disabled={redeemLoading || !voucherCodeInput.trim()}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#262626] disabled:opacity-50 cursor-pointer"
                  >
                    {redeemLoading ? "Verifying..." : "Verify & redeem"}
                  </button>
                </form>
              </div>

              {redeemResult && (
                <div
                  className={`mt-4 flex items-center justify-between rounded-lg border px-4 py-3 text-[13px] ${
                    redeemResult.success
                      ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]"
                      : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {redeemResult.success ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="font-medium">{redeemResult.message}</span>
                    {redeemResult.timestamp && (
                      <span className="font-mono text-[11px] opacity-80">
                        ({redeemResult.timestamp})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRedeemResult(null)}
                    className="text-xs underline opacity-75 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Store Insights Section (Shown on AI tab) */}
          {activeSection === "ai" && (
            <div className="seller-ai-section mb-6">
              <AICommandCenter
                mode="seller"
                deals={deals}
                businessProfile={businessProfile}
                metrics={metrics}
                onSelectDeal={(deal) => handleOpenEdit(deal)}
              />
            </div>
          )}

          {/* Store Deals Ledger (Shown on Overview & Store Deals) */}
          {(activeSection === "home" || activeSection === "deals") && (
            <div className="seller-deals-section">
              {/* Filter & View Bar */}
              <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-[#E4E4E7] bg-white p-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { key: "all", label: "All deals", count: deals.length },
                    { key: "active", label: "Live", count: deals.filter((d) => d.status === "active").length },
                    { key: "draft", label: "Paused", count: deals.filter((d) => d.status === "draft").length },
                    { key: "expired", label: "Expired", count: deals.filter((d) => d.status === "expired").length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveFilter(tab.key)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors ${
                        activeFilter === tab.key
                          ? "bg-[#171717] text-white"
                          : "text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          activeFilter === tab.key ? "text-[#A3A3A3]" : "text-[#737373]"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-md border border-[#E4E4E7] bg-[#F4F4F5] p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`inline-flex h-7 items-center gap-1 rounded px-2.5 text-[12px] font-medium transition-colors ${
                        viewMode === "grid"
                          ? "bg-white text-[#171717] shadow-xs"
                          : "text-[#525252] hover:text-[#171717]"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={`inline-flex h-7 items-center gap-1 rounded px-2.5 text-[12px] font-medium transition-colors ${
                        viewMode === "table"
                          ? "bg-white text-[#171717] shadow-xs"
                          : "text-[#525252] hover:text-[#171717]"
                      }`}
                    >
                      <List className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Table
                    </button>
                  </div>
                </div>
              </div>

              {/* Deals Content */}
              {loadingDeals ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 animate-pulse rounded-xl border border-[#E4E4E7] bg-white p-5">
                      <div className="mb-4 h-4 w-24 rounded bg-[#F4F4F5]" />
                      <div className="mb-2 h-5 w-3/4 rounded bg-[#F4F4F5]" />
                      <div className="mb-6 h-4 w-full rounded bg-[#F4F4F5]" />
                      <div className="h-16 rounded-lg bg-[#F4F4F5]" />
                    </div>
                  ))}
                </div>
              ) : filteredDeals.length === 0 ? (
                <div className="rounded-xl border border-[#E4E4E7] bg-white p-12 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] text-[#525252]">
                    <Layers className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#171717]">
                    {searchQuery
                      ? `No deals matching "${searchQuery}"`
                      : activeFilter === "all"
                      ? "No store deals published yet"
                      : `No ${activeFilter} deals`}
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-[13px] text-[#525252]">
                    Create a time-limited neighborhood offer with a fixed voucher cap to start receiving walk-in redemptions.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="inline-flex h-9 items-center rounded-lg border border-[#D4D4D8] bg-white px-4 text-[13px] font-medium text-[#171717] hover:bg-[#F4F4F5]"
                      >
                        Clear search
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenCreate}
                      disabled={!isApproved || isSuspended}
                      title={
                        isSuspended
                          ? "Seller account is suspended"
                          : !isApproved
                          ? "Awaiting Super Admin approval"
                          : "Create new flash deal"
                      }
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium transition-colors ${
                        !isApproved || isSuspended
                          ? "bg-[#D4D4D8] text-[#71717A] cursor-not-allowed"
                          : "bg-[#D94832] text-white hover:bg-[#C23B26]"
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      Create first deal
                    </button>
                  </div>
                </div>
              ) : viewMode === "table" ? (
                /* Compact Ledger Table */
                <div className="overflow-hidden rounded-xl border border-[#E4E4E7] bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA] text-[11px] font-medium text-[#525252]">
                          <th className=" px-4 py-3">Deal</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Discount</th>
                          <th className="px-4 py-3">Vouchers left</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E4E7] text-[13px]">
                        {filteredDeals.map((deal) => {
                          const isLive = deal.status === "active";
                          const orig = Number(deal.originalPrice) || 0;
                          const disc =
                            Number(deal.discountedPrice) ||
                            Math.round(orig * (1 - (Number(deal.discountPercentage) || 0) / 100));
                          return (
                            <tr key={deal._id} className="hover:bg-[#FAFAFA]">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {deal.imageUrl ? (
                                    <img
                                      src={deal.imageUrl}
                                      alt={deal.title}
                                      className="h-10 w-10 shrink-0 rounded-lg object-cover border border-[#E4E4E7]"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F4F5] text-[#A1A1AA]">
                                      <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-[#171717]">{deal.title}</p>
                                    <p className="line-clamp-1 text-[12px] text-[#737373]">{deal.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[12px] text-[#525252]">{deal.category}</td>
                              <td className="px-4 py-3 font-mono tabular-nums">
                                <span className="font-semibold text-[#171717]">Rs. {disc.toLocaleString()}</span>
                                <span className="ml-1.5 text-[11px] text-[#737373] line-through">
                                  Rs. {orig.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-[12px] font-medium text-[#D94832]">
                                -{deal.discountPercentage}%
                              </td>
                              <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-[#171717]">
                                {deal.availableQuantity ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium ${
                                    isLive
                                      ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]"
                                      : "border-[#E4E4E7] bg-[#F4F4F5] text-[#525252]"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      isLive ? "bg-[#16A34A]" : "bg-[#737373]"
                                    }`}
                                  />
                                  {isLive ? "Live" : "Paused"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(deal)}
                                    className="rounded border border-[#E4E4E7] px-2 py-1 text-[11px] font-medium text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
                                  >
                                    {isLive ? "Pause" : "Publish"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(deal)}
                                    className="rounded border border-[#E4E4E7] p-1 text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
                                    title="Edit deal"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDeal(deal._id)}
                                    className="rounded border border-[#E4E4E7] p-1 text-[#525252] hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                                    title="Delete deal"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Perforated Merchant Deal Cards */
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDeals.map((deal) => {
                    const isLive = deal.status === "active";
                    const orig = Number(deal.originalPrice) || 0;
                    const disc =
                      Number(deal.discountedPrice) ||
                      Math.round(orig * (1 - (Number(deal.discountPercentage) || 0) / 100));
                    const serialSuffix = String(deal._id || "0000").slice(-4).toUpperCase();

                    return (
                      <article
                        key={deal._id}
                        className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#E4E4E7] bg-white"
                      >
                        <div className="p-5 pb-4">
                          {/* Top Row */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium ${
                                isLive
                                  ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]"
                                  : "border-[#E4E4E7] bg-[#F4F4F5] text-[#525252]"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isLive ? "bg-[#16A34A]" : "bg-[#737373]"
                                }`}
                              />
                              {isLive ? "Live in feed" : "Paused"}
                            </span>

                            <span className="rounded bg-[#D94832] px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-white">
                              -{deal.discountPercentage}%
                            </span>
                          </div>

                          {/* Title & Description */}
                          <h3 className="mt-3 line-clamp-1 text-[16px] font-semibold text-[#171717]">
                            {deal.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 min-h-[36px] text-[13px] leading-relaxed text-[#525252]">
                            {deal.description || "Redeemable in store during regular business hours."}
                          </p>

                          {/* Price & Pool */}
                          <div className="mt-4 flex items-baseline justify-between rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 py-2.5">
                            <div>
                              <span className="block text-[11px] text-[#737373]">Deal price</span>
                              <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                                <span className="text-[17px] font-semibold text-[#171717]">
                                  Rs. {disc.toLocaleString()}
                                </span>
                                <span className="text-[12px] text-[#737373] line-through">
                                  Rs. {orig.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[11px] text-[#737373]">Vouchers left</span>
                              <span className="font-mono text-[14px] font-semibold tabular-nums text-[#171717]">
                                {deal.availableQuantity ?? 30}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Perforated Divider */}
                        <div className="ticket-divider-app my-0.5" />

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between px-5 py-3">
                          <span className="font-mono text-[11px] text-[#737373]">
                            HMU-{serialSuffix}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(deal)}
                              className={`inline-flex h-7 items-center gap-1 rounded border px-2.5 text-[11px] font-medium transition-colors ${
                                isLive
                                  ? "border-[#E4E4E7] bg-white text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
                                  : "border-[#16A34A]/30 bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7]"
                              }`}
                            >
                              {isLive ? (
                                <>
                                  <Pause className="h-3 w-3" /> Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3" /> Publish
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLink(deal._id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E4E4E7] bg-white text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
                              title="Share deal link"
                            >
                              {copiedId === deal._id ? (
                                <Check className="h-3.5 w-3.5 text-[#16A34A]" />
                              ) : (
                                <Share2 className="h-3.5 w-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(deal)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E4E4E7] bg-white text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
                              title="Edit deal"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDeal(deal._id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#E4E4E7] bg-white text-[#525252] hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                              title="Delete deal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-[#171717]">
                  {editingDeal ? "Edit store deal" : "Create flash deal"}
                </h2>
                <p className="text-[12px] text-[#737373]">
                  Set the regular price, discount rate, and voucher cap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E4E7] text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeal} className="max-h-[82vh] overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] text-[#DC2626]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Pricing Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Regular price (Rs.) *
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    min="1"
                    required
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    placeholder="2500"
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 font-mono text-[14px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Discount ({formData.discountPercentage}%) *
                  </label>
                  <input
                    type="range"
                    name="discountPercentage"
                    min="5"
                    max="90"
                    step="5"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    className="mt-2.5 w-full accent-[#D94832]"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[11px] text-[#737373]">
                    <span>5%</span>
                    <span className="font-semibold text-[#D94832]">{formData.discountPercentage}% off</span>
                    <span>90%</span>
                  </div>
                </div>
              </div>

              {/* Live Price Preview */}
              {originalPriceNum > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-3">
                  <div>
                    <span className="text-[12px] text-[#525252]">Customer pays at counter</span>
                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-[18px] font-semibold text-[#171717]">
                        Rs. {calculatedDiscountedPrice.toLocaleString()}
                      </span>
                      <span className="text-[12px] text-[#737373] line-through">
                        Rs. {originalPriceNum.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="rounded border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-1 font-mono text-[12px] font-medium text-[#16A34A]">
                    Saves Rs. {savingsAmount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Optional Copy Assistant Toggle */}
              <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-[#525252]" strokeWidth={1.5} />
                    <span className="text-[12px] font-medium text-[#171717]">
                      Auto-draft title & description from item name
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiHelper(!showAiHelper)}
                    className="text-[12px] font-medium text-[#D94832] hover:underline"
                  >
                    {showAiHelper ? "Hide" : "Use assistant"}
                  </button>
                </div>

                {showAiHelper && (
                  <div className="mt-3 space-y-2.5 border-t border-[#E4E4E7] pt-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={aiProduct}
                        onChange={(e) => setAiProduct(e.target.value)}
                        placeholder="Item (e.g., Crab Kottu Platter)"
                        className="h-9 rounded-md border border-[#D4D4D8] bg-white px-3 text-[12px] text-[#171717] focus:border-[#171717] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={aiTargetCustomer}
                        onChange={(e) => setAiTargetCustomer(e.target.value)}
                        placeholder="Audience (e.g., Dinner crowd)"
                        className="h-9 rounded-md border border-[#D4D4D8] bg-white px-3 text-[12px] text-[#171717] focus:border-[#171717] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAIDeal}
                      disabled={aiLoading}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#171717] px-3 text-[12px] font-medium text-white hover:bg-[#262626] disabled:opacity-50"
                    >
                      {aiLoading ? "Drafting copy..." : "Draft deal copy"}
                    </button>
                  </div>
                )}
              </div>

              {/* Deal Cover Photo (WebP Enforced) */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-[#171717]">
                  <span>Deal cover photo</span>
                  <span className="text-[11px] font-mono text-[#16A34A] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                    Auto-converted to WebP
                  </span>
                </label>

                {formData.imageUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#FAFAFA]">
                    <img
                      src={formData.imageUrl}
                      alt="Deal cover preview"
                      className="h-40 w-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                        className="rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-black"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D4D4D8] bg-[#FAFAFA] p-5 text-center transition-colors cursor-pointer hover:border-[#171717] hover:bg-white ${
                      dealImageUploading ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDealImageChange}
                      className="hidden"
                      disabled={dealImageUploading}
                    />
                    <Upload className="h-6 w-6 text-[#737373]" strokeWidth={1.5} />
                    <span className="mt-2 text-[13px] font-medium text-[#171717]">
                      {dealImageUploading ? dealUploadStatus || "Processing..." : "Click to upload deal cover"}
                    </span>
                    <span className="mt-0.5 text-[11px] text-[#737373]">
                      Auto-converts to WebP before upload to cloud
                    </span>
                  </label>
                )}
              </div>

              {/* Deal Title */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                  Deal headline *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="35% off Sourdough & Espresso Combo"
                  className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 text-[14px] text-[#171717] focus:border-[#171717] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                  Offer details *
                </label>
                <textarea
                  name="description"
                  rows={2}
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What is included and when shoppers can redeem it in store."
                  className="w-full rounded-lg border border-[#D4D4D8] bg-white p-3 text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                />
              </div>

              {/* Category, Quantity, Duration */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafes & Bakery">Cafes & Bakery</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Beauty & Spa">Beauty & Spa</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Voucher cap
                  </label>
                  <input
                    type="number"
                    name="availableQuantity"
                    min="1"
                    max="1000"
                    value={formData.availableQuantity}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 font-mono text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    name="durationHours"
                    min="1"
                    max="720"
                    value={formData.durationHours}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 font-mono text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#E4E4E7] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 rounded-lg border border-[#D4D4D8] bg-white px-4 text-[13px] font-medium text-[#525252] hover:bg-[#F4F4F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !isApproved || isSuspended}
                  className="h-9 rounded-lg bg-[#D94832] px-5 text-[13px] font-medium text-white hover:bg-[#C23B26] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading
                    ? "Saving..."
                    : !isApproved
                    ? "Awaiting Super Admin Approval"
                    : isSuspended
                    ? "Account Suspended"
                    : editingDeal
                    ? "Save changes"
                    : "Publish deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storefront & Map Pin Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-[#171717]">
                  Storefront & map pin
                </h2>
                <p className="text-[12px] text-[#737373]">
                  Pin your exact shop coordinates so nearby buyers can find your deals on the street map.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  if (activeSection === "store") setActiveSection("home");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E4E7] text-[#525252] hover:bg-[#F4F4F5] hover:text-[#171717]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="max-h-[82vh] overflow-y-auto p-6 space-y-4">
              {/* Storefront Images (WebP Enforced) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Store Profile Logo */}
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-[#171717]">
                    <span>Store profile logo</span>
                    <span className="text-[10px] font-mono text-[#16A34A] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                      WebP
                    </span>
                  </label>
                  {profileForm.logoUrl ? (
                    <div className="relative flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-2.5">
                      <img
                        src={profileForm.logoUrl}
                        alt="Store logo"
                        className="h-14 w-14 rounded-lg object-cover border border-[#E4E4E7]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#171717] truncate">Logo uploaded</p>
                        <p className="text-[11px] text-[#737373]">Optimized WebP</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileForm((prev) => ({ ...prev, logoUrl: "" }))}
                        className="rounded-md border border-[#E4E4E7] bg-white px-2 py-1 text-[11px] font-medium text-[#525252] hover:bg-[#F4F4F5]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D4D4D8] bg-[#FAFAFA] p-4 text-center cursor-pointer hover:border-[#171717] hover:bg-white ${
                        storeLogoUploading ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStoreLogoChange}
                        className="hidden"
                        disabled={storeLogoUploading}
                      />
                      <Camera className="h-5 w-5 text-[#737373]" strokeWidth={1.5} />
                      <span className="mt-1 text-[12px] font-medium text-[#171717]">
                        {storeLogoUploading ? "Uploading..." : "Upload logo"}
                      </span>
                      <span className="text-[10px] text-[#737373]">Square logo or shop icon</span>
                    </label>
                  )}
                </div>

                {/* Store Cover Banner */}
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-[#171717]">
                    <span>Store cover banner</span>
                    <span className="text-[10px] font-mono text-[#16A34A] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                      WebP
                    </span>
                  </label>
                  {profileForm.coverImageUrl ? (
                    <div className="relative rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] overflow-hidden">
                      <img
                        src={profileForm.coverImageUrl}
                        alt="Store cover banner"
                        className="h-16 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setProfileForm((prev) => ({ ...prev, coverImageUrl: "" }))}
                        className="absolute top-1.5 right-1.5 rounded bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-black"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D4D4D8] bg-[#FAFAFA] p-4 text-center cursor-pointer hover:border-[#171717] hover:bg-white ${
                        storeCoverUploading ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStoreCoverChange}
                        className="hidden"
                        disabled={storeCoverUploading}
                      />
                      <ImageIcon className="h-5 w-5 text-[#737373]" strokeWidth={1.5} />
                      <span className="mt-1 text-[12px] font-medium text-[#171717]">
                        {storeCoverUploading ? "Uploading..." : "Upload cover photo"}
                      </span>
                      <span className="text-[10px] text-[#737373]">Wide store front or interior</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Store name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Galle Road Bakehouse"
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Primary category
                  </label>
                  <select
                    value={profileForm.category}
                    onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafes & Bakery">Cafes & Bakery</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Beauty & Spa">Beauty & Spa</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    City
                  </label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    placeholder="Colombo"
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+94 77 123 4567"
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 font-mono text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                    Opening hours
                  </label>
                  <input
                    type="text"
                    value={profileForm.openingHours}
                    onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                    placeholder="09:00 AM - 09:00 PM"
                    className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                  Street address
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="No. 42 Galle Road, Colombo 03"
                  className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 text-[13px] text-[#171717] focus:border-[#171717] focus:outline-none"
                />
              </div>

              {/* Interactive Map Pin Picker */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
                  Store map coordinates
                </label>
                <SellerLocationMapPicker
                  latitude={profileForm.latitude}
                  longitude={profileForm.longitude}
                  storeName={profileForm.name || storeDisplayName}
                  onChange={({ latitude, longitude }) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      latitude,
                      longitude,
                    }))
                  }
                  onAddressDetected={(detected) => {
                    if (detected?.street && !profileForm.address) {
                      setProfileForm((prev) => ({
                        ...prev,
                        address: detected.street,
                        city: detected.city || prev.city,
                      }));
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#E4E4E7] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    if (activeSection === "store") setActiveSection("home");
                  }}
                  className="h-9 rounded-lg border border-[#D4D4D8] bg-white px-4 text-[13px] font-medium text-[#525252] hover:bg-[#F4F4F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[#D94832] px-5 text-[13px] font-medium text-white hover:bg-[#C23B26]"
                >
                  Save storefront & pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Camera QR Code Scanner Modal */}
      <QrCameraScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onDetected={handleQrCodeScanned}
        autoRedeem={autoRedeemOnScan}
        onToggleAutoRedeem={setAutoRedeemOnScan}
      />
    </div>
  );
};

export default SellerDashboard;
