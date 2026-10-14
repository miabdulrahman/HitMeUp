import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);

      if (user.role === "business") {
        navigate("/seller/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#F0F0F0]">
        {/* Back Link */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
            HitMe<span className="text-[#FF4A2F]">Up</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail size={17} />
              </span>
              <input
                type="email"
                name="email"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4A2F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4A2F]/20 transition-all"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock size={17} />
              </span>
              <input
                type="password"
                name="password"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4A2F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4A2F]/20 transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF4A2F] py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#e03e25] focus:outline-none focus:ring-2 focus:ring-[#FF4A2F]/40 active:scale-[0.99] transition-all disabled:opacity-60"
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-[#FF4A2F] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;