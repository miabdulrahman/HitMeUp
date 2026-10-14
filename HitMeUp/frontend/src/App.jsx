import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import CustomerDashBoard from "./pages/customer/CustomerDashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

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
          <Route path="seller/dashboard" element={<SellerDashboard/>}/>
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;