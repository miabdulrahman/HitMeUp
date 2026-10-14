import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";

const Login = () => {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            console.log("Login response:", data);

            // Save token
            localStorage.setItem("token", data.token);

            // Save logged-in user
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            // Decide dashboard based on role
            if (data.user.role === "seller") {
                navigate("/seller/dashboard", {
                    state: {
                        user: data.user,
                    }
                });
            } else {
                navigate("/customer/dashboard", {
                    state: {
                        user: data.user,
                    },
                });
            }

        } catch (error) {

            console.error("Login error:", error);

            setError(error.message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-decoration login-decoration-one" />
            <div className="login-decoration login-decoration-two" />

            <section className="login-shell">
                <div className="login-brand-panel">
                    <div className="login-brand-mark">H</div>
                    <p className="login-eyebrow">WELCOME TO HITMEUP</p>
                    <h1>Good deals.<br /><span>Good moments.</span></h1>
                    <p className="login-brand-copy">
                        Discover local offers and connect with businesses you love.
                    </p>
                    <div className="login-brand-pills">
                        <span>Local offers</span>
                        <span>Easy savings</span>
                    </div>
                </div>

                <div className="login-form-panel">
                    <div className="login-heading">
                        <p className="login-eyebrow">YOUR ACCOUNT</p>
                        <h2>Welcome back</h2>
                        <p>Sign in to continue your HitMeUp journey.</p>
                    </div>

                    {error && (
                        <div className="login-error" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="login-field">
                            <label htmlFor="email">Email address</label>
                            <div className="login-input-wrap">
                                <Mail size={18} aria-hidden="true" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-field">
                            <div className="login-label-row">
                                <label htmlFor="password">Password</label>
                                <span>Keep it secure</span>
                            </div>
                            <div className="login-input-wrap">
                                <Lock size={18} aria-hidden="true" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="login-password-toggle"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-submit" disabled={loading}>
                            <span>{loading ? "Signing you in..." : "Sign in"}</span>
                            <LogIn size={18} aria-hidden="true" />
                        </button>
                    </form>

                    <p className="login-signup">
                        New to HitMeUp? <Link to="/register">Create an account</Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Login;