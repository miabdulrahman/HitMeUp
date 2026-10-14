import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import CustomerDashBoard from "./pages/customer/CustomerDashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Helper component to route users to the appropriate dashboard
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "business") {
    return <CustomerDashBoard />; // Shared or customer dashboard until business dashboard is ready
  }
  return <Navigate to="/customer/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/customer/dashboard" element={<CustomerDashBoard />} />
          <Route path="/seller/dashboard" element={<CustomerDashBoard />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;