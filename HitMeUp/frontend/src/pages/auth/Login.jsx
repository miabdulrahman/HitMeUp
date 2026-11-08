import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const user = await login(formData.email.trim(), formData.password);

      if (user?.role === "admin") {
        navigate("/admin");
      } else if (user?.role === "business" || user?.role === "seller") {
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

  const handleGoogleSuccess = useCallback(async (credential) => {
    setError("");
    setGoogleLoading(true);

    try {
      const user = await loginWithGoogle(credential);
      navigate(
        user?.role === "business" || user?.role === "seller"
          ? "/seller/dashboard"
          : "/customer/dashboard"
      );
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  const handleGoogleError = useCallback((err) => {
    setError(err.message || "Google sign-in failed. Please try again.");
  }, []);

  const handlePasswordResetSuccess = useCallback(({ email, message }) => {
    setFormData((previous) => ({ ...previous, email }));
    setSuccessMessage(message);
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F7F4EE] dark:bg-[#131209] p-4 text-[#1F1B16] dark:text-[#FDFBF7] sm:p-6 lg:p-10">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#E6E0D6] dark:border-[#272727] bg-[#FDFBF7] dark:bg-[#181818] p-6 sm:p-9 shadow-[0_4px_24px_rgba(31,27,22,0.06)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        {/* Top Header: Logo & Return Home */}
        <div className="flex items-center justify-between border-b border-[#E6E0D6] dark:border-[#272727] pb-4">
          <Link
            to="/"
            className="inline-flex items-center group py-0.5"
            aria-label="HitMeUp Home"
          >
            <img
              src={isDark ? "/logo-dark.png" : "/logo.png"}
              alt="HitMeUp"
              className="h-7.5 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#1F1F1F] px-3 py-1.5 text-[12px] font-medium text-[#5E554A] dark:text-[#CFC6B8] transition-colors hover:bg-[#EFE9DF] dark:hover:bg-[#272727] hover:text-[#1F1B16] dark:hover:text-[#FDFBF7]"
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            <span>Home</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="mt-6 space-y-1">
          <p className="text-[12px] font-medium text-[#7B7266] dark:text-[#8E867B]">
            Account access
          </p>
          <h1 className="text-[24px] sm:text-[28px] font-medium tracking-[-0.025em] text-[#1F1B16] dark:text-[#FDFBF7]">
            Sign in to HitMeUp
          </h1>
          <p className="text-[14px] text-[#5E554A] dark:text-[#CFC6B8]">
            Enter your email and password to open your dashboard.
          </p>
        </div>

        {/* Success Alert Banner */}
            {successMessage && (
              <div
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-[#166534]/25 bg-[#166534]/5 p-3.5 text-[13px] text-[#166534]"
                role="status"
              >
                <CheckCircle2 size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <div>{successMessage}</div>
              </div>
            )}

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
                    className="h-11 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-4 text-[16px] sm:text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
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
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccessMessage("");
                      setForgotPasswordOpen(true);
                    }}
                    className="text-[12px] font-medium text-[#5E554A] hover:text-[#D94832] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
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
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-10 text-[16px] sm:text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#7B7266] hover:text-[#1F1B16] cursor-pointer"
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E6E0D6] text-[#D94832] focus:ring-[#D94832]"
                  />
                  <span className="text-[13px] text-[#5E554A]">Remember this browser</span>
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

            <div className="my-5 flex items-center gap-3 text-[11px] text-[#7B7266]">
              <span className="h-px flex-1 bg-[#E6E0D6]" />
              <span>OR</span>
              <span className="h-px flex-1 bg-[#E6E0D6]" />
            </div>

            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={loading || googleLoading}
            />

            <div className="mt-8 border-t border-[#E6E0D6] dark:border-[#272727] pt-6 text-center">
              <p className="text-[13px] text-[#5E554A] dark:text-[#CFC6B8]">
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        initialEmail={formData.email}
        onSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};

export default Login;
