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

    setMessage("");
    setError("");

    try {
      const user = await register(formData);

      setMessage("Account created successfully!");

      if (user?.role === "business") {
        navigate("/seller/dashboard");
      } else {
        navigate("/customer/dashboard");
      }

    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed");
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">

      <div
        className="card shadow-sm border-0"
        style={{
          width: "420px",
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: "#FF4A2F" }}>
              HitMeUp
            </h2>

            <p className="text-secondary">
              Create your customer account
            </p>
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

    </div >
  );
};

export default Register;