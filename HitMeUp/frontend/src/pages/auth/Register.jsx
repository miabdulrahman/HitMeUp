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
  X,
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
  "Other",
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
    role: "customer",
    businessName: "",
    businessCategory: "Restaurant",
    city: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const cityContainerRef = useRef(null);

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
      if (
        (e.key === "ArrowDown" || e.key === "Enter") &&
        formData.city?.trim()
      ) {
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
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < citySuggestions.length
      ) {
        e.preventDefault();
        handleSelectCity(citySuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setIsCityOpen(false);
    }
  };

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
        return { text: "Weak", color: "bg-[#B91C1C]", textCol: "text-[#B91C1C]" };
      case 2:
        return { text: "Fair", color: "bg-[#B45309]", textCol: "text-[#B45309]" };
      case 3:
        return { text: "Good", color: "bg-[#1F1B16]", textCol: "text-[#1F1B16]" };
      case 4:
        return {
          text: "Strong",
          color: "bg-[#166534]",
          textCol: "text-[#166534]",
        };
      default:
        return {
          text: "Min 6 characters",
          color: "bg-[#E6E0D6]",
          textCol: "text-[#7B7266]",
        };
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
      setError("Please agree to the terms of service to create an account.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.role === "business" && !formData.phone?.trim()) {
      setError("A contact phone number is required to register a store.");
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
      setError(
        err.message || "Could not create account. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  const isBusiness = formData.role === "business";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F7F4EE] p-4 text-[#1F1B16] sm:p-6 lg:p-10">
      <div className="grid w-full max-w-[1040px] grid-cols-1 overflow-hidden rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] shadow-[0_2px_12px_rgba(31,27,22,0.05)] lg:grid-cols-12">
        {/* Left Brand Showcase Panel */}
        <div className="flex flex-col justify-between border-b border-[#E6E0D6] bg-[#1F1B16] p-8 text-[#FDFBF7] sm:p-10 lg:col-span-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FDFBF7] font-mono text-[14px] font-medium text-[#1F1B16]">
                H
              </span>
              <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#FDFBF7]">
                HitMeUp
              </span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-[#EFE9DF] transition-colors hover:bg-white/10"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              <span>Home</span>
            </Link>
          </div>

          <div className="my-8 space-y-6 lg:my-0">
            <div className="space-y-2.5">
              <p className="text-[12px] font-medium text-[#A89F91]">
                {isBusiness
                  ? "For merchants & store owners"
                  : "For neighborhood shoppers"}
              </p>
              <h1 className="text-[26px] sm:text-[30px] font-medium leading-[1.15] tracking-[-0.025em] text-[#FDFBF7]">
                {isBusiness ? (
                  <>
                    Publish timed passes to{" "}
                    <span className="serif font-normal text-[#D94832]">
                      fill quiet store hours
                    </span>
                  </>
                ) : (
                  <>
                    Claim local markdowns and{" "}
                    <span className="serif font-normal text-[#D94832]">
                      redeem at the counter
                    </span>
                  </>
                )}
              </h1>
              <p className="max-w-sm text-[14px] leading-[1.6] text-[#A89F91]">
                {isBusiness
                  ? "Set batch limits, pin your shop on the street map, and verify customer QR codes from one workspace."
                  : "Browse live neighborhood deals, reserve free walk-in passes, and present your QR code at checkout."}
              </p>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-5">
              {isBusiness ? (
                <>
                  <div className="flex items-center gap-3 text-[13px] text-[#EFE9DF]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[#D94832]">
                      <TrendingUp size={13} strokeWidth={1.5} />
                    </span>
                    <span>Cap exact voucher quantities per shift</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#EFE9DF]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[#D94832]">
                      <MapPin size={13} strokeWidth={1.5} />
                    </span>
                    <span>Pin your storefront on the discovery map</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#EFE9DF]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[#D94832]">
                      <ShieldCheck size={13} strokeWidth={1.5} />
                    </span>
                    <span>Verify serial codes at the counter register</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-[13px] text-[#EFE9DF]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[#D94832]">
                      <Ticket size={13} strokeWidth={1.5} />
                    </span>
                    <span>Serial QR passes stored in your account</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#EFE9DF]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[#D94832]">
                      <MapPin size={13} strokeWidth={1.5} />
                    </span>
                    <span>Filter active offers by street distance</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#EFE9DF]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[#D94832]">
                      <ShieldCheck size={13} strokeWidth={1.5} />
                    </span>
                    <span>All prices listed clearly in Sri Lankan Rupees (Rs.)</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[12px] text-[#A89F91]">
            <span>{isBusiness ? "Merchant workspace" : "Shopper passbook"}</span>
            <span className="font-mono text-[11px] text-[#EFE9DF]">
              Rs. 0 setup fee
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-7">
          <div className="mx-auto w-full max-w-md">
            <div className="space-y-1">
              <p className="text-[12px] font-medium text-[#7B7266]">
                New account
              </p>
              <h2 className="text-[24px] sm:text-[28px] font-medium tracking-[-0.025em] text-[#1F1B16]">
                {isBusiness ? "Register your store" : "Create your account"}
              </h2>
              <p className="text-[14px] text-[#5E554A]">
                {isBusiness
                  ? "Set up your merchant profile to publish flash passes."
                  : "Select your account type below to get started."}
              </p>
            </div>

            {/* Role Selector */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect("customer")}
                className={`relative rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                  !isBusiness
                    ? "border-[#1F1B16] bg-[#F7F4EE]"
                    : "border-[#E6E0D6] bg-white hover:bg-[#F7F4EE]/60"
                }`}
              >
                {!isBusiness && (
                  <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#1F1B16] text-white">
                    <CheckCircle2 size={11} strokeWidth={2} />
                  </span>
                )}
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg border ${
                    !isBusiness
                      ? "border-[#1F1B16] bg-[#1F1B16] text-white"
                      : "border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A]"
                  }`}
                >
                  <ShoppingBag size={15} strokeWidth={1.5} />
                </div>
                <div className="text-[13px] font-medium text-[#1F1B16]">
                  Shopper
                </div>
                <div className="mt-0.5 text-[11px] text-[#7B7266]">
                  Claim &amp; redeem passes
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("business")}
                className={`relative rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                  isBusiness
                    ? "border-[#1F1B16] bg-[#F7F4EE]"
                    : "border-[#E6E0D6] bg-white hover:bg-[#F7F4EE]/60"
                }`}
              >
                {isBusiness && (
                  <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#1F1B16] text-white">
                    <CheckCircle2 size={11} strokeWidth={2} />
                  </span>
                )}
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg border ${
                    isBusiness
                      ? "border-[#1F1B16] bg-[#1F1B16] text-white"
                      : "border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A]"
                  }`}
                >
                  <Store size={15} strokeWidth={1.5} />
                </div>
                <div className="text-[13px] font-medium text-[#1F1B16]">
                  Merchant
                </div>
                <div className="mt-0.5 text-[11px] text-[#7B7266]">
                  Publish store deals
                </div>
              </button>
            </div>

            {error && (
              <div
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#B91C1C]/25 bg-[#B91C1C]/5 p-3.5 text-[13px] text-[#B91C1C]"
                role="alert"
              >
                <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
              {isBusiness && (
                <>
                  <div className="space-y-1">
                    <label
                      htmlFor="businessName"
                      className="block text-[13px] font-medium text-[#1F1B16]"
                    >
                      Store name
                    </label>
                    <div className="relative flex items-center">
                      <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                        <Store size={16} strokeWidth={1.5} />
                      </div>
                      <input
                        id="businessName"
                        type="text"
                        name="businessName"
                        required={isBusiness}
                        placeholder="e.g. Commons Bakehouse"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-4 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="businessCategory"
                        className="block text-[13px] font-medium text-[#1F1B16]"
                      >
                        Category
                      </label>
                      <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                          <Building2 size={15} strokeWidth={1.5} />
                        </div>
                        <select
                          id="businessCategory"
                          name="businessCategory"
                          value={formData.businessCategory}
                          onChange={handleChange}
                          className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-3 text-[13px] font-medium text-[#1F1B16] focus:border-[#D94832] focus:outline-none cursor-pointer"
                        >
                          {BUSINESS_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div ref={cityContainerRef} className="relative space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="city"
                          className="block text-[13px] font-medium text-[#1F1B16]"
                        >
                          City or neighborhood
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                          <MapPin size={15} strokeWidth={1.5} />
                        </div>
                        <input
                          id="city"
                          type="text"
                          name="city"
                          autoComplete="off"
                          placeholder="e.g. Colombo 03, Kandy"
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
                          className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-8 text-[13px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                        />
                        {formData.city && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, city: "" }));
                              setCitySuggestions([]);
                              setIsCityOpen(false);
                            }}
                            className="absolute right-2.5 p-1 text-[#7B7266] hover:text-[#1F1B16] cursor-pointer"
                            title="Clear area"
                          >
                            <X size={14} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>

                      {isCityOpen && citySuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto divide-y divide-[#E6E0D6] rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] py-1 shadow-lg">
                          {citySuggestions.map((loc, idx) => {
                            const isHighlighted = activeSuggestionIndex === idx;
                            const isExactSelected = formData.city === loc;
                            return (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => handleSelectCity(loc)}
                                onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[12px] transition-colors cursor-pointer ${
                                  isHighlighted || isExactSelected
                                    ? "bg-[#EFE9DF] font-medium text-[#1F1B16]"
                                    : "text-[#5E554A] hover:bg-[#F7F4EE]"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <MapPin
                                    size={12}
                                    strokeWidth={1.5}
                                    className="shrink-0 text-[#D94832]"
                                  />
                                  <span className="truncate">{loc}</span>
                                </div>
                                {isExactSelected && (
                                  <Check
                                    size={12}
                                    strokeWidth={1.5}
                                    className="ml-2 shrink-0 text-[#166534]"
                                  />
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

              <div className="space-y-1">
                <label
                  htmlFor="name"
                  className="block text-[13px] font-medium text-[#1F1B16]"
                >
                  {isBusiness ? "Owner full name" : "Full name"}
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                    <User size={16} strokeWidth={1.5} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Kasun Perera"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-4 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="block text-[13px] font-medium text-[#1F1B16]"
                  >
                    {isBusiness ? "Business email" : "Email address"}
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                      <Mail size={15} strokeWidth={1.5} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-3 text-[13px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="phone"
                    className="block text-[13px] font-medium text-[#1F1B16]"
                  >
                    Phone{" "}
                    {isBusiness ? (
                      <span className="text-[#D94832]">*</span>
                    ) : (
                      <span className="font-normal text-[#7B7266]">(optional)</span>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                      <Phone size={15} strokeWidth={1.5} />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      required={isBusiness}
                      placeholder="+94 77 123 4567"
                      value={formData.phone}
                      onChange={handleChange}
                      className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-3 text-[13px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={passwordInputId}
                    className="block text-[13px] font-medium text-[#1F1B16]"
                  >
                    Password
                  </label>
                  {formData.password && (
                    <span className={`text-[11px] font-medium ${strengthInfo.textCol}`}>
                      {strengthInfo.text}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                    <Lock size={16} strokeWidth={1.5} />
                  </div>
                  <input
                    id={passwordInputId}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-10 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 text-[#7B7266] hover:text-[#1F1B16] cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                {formData.password && (
                  <div className="flex items-center gap-1 pt-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          pwdStrength >= level ? strengthInfo.color : "bg-[#E6E0D6]"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#E6E0D6] accent-[#D94832] cursor-pointer"
                  />
                  <span className="text-[12px] leading-normal text-[#5E554A]">
                    I agree to HitMeUp&apos;s{" "}
                    <span className="font-medium text-[#1F1B16] underline">
                      terms of service
                    </span>{" "}
                    and{" "}
                    <span className="font-medium text-[#1F1B16] underline">
                      privacy policy
                    </span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D94832] text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#C23B26] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} strokeWidth={1.5} />
                    <span>
                      {isBusiness ? "Register store" : "Create shopper account"}
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-[#E6E0D6] pt-5 text-center">
              <p className="text-[13px] text-[#5E554A]">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-[#D94832] hover:underline"
                >
                  Sign in &rarr;
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
