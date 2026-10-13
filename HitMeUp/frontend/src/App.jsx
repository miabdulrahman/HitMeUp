import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CustomerDashBoard from "./pages/customer/CustomerDashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SellerDashboard from "./pages/sellers/SellerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="customer/dashboard" element={<CustomerDashBoard />} />
        <Route path="seller/dashboard" element={<SellerDashboard/>}/>
      </Routes>
    </BrowserRouter>

  )
}

export default App;