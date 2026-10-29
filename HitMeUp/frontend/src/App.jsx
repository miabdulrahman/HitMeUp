import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/useAuth";
import LandingPage from "./pages/LandingPage";
import CategoryPage from "./pages/CategoryPage";
import CustomerDashBoard from "./pages/customer/CustomerDashboard";
import SellerDashboard from "./pages/sellers/SellerDashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "seller" || user.role === "business") {
    return <Navigate to="/seller/dashboard" replace />;
  }
  return <Navigate to="/customer/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/deals" element={<CategoryPage />} />
          <Route path="/search" element={<CategoryPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/customer/dashboard" element={<CustomerDashBoard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
