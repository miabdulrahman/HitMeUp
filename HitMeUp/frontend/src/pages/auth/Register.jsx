import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Phone, ArrowLeft, Building2 } from "lucide-react";
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

                        <h2
                            className="fw-bold"
                            style={{ color: "#FF4A2F" }}
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