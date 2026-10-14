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
    role: "buyer",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

            <div
                className="card shadow-sm border-0"
                style={{
                    width: "420px",
                    borderRadius: "16px",
                }}
            >
              HitMeUp
            </h2>

            <p className="text-secondary">
              Create your customer account
            </p>

          </div>

          {message && (
            <div className="alert alert-success">
              {message}
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>

            {/* Name */}
            <div className="mb-3">
              <label className="form-label">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone */}
            <div className="mb-3">
              <label className="form-label">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                className="form-control"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label">
                Password
              </label>

              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn w-100"
              style={{
                backgroundColor: "#FF4A2F",
                color: "white",
              }}
            >
              Create Account
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};

export default Register;