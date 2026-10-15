import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);

      if (user?.role === "business" || user?.role === "seller") {
        navigate("/seller/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center bg-light"
    >

      <div
        className="card border-0 shadow-sm"
        style={{
          width: "400px",
          borderRadius: "16px",
        }}
      >

        <div className="card-body p-4">

          {/* Logo */}
          <div className="text-center mb-4">

            <h2
              className="fw-bold"
              style={{ color: "#FF4A2F" }}
            >
              HitMeUp
            </h2>

            <p className="text-secondary mb-0">
              Welcome back
            </p>

          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>
              <div className="login-input-wrap">
                <Mail size={16} />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">Password</label>
                <Link to="#" className="text-xs text-[#E8503A] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="login-input-wrap">
                <Lock size={16} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <p className="login-signup">
            Don't have an account?{" "}
            <Link to="/register">
              Create an account &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;