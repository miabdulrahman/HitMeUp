import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Building2, LogOut, ArrowLeft, ShieldCheck, PlusCircle } from "lucide-react";

const SellerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = location.state?.user || authUser;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F2] px-4 text-center">
        <p className="text-sm font-semibold text-gray-700">User information is unavailable.</p>
        <Link
          to="/login"
          className="mt-4 rounded-xl bg-[#172026] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF4A2F] transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Top Bar */}
      <header className="border-b border-gray-200 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-black text-[#1A1A1A]">
            HitMe<span className="text-[#FF4A2F]">Up</span>
          </Link>
          <span className="rounded bg-[#FF4A2F]/10 px-2 py-0.5 text-xs font-bold text-[#FF4A2F] uppercase">
            Business Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900">{user.name}</p>
            <p className="text-[10px] uppercase font-semibold text-gray-500">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl p-8 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-xs text-gray-500 mt-1">Manage your storefront, active deals, and voucher redemptions.</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Site
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Business Status</span>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-gray-900">Active</p>
            <p className="text-[11px] text-gray-400 mt-1">Account verified</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Business Name</span>
              <Building2 size={18} className="text-blue-500" />
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">{user.businessName || user.name}</p>
            <p className="text-[11px] text-gray-400 mt-1">{user.email}</p>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#FF4A2F] transition-colors">
            <PlusCircle size={24} className="text-[#FF4A2F] mb-1" />
            <p className="text-xs font-bold text-gray-900">Create New Deal</p>
            <p className="text-[10px] text-gray-400">Launch a limited-time offer</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;