import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  ArrowLeft,
  Clock,
  MapPin,
  AlertCircle,
  QrCode,
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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F7F4EE] p-4 text-[#1F1B16] sm:p-6 lg:p-10">
      <div className="grid w-full max-w-[1000px] grid-cols-1 overflow-hidden rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] shadow-[0_2px_12px_rgba(31,27,22,0.05)] lg:grid-cols-12">
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
                Neighborhood voucher marketplace
              </p>
              <h1 className="text-[26px] sm:text-[30px] font-medium leading-[1.15] tracking-[-0.025em] text-[#FDFBF7]">
                Access your counter passes and{" "}
                <span className="serif font-normal text-[#D94832]">
                  storefront ledger
                </span>
              </h1>
              <p className="max-w-sm text-[14px] leading-[1.6] text-[#A89F91]">
                Sign in to view claimed QR vouchers, check nearby markdowns, or
                verify customer passes at your shop register.
              </p>
            </div>

            {/* Tactile LKR Voucher Preview Card */}
            <div className="rounded-xl border border-white/15 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[11px] text-[#A89F91]">
                    HMU-6412 · Food &amp; drink
                  </span>
                  <h2 className="mt-0.5 text-[14px] font-medium text-[#FDFBF7]">
                    Woodfired Margherita &amp; Iced Tea
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-[#A89F91]">
                    <MapPin size={12} strokeWidth={1.5} className="text-[#D94832]" />
                    <span>Park Street, Colombo 02 · 0.6 km</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-[5px] border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[11px] text-[#FDFBF7] tabular-nums">
                  <Clock size={11} strokeWidth={1.5} className="text-[#D94832]" />
                  45m left
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-white/15 pt-3 font-mono tabular-nums">
                <div>
                  <span className="text-[16px] font-medium text-[#FDFBF7]">
                    Rs. 1,400
                  </span>
                  <span className="ml-2 text-[12px] text-[#A89F91] line-through">
                    Rs. 2,800
                  </span>
                  <span className="ml-2 rounded-[5px] bg-[#D94832] px-1.5 py-0.5 text-[10px] font-medium text-white">
                    50% off
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-sans text-[11px] text-[#EFE9DF]">
                  <QrCode size={13} strokeWidth={1.5} />
                  <span>QR pass</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[12px] text-[#A89F91]">
            <span>Colombo &amp; islandwide stores</span>
            <span className="font-mono text-[11px] text-[#EFE9DF]">
              LKR counter redemption
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-7">
          <div className="mx-auto w-full max-w-md">
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium text-[#7B7266]">
                Account access
              </p>
              <h2 className="text-[24px] sm:text-[28px] font-medium tracking-[-0.025em] text-[#1F1B16]">
                Sign in to HitMeUp
              </h2>
              <p className="text-[14px] text-[#5E554A]">
                Enter your email and password to open your dashboard.
              </p>
            </div>

            {/* Quick Demo Pre-fill helper */}
            <div className="mt-5 flex items-center justify-between gap-2 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] p-3">
              <span className="text-[12px] font-medium text-[#5E554A]">
                Test account autofill
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("customer")}
                  className="rounded-md border border-[#E6E0D6] bg-[#FDFBF7] px-2.5 py-1 text-[12px] font-medium text-[#1F1B16] transition-colors hover:border-[#1F1B16]/40 cursor-pointer"
                >
                  Shopper
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("business")}
                  className="rounded-md border border-[#E6E0D6] bg-[#FDFBF7] px-2.5 py-1 text-[12px] font-medium text-[#1F1B16] transition-colors hover:border-[#1F1B16]/40 cursor-pointer"
                >
                  Merchant
                </button>
              </div>
            </div>

            {/* Error Alert Banner */}
            {error && (
              <div
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-[#B91C1C]/25 bg-[#B91C1C]/5 p-3.5 text-[13px] text-[#B91C1C]"
                role="alert"
              >
                <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[13px] font-medium text-[#1F1B16]"
                >
                  Email address
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                    <Mail size={16} strokeWidth={1.5} />
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
                    className="h-11 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-4 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[13px] font-medium text-[#1F1B16]"
                  >
                    Password
                  </label>
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        "Contact support@hitmeup.com to reset your account credentials."
                      );
                    }}
                    className="text-[12px] font-medium text-[#5E554A] hover:text-[#1F1B16]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                    <Lock size={16} strokeWidth={1.5} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-10 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
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
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E6E0D6] accent-[#D94832] cursor-pointer"
                  />
                  <span className="text-[13px] text-[#5E554A]">
                    Keep me signed in
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} strokeWidth={1.5} />
                    <span>Sign in</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-[#E6E0D6] pt-6 text-center">
              <p className="text-[13px] text-[#5E554A]">
                Don&apos;t have an account yet?{" "}
                <Link
                  to="/register"
                  className="font-medium text-[#D94832] hover:underline"
                >
                  Create an account &rarr;
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
