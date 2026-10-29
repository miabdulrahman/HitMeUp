import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Zap,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(formData.email.trim(), formData.password);

      if (user?.role === "business" || user?.role === "seller") {
        navigate("/seller/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Demo user helper to ease testing for users/reviewers
  const fillDemo = (role) => {
    if (role === "customer") {
      setFormData({
        email: "customer@hitmeup.com",
        password: "Password123!",
      });
    } else {
      setFormData({
        email: "business@hitmeup.com",
        password: "Password123!",
      });
    }
    setError("");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#1A1A1A] flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden selection:bg-[#E8503A] selection:text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-[#FF4A2F]/15 to-[#FFB703]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full bg-gradient-to-tr from-[#E8503A]/10 to-[#10B981]/10 blur-3xl" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-[1040px] bg-white rounded-3xl sm:rounded-[32px] shadow-[0_24px_70px_rgba(40,20,10,0.08)] border border-black/[0.04] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Brand Showcase Panel (Desktop) */}
        <div className="relative lg:col-span-5 bg-gradient-to-br from-[#121824] via-[#1B2333] to-[#0F141E] p-8 sm:p-10 lg:p-12 text-white flex flex-col justify-between overflow-hidden">
          {/* Subtle geometric background orbs */}
          <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-[#E8503A]/20 blur-2xl" />
          <div className="pointer-events-none absolute bottom-10 left-0 h-48 w-48 rounded-full bg-[#FFD19A]/10 blur-xl" />

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

          {/* Center Showcase Narrative */}
          <div className="relative z-10 my-8 lg:my-0 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#FFD19A] border border-white/10 backdrop-blur-md">
              <Sparkles size={12} />
              <span>Location-Based Flash Deals</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] text-white">
                Real-time deals, <br />
                <span className="bg-gradient-to-r from-[#FF7B60] via-[#FFA97A] to-[#FFD19A] bg-clip-text text-transparent">
                  instant savings.
                </span>
              </h1>
              <p className="text-sm text-gray-300/90 leading-relaxed font-normal max-w-sm">
                Unlock exclusive discounts at top nearby merchants or effortlessly manage your store promotions.
              </p>
            </div>

            {/* Interactive Flash Deal Preview Card */}
            <div className="rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-4 shadow-xl hover:border-white/30 transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#FF4A2F] to-[#FF8C66] flex items-center justify-center text-white shadow-inner">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white tracking-wide">Artisan Woodfired Pizza</h2>
                    <p className="text-[11px] text-gray-300 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-[#FF8C66]" /> 0.3 miles away • Central Ave
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                  <Clock size={10} /> 24m left
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 line-through text-[11px] mr-1.5">$26.00</span>
                  <span className="text-base font-extrabold text-[#FFD19A]">$13.00</span>
                  <span className="ml-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">50% OFF</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-white/80 font-medium bg-white/10 px-2 py-1 rounded-lg">
                  <ShieldCheck size={12} className="text-[#FF8C66]" />
                  <span>Instant QR Pass</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof & Trust */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF4A2F] text-[10px] font-bold text-white ring-2 ring-[#121824]">
                  A
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-[#121824]">
                  M
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-[#121824]">
                  K
                </span>
              </div>
              <span className="text-[11px] text-white/80 font-medium">15,000+ local deal hunters</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 size={12} /> Verified deals
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8503A] uppercase tracking-wider">
                <span>Welcome Back</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Enter your credentials to access your vouchers, orders, and dashboard.
              </p>
            </div>

            {/* Quick Demo Pre-fill helper for frictionless testing */}
            <div className="mt-5 p-3 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                <Zap size={13} className="text-[#E8503A]" /> Quick Demo:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("customer")}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#1A1A1A] bg-white rounded-lg border border-gray-200 hover:border-[#E8503A] hover:text-[#E8503A] transition-colors shadow-2xs cursor-pointer"
                >
                  Shopper
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("business")}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#1A1A1A] bg-white rounded-lg border border-gray-200 hover:border-[#E8503A] hover:text-[#E8503A] transition-colors shadow-2xs cursor-pointer"
                >
                  Merchant
                </button>
              </div>
            </div>

            {/* Error Alert Banner */}
            {error && (
              <div
                className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn"
                role="alert"
              >
                <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                <div className="leading-relaxed font-medium">{error}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-gray-700 tracking-wide"
                >
                  Email address
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-gray-400">
                    <Mail size={17} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-gray-700 tracking-wide"
                  >
                    Password
                  </label>
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Please contact support at support@hitmeup.com to reset your credentials.");
                    }}
                    className="text-xs font-semibold text-[#E8503A] hover:text-[#D43A26] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-gray-400">
                    <Lock size={17} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E8503A] focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#E8503A]/10 transition-all"
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
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#E8503A] focus:ring-[#E8503A] cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 font-medium">Keep me signed in</span>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    <span>Sign In to HitMeUp</span>
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register link */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-600 font-normal">
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#E8503A] hover:text-[#C53522] hover:underline transition-colors"
                >
                  Create an account for free &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;