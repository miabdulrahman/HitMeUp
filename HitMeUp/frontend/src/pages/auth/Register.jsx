import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
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
                throw new Error(data.message || "Registration failed");
            }

            console.log("Registered user:", data);

            // Save user and token
            localStorage.setItem("token", data.token);
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setMessage("Account created successfully!");

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
                    }
                });
            }

        } catch (error) {
            console.error("Registration error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <div className="register-decoration register-decoration-one" />
            <div className="register-decoration register-decoration-two" />

            <section className="register-shell">
                <div className="register-info-panel">
                    <Link to="/" className="register-brand" aria-label="HitMeUp home">
                        <span>H</span> HitMe<span className="register-brand-accent">Up</span>
                    </Link>
                    <div className="register-info-content">
                        <p className="register-eyebrow">JOIN THE COMMUNITY</p>
                        <h1>Make every<br /><span>moment count.</span></h1>
                        <p>
                            Find better local offers, support businesses nearby,
                            and make your everyday spending go further.
                        </p>
                        <div className="register-benefits">
                            <div><strong>01</strong><span>Discover offers made for you</span></div>
                            <div><strong>02</strong><span>Save with instant digital vouchers</span></div>
                            <div><strong>03</strong><span>Redeem simply with a QR code</span></div>
                        </div>
                    </div>
                </div>

                <div className="register-form-panel">
                    <div className="register-heading">
                        <p className="register-eyebrow">CREATE YOUR ACCOUNT</p>
                        <h2>Let’s get started</h2>
                        <p>Join HitMeUp in less than a minute.</p>
                    </div>

                    {message && <div className="register-success" role="status">{message}</div>}
                    {error && <div className="register-error" role="alert">{error}</div>}

                    <form onSubmit={handleRegister} className="register-form">
                        <div className="register-form-grid">
                            <div className="register-field">
                                <label htmlFor="name">Full name</label>
                                <div className="register-input-wrap">
                                    <UserRound size={17} aria-hidden="true" />
                                    <input id="name" type="text" name="name" placeholder="Your name" value={formData.name} onChange={handleChange} autoComplete="name" required />
                                </div>
                            </div>
                            <div className="register-field">
                                <label htmlFor="phone">Phone <span>(optional)</span></label>
                                <div className="register-input-wrap">
                                    <Phone size={17} aria-hidden="true" />
                                    <input id="phone" type="tel" name="phone" placeholder="Your phone number" value={formData.phone} onChange={handleChange} autoComplete="tel" />
                                </div>
                            </div>
                        </div>

                        <div className="register-field">
                            <label htmlFor="register-email">Email address</label>
                            <div className="register-input-wrap">
                                <Mail size={17} aria-hidden="true" />
                                <input id="register-email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} autoComplete="email" required />
                            </div>
                        </div>

                        <div className="register-field">
                            <div className="register-label-row">
                                <label htmlFor="register-password">Password</label>
                                <span>At least 6 characters</span>
                            </div>
                            <div className="register-input-wrap">
                                <Lock size={17} aria-hidden="true" />
                                <input id="register-password" type={showPassword ? "text" : "password"} name="password" placeholder="Create a password" value={formData.password} onChange={handleChange} autoComplete="new-password" minLength={6} required />
                                <button type="button" className="register-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        <div className="register-field">
                            <label htmlFor="role">I’m joining as</label>
                            <select id="role" name="role" className="register-select" value={formData.role} onChange={handleChange} required>
                                <option value="">Select an account type</option>
                                <option value="buyer">Customer — find great deals</option>
                                <option value="seller">Business owner — share offers</option>
                            </select>
                        </div>

                        <button type="submit" className="register-submit" disabled={loading}>
                            <span>{loading ? "Creating your account..." : "Create account"}</span>
                            <ArrowRight size={18} aria-hidden="true" />
                        </button>
                    </form>

                    <p className="register-login">Already have an account? <Link to="/login">Sign in</Link></p>
                </div>
            </section>
        </main>
    );
};

export default Register;