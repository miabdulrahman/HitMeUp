import { useState } from "react";
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
  Ticket,
  ShieldCheck,
  Building2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await register(formData);

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

  return (
    <div className="register-page">
      {/* Background ambient accents */}
      <div className="register-decoration register-decoration-one" />
      <div className="register-decoration register-decoration-two" />

      <div className="register-shell">
        {/* Left Informational & Value Panel */}
        <div className="register-info-panel">
          <Link to="/" className="register-brand">
            <span>⚡</span>
            HitMe<strong className="register-brand-accent">Up</strong>
          </Link>

          <div className="register-info-content">
            <p className="register-eyebrow">EXCLUSIVE PERKS & DEALS</p>
            <h1>
              Start saving <span>on local favorites.</span>
            </h1>
            <p>
              Join thousands of smart shoppers grabbing instant discounts, QR vouchers, and flash promotions across top spots.
            </p>

            <div className="register-benefits">
              <div>
                <Sparkles size={16} className="text-[#ffd19a] flex-shrink-0" />
                <span>Instant digital vouchers delivered directly to your dashboard</span>
              </div>
              <div>
                <Ticket size={16} className="text-[#ffd19a] flex-shrink-0" />
                <span>Exclusive discounts up to 70% off across popular brands</span>
              </div>
              <div>
                <ShieldCheck size={16} className="text-[#ffd19a] flex-shrink-0" />
                <span>Secure checkouts and verified store promotions</span>
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors mt-auto pt-6"
          >
            <ArrowLeft size={14} />
            Back to deals catalog
          </Link>
        </div>

        {/* Right Form Panel */}
        <div className="register-form-panel">
          <div className="register-heading">
            <h2>Create account</h2>
            <p>Sign up in seconds. No credit card required.</p>
          </div>

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="register-form">
            {/* Form 2-Column Grid */}
            <div className="register-form-grid">
              {/* Full Name */}
              <div className="register-field">
                <label>
                  Full name
                </label>
                <div className="register-input-wrap">
                  <User size={16} />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Alex Silva"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Account Role */}
              <div className="register-field">
                <label>
                  I am a
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="register-select"
                >
                  <option value="customer">Shopper / Customer</option>
                  <option value="business">Store Owner / Business</option>
                </select>
              </div>
            </div>

            <div className="register-form-grid">
              {/* Email Address */}
              <div className="register-field">
                <label>
                  Email address
                </label>
                <div className="register-input-wrap">
                  <Mail size={16} />
                  <input
                    type="email"
                    name="email"
                    placeholder="alex@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="register-field">
                <label>
                  Phone number <span>(Optional)</span>
                </label>
                <div className="register-input-wrap">
                  <Phone size={16} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="register-field">
              <div className="register-label-row">
                <label htmlFor="reg-password">Password</label>
                <span>Min. 6 characters</span>
              </div>
              <div className="register-input-wrap">
                <Lock size={16} />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  minLength={6}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account & Start Saving</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed">
              By creating an account, you agree to HitMeUp's Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="register-login">
            Already have an account?{" "}
            <Link to="/login">
              Sign in &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;