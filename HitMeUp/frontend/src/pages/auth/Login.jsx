import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";

const Login = () => {

    const navigate = useNavigate();

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
            if (data.user.role === "business") {
                navigate("/seller/dashboard");
            } else {
                navigate("/customer/dashboard");
            }

        } catch (error) {

            console.error("Login error:", error);

            setError(error.message);

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

                    {/* Error */}
                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>

                        {/* Email */}
                        <div className="mb-3">

                            <label className="form-label fw-semibold">
                                Email
                            </label>

                            <div className="input-group">

                                <span className="input-group-text">
                                    <Mail size={18} />
                                </span>

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

                        </div>

                        {/* Password */}
                        <div className="mb-4">

                            <label className="form-label fw-semibold">
                                Password
                            </label>

                            <div className="input-group">

                                <span className="input-group-text">
                                    <Lock size={18} />
                                </span>

                                <input
                                    type="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                            disabled={loading}
                            style={{
                                backgroundColor: "#FF4A2F",
                                color: "white",
                                borderRadius: "9px",
                                padding: "10px",
                            }}
                        >

                            <LogIn size={18} />

                            {loading ? "Logging in..." : "Login"}

                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
};

export default Login;