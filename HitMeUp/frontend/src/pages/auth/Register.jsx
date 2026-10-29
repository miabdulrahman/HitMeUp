import { useState, useId, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  Sparkles,
  Zap,
  ShoppingBag,
  Store,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Ticket,
  MapPin,
  Building2,
  Check,
  X
} from "lucide-react";
import { searchLocations } from "../../data/sriLankaLocations";
import { useAuth } from "../../context/useAuth";

const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Retail",
  "Fashion",
  "Electronics",
  "Health & Beauty",
  "Salon",
  "Fitness",
  "Entertainment",
  "Groceries",
  "Other"
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const passwordInputId = useId();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer", // "customer" or "business"
    businessName: "",
    businessCategory: "Restaurant",
    city: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-suggestion state for Sri Lanka locations / Colombo areas
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const cityContainerRef = useRef(null);

  // Close suggestion dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        cityContainerRef.current &&
        !cityContainerRef.current.contains(e.target)
      ) {
        setIsCityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCityInputChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, city: val }));
    setActiveSuggestionIndex(-1);
    if (val.trim().length > 0) {
      const matches = searchLocations(val, 20);
      setCitySuggestions(matches);
      setIsCityOpen(matches.length > 0);
    } else {
      setCitySuggestions([]);
      setIsCityOpen(false);
    }
  };

  const handleSelectCity = (locationName) => {
    setFormData((prev) => ({ ...prev, city: locationName }));
    setIsCityOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const handleCityKeyDown = (e) => {
    if (!isCityOpen || citySuggestions.length === 0) {
      if ((e.key === "ArrowDown" || e.key === "Enter") && formData.city?.trim()) {
        const matches = searchLocations(formData.city, 20);
        setCitySuggestions(matches);
        setIsCityOpen(matches.length > 0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < citySuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : citySuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < citySuggestions.length) {
        e.preventDefault();
        handleSelectCity(citySuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setIsCityOpen(false);
    }
  };

  // Compute password strength score (0-4)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 9) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd)) score++;
    return score;
  };

  const pwdStrength = getPasswordStrength(formData.password);

  const getStrengthLabel = (score) => {
    switch (score) {
      case 1:
        return { text: "Weak", color: "bg-red-500", textCol: "text-red-500" };
      case 2:
        return { text: "Fair", color: "bg-amber-500", textCol: "text-amber-500" };
      case 3:
        return { text: "Good", color: "bg-blue-500", textCol: "text-blue-500" };
      case 4:
        return { text: "Strong", color: "bg-emerald-500", textCol: "text-emerald-500" };
      default:
        return { text: "Min 6 chars", color: "bg-gray-200", textCol: "text-gray-400" };
    }
  };

  const strengthInfo = getStrengthLabel(pwdStrength);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service to create an account.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.role === "business" && !formData.phone?.trim()) {
      setError("Contact phone number is required to register a merchant business.");
      return;
    }

    setLoading(true);

    try {
      const isBusiness = formData.role === "business";
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        ...(isBusiness && {
          businessName: (formData.businessName || formData.name).trim(),
          businessCategory: formData.businessCategory || "Restaurant",
          city: (formData.city || "Colombo").trim(),
        }),
      };

      const user = await register(payload);

      if (user?.role === "business" || user?.role === "seller") {
        navigate("/seller/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  const isBusiness = formData.role === "business";

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#1A1A1A] flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden selection:bg-[#E8503A] selection:text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-[#FF4A2F]/15 to-[#FFB703]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[460px] w-[460px] rounded-full bg-gradient-to-tr from-[#E8503A]/10 to-[#10B981]/10 blur-3xl" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-[1080px] bg-white rounded-3xl sm:rounded-[32px] shadow-[0_24px_70px_rgba(40,20,10,0.08)] border border-black/[0.04] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Brand Showcase Panel (Desktop) */}
        <div className="relative lg:col-span-5 bg-gradient-to-br from-[#121824] via-[#1B2333] to-[#0F141E] p-8 sm:p-10 lg:p-12 text-white flex flex-col justify-between overflow-hidden">
          {/* Subtle geometric background orbs */}
          <div className="pointer-events-none absolute top-0 left-0 h-64 w-64 rounded-full bg-[#E8503A]/20 blur-2xl" />
          <div className="pointer-events-none absolute bottom-10 right-0 h-48 w-48 rounded-full bg-[#FFD19A]/10 blur-xl" />

          {/* Top Brand & Back Nav */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 group"
              title="HitMeUp Home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4A2F] to-[#E8503A] text-white shadow-md shadow-[#E8503A]/30 group-hover:scale-105 transition-transform duration-200">
                <Zap size={20} className="fill-white" />
              </span>
              <span className="text-xl font-black tracking-tight text-white">
                HitMe<span className="text-[#FF6647]">Up</span>
              </span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
            >
              <ArrowLeft size={13} />
              <span>Home</span>
            </Link>
          </div>

          {/* Center Showcase Narrative - changes context based on chosen role */}
          <div className="relative z-10 my-8 lg:my-0 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#FFD19A] border border-white/10 backdrop-blur-md">
              <Sparkles size={12} />
              <span>{isBusiness ? "For Merchants & Store Owners" : "For Deal Hunters & Shoppers"}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] text-white">
                {isBusiness ? (
                  <>
                    Turn slow hours into{" "}
                    <span className="bg-gradient-to-r from-[#FF7B60] via-[#FFA97A] to-[#FFD19A] bg-clip-text text-transparent">
                      record sales.
                    </span>
                  </>
                ) : (
                  <>
                    Never pay full price{" "}
                    <span className="bg-gradient-to-r from-[#FF7B60] via-[#FFA97A] to-[#FFD19A] bg-clip-text text-transparent">
                      at nearby spots.
                    </span>
                  </>
                )}
              </h1>
              <p className="text-sm text-gray-300/90 leading-relaxed font-normal max-w-sm">
                {isBusiness
                  ? "Launch flash deals in minutes, attract immediate foot traffic, and eliminate excess capacity with AI automation."
                  : "Discover flash deals up to 70% off within walking distance. Buy vouchers instantly and redeem in store with a single QR scan."}
              </p>
            </div>

            {/* Key Value Prop List */}
            <div className="space-y-3">
              {isBusiness ? (
                <>
                  <div className="flex items-center gap-3 text-xs text-gray-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <TrendingUp size={12} />
                    </span>
                    <span>Fill quiet afternoons and slow weekdays on-demand</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Sparkles size={12} />
                    </span>
                    <span>AI auto-generates compelling discounts and copy</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      <ShieldCheck size={12} />
                    </span>
                    <span>Automatic Business Profile created with zero setup fees</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-xs text-gray-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <Ticket size={12} />
                    </span>
                    <span>Digital QR vouchers stored securely on your phone</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Zap size={12} />
                    </span>
                    <span>Real-time location alerts when you are near active deals</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      <ShieldCheck size={12} />
                    </span>
                    <span>100% verified authentic local restaurants & shops</span>
                  </div>
                </>
              )}
            </div>

            {/* Testimonial Snippet */}
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-3.5 text-xs text-gray-300">
              <p className="italic text-white/90">
                {isBusiness
                  ? "“HitMeUp helped us turn Tuesday afternoon lulls into our 3rd busiest shift of the week.”"
                  : "“I saved over $80 on cafes and dinners near my office in just the first two weeks!”"}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-[#FFD19A]">
                <span>{isBusiness ? "— Dave M., Brew & Bites Cafe" : "— Sarah K., Colombo Foodie"}</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Row */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
            <span className="text-[11px] text-white/80 font-medium">Over 850+ stores active</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 size={12} /> Instant Merchant Profile Setup
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8503A] uppercase tracking-wider">
                <span>Join HitMeUp</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
                {isBusiness ? "Register your Business" : "Create your account"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {isBusiness
                  ? "Set up your merchant account to start publishing flash offers."
                  : "Choose your account type below to get started in seconds."}
              </p>
            </div>

            {/* Interactive Account Role Selector */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect("customer")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  !isBusiness
                    ? "border-[#E8503A] bg-[#E8503A]/[0.04] shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {!isBusiness && (
                  <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E8503A] text-white">
                    <CheckCircle2 size={11} />
                  </span>
                )}
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center mb-2 ${
                    !isBusiness ? "bg-[#E8503A] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <ShoppingBag size={18} />
                </div>
                <div className="text-xs font-bold text-gray-900">Shopper</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Find & buy deals</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("business")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  isBusiness
                    ? "border-[#E8503A] bg-[#E8503A]/[0.04] shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {isBusiness && (
                  <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E8503A] text-white">
                    <CheckCircle2 size={11} />
                  </span>
                )}
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center mb-2 ${
                    isBusiness ? "bg-[#E8503A] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Store size={18} />
                </div>
                <div className="text-xs font-bold text-gray-900">Merchant</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Sell flash deals</div>
              </button>
            </div>

            {/* Error Alert Banner */}
            {error && (
              <div
                className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn"
                role="alert"
              >
                <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                <div className="leading-relaxed font-medium">{error}</div>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
              {/* If Merchant: Show Business Name & Category first */}
              {isBusiness && (
                <>
                  <div className="space-y-1">
                    <label
                      htmlFor="businessName"
                      className="block text-xs font-bold text-gray-700 tracking-wide"
                    >
                      Business / Store Name
                    </label>
                    <div className="relative flex items-center">
                      <div className="pointer-events-none absolute left-3.5 text-gray-400">
                        <Store size={17} />
                      </div>
                      <input
                        id="businessName"
                        type="text"
                        name="businessName"
                        required={isBusiness}
                        placeholder="e.g. Bella Italia Trattoria or Urban Wear"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="businessCategory"
                        className="block text-xs font-bold text-gray-700 tracking-wide"
                      >
                        Business Category
                      </label>
                      <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 text-gray-400">
                          <Building2 size={16} />
                        </div>
                        <select
                          id="businessCategory"
                          name="businessCategory"
                          value={formData.businessCategory}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm font-medium text-gray-900 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all cursor-pointer"
                        >
                          {BUSINESS_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div ref={cityContainerRef} className="space-y-1 relative">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="city"
                          className="block text-xs font-bold text-gray-700 tracking-wide"
                        >
                          Store City / Area
                        </label>
                        <span className="text-[10px] font-semibold text-gray-400">
                          Sri Lanka
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 text-gray-400">
                          <MapPin size={16} />
                        </div>
                        <input
                          id="city"
                          type="text"
                          name="city"
                          autoComplete="off"
                          placeholder="e.g. Colombo 03, Kandy, Galle..."
                          value={formData.city}
                          onFocus={() => {
                            if (formData.city && formData.city.trim().length > 0) {
                              const matches = searchLocations(formData.city, 20);
                              setCitySuggestions(matches);
                              setIsCityOpen(matches.length > 0);
                            } else {
                              setIsCityOpen(false);
                            }
                          }}
                          onChange={handleCityInputChange}
                          onKeyDown={handleCityKeyDown}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
                        />
                        {formData.city && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, city: "" }));
                              setCitySuggestions([]);
                              setIsCityOpen(false);
                            }}
                            className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer transition"
                            title="Clear area"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Floating Auto-suggestions Dropdown */}
                      {isCityOpen && citySuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-200/90 bg-white shadow-2xl max-h-56 overflow-y-auto divide-y divide-gray-100 py-1.5 animate-fadeIn">
                          
                          {citySuggestions.map((loc, idx) => {
                            const isHighlighted = activeSuggestionIndex === idx;
                            const isExactSelected = formData.city === loc;
                            return (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => handleSelectCity(loc)}
                                onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition cursor-pointer ${
                                  isHighlighted
                                    ? "bg-[#FFF0ED] text-[#E8503A]"
                                    : isExactSelected
                                    ? "bg-gray-50 text-[#E8503A] font-bold"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <MapPin size={13} className="text-[#E8503A] shrink-0" />
                                  <span className="truncate">{loc}</span>
                                </div>
                                {isExactSelected && (
                                  <Check size={13} className="text-[#E8503A] shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Full Name / Business Owner Name */}
              <div className="space-y-1">
                <label
                  htmlFor="name"
                  className="block text-xs font-bold text-gray-700 tracking-wide"
                >
                  {isBusiness ? "Account Owner Full Name" : "Full name"}
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-gray-400">
                    <User size={17} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    placeholder={isBusiness ? "e.g. Dave Miller" : "e.g. Alex Silva"}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
                  />
                </div>
              </div>

              {/* Email Address & Phone Number in 2-Col on SM screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-gray-700 tracking-wide"
                  >
                    {isBusiness ? "Business Email" : "Email address"}
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3.5 text-gray-400">
                      <Mail size={16} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      required
                      placeholder={isBusiness ? "store@example.com" : "alex@example.com"}
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label
                    htmlFor="phone"
                    className="block text-xs font-bold text-gray-700 tracking-wide"
                  >
                    Phone {isBusiness ? <span className="text-[#E8503A]">*</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3.5 text-gray-400">
                      <Phone size={16} />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      required={isBusiness}
                      placeholder="+94 77 123 4567"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={passwordInputId}
                    className="block text-xs font-bold text-gray-700 tracking-wide"
                  >
                    Password
                  </label>
                  {formData.password && (
                    <span className={`text-[11px] font-bold ${strengthInfo.textCol}`}>
                      {strengthInfo.text}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-gray-400">
                    <Lock size={17} />
                  </div>
                  <input
                    id={passwordInputId}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={6}
                    placeholder="Create a password (min. 6 chars)"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Password Strength Indicator Bar */}
                {formData.password && (
                  <div className="pt-1.5 flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          pwdStrength >= level ? strengthInfo.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#E8503A] focus:ring-[#E8503A] cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 leading-normal">
                    I agree to HitMeUp's{" "}
                    <span className="text-[#E8503A] underline font-medium">Terms of Service</span> and{" "}
                    <span className="text-[#E8503A] underline font-medium">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 h-12 rounded-xl bg-gradient-to-r from-[#FF4A2F] via-[#E8503A] to-[#DC3822] text-white font-bold text-sm tracking-wide shadow-[0_10px_25px_rgba(232,80,58,0.28)] hover:shadow-[0_14px_30px_rgba(232,80,58,0.38)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Creating account & business profile...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    <span>{isBusiness ? "Register Store & Start Selling" : "Create Account & Start Saving"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Switch to Login link */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-600 font-normal">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-[#E8503A] hover:text-[#C53522] hover:underline transition-colors"
                >
                  Sign in here &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;