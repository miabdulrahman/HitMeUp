import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Ticket,
  User,
  LogOut,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { voucherApi, orderApi } from "../../services/api";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [vouchers, setVouchers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    setErrorMsg("");

    try {
      const [vouchersRes, ordersRes] = await Promise.allSettled([
        voucherApi.getMyVouchers(),
        orderApi.getMyOrders(),
      ]);

      if (vouchersRes.status === "fulfilled") {
        setVouchers(vouchersRes.value?.vouchers || vouchersRes.value?.data || []);
      }
      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value?.orders || ordersRes.value?.data || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setErrorMsg("Failed to synchronize with server. Please refresh.");
    } finally {
      setLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    if (isAuthenticated) {
      void Promise.resolve().then(() => fetchData());
    }
  }, [authLoading, fetchData, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5F2]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#FF4A2F]" />
          <p className="text-sm font-semibold text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  const activeVouchersCount = vouchers.filter(
    (v) => v.status === "active" || v.status === "ACTIVE"
  ).length;

  return (
    <div className="flex min-h-screen bg-[#F7F5F2]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white p-6 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 mb-8">
            <span className="text-2xl font-black tracking-tight text-[#1A1A1A]">
              HitMe<span className="text-[#FF4A2F]">Up</span>
            </span>
          </Link>

          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">
            Menu
          </p>

          <nav className="space-y-1">
            <SidebarBtn
              icon={<Home size={18} />}
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <SidebarBtn
              icon={<Ticket size={18} />}
              label="My Vouchers"
              badge={vouchers.length > 0 ? vouchers.length : null}
              active={activeTab === "vouchers"}
              onClick={() => setActiveTab("vouchers")}
            />
            <SidebarBtn
              icon={<ShoppingBag size={18} />}
              label="Orders"
              badge={orders.length > 0 ? orders.length : null}
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
            />
            <SidebarBtn
              icon={<User size={18} />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Sparkles size={16} className="text-[#FF4A2F]" />
            Explore More Deals
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "vouchers" && "My Purchased Vouchers"}
              {activeTab === "orders" && "Order History"}
              {activeTab === "profile" && "Account Profile"}
            </h1>
            <p className="text-xs text-gray-500">
              Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              disabled={loadingData}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
              title="Sync with backend"
            >
              <RefreshCw size={13} className={loadingData ? "animate-spin" : ""} />
              Sync
            </button>

            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="h-8 w-8 rounded-full bg-[#FF4A2F]/10 text-[#FF4A2F] flex items-center justify-center font-bold text-xs uppercase">
                {user?.name?.[0] || "U"}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</div>
                <div className="text-[10px] uppercase font-semibold text-gray-400">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Tab Bar */}
        <div className="flex border-b border-gray-200 bg-white px-4 py-2 gap-2 overflow-x-auto md:hidden">
          <MobileTabBtn label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <MobileTabBtn label={`Vouchers (${vouchers.length})`} active={activeTab === "vouchers"} onClick={() => setActiveTab("vouchers")} />
          <MobileTabBtn label={`Orders (${orders.length})`} active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
          <MobileTabBtn label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        </div>

        {/* Content Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          {errorMsg && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Total Orders"
                  value={orders.length}
                  icon={<ShoppingBag size={20} className="text-blue-500" />}
                  hint="All purchases made"
                />
                <StatCard
                  title="Active Vouchers"
                  value={activeVouchersCount}
                  icon={<Ticket size={20} className="text-[#FF4A2F]" />}
                  hint="Ready to redeem"
                />
                <StatCard
                  title="Backend Status"
                  value="Connected"
                  icon={<ShieldCheck size={20} className="text-emerald-500" />}
                  hint="MongoDB & API Live"
                />
              </div>

              {/* Recent Vouchers Preview */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">Recent Vouchers</h3>
                  <button
                    onClick={() => setActiveTab("vouchers")}
                    className="text-xs font-semibold text-[#FF4A2F] hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight size={13} />
                  </button>
                </div>

                {vouchers.length === 0 ? (
                  <EmptyState
                    title="No vouchers yet"
                    description="When you buy deals, your redeemable QR vouchers will appear right here."
                    actionLabel="Discover Deals"
                    actionHref="/#deals"
                  />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {vouchers.slice(0, 3).map((voucher) => (
                      <div key={voucher._id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 font-mono tracking-wider">
                            {voucher.voucherCode || voucher.code || voucher._id}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Status: <span className="uppercase font-semibold text-emerald-600">{voucher.status || "ACTIVE"}</span>
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                          {voucher.discountPercentage ? `${voucher.discountPercentage}% OFF` : "Active"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === "orders" && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No orders placed yet"
                    description="Your checkout and payment history will be safely tracked here."
                    actionLabel="View Live Deals"
                    actionHref="/#deals"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3">Order ID</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono font-medium text-gray-900">
                            {order._id}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            Rs. {order.amount?.toLocaleString() || "0"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                order.status === "PAID" || order.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : order.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {order.status || "PENDING"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
                <p className="text-xs text-gray-500">Your details registered on HitMeUp</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{user?.name || "N/A"}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{user?.email || "N/A"}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{user?.phone || "Not provided"}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Account Role
                  </label>
                  <p className="text-sm font-semibold uppercase text-[#FF4A2F]">{user?.role || "Customer"}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">Account status: Active</p>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const SidebarBtn = ({ icon, label, badge = null, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      active
        ? "bg-[#FF4A2F]/10 text-[#FF4A2F]"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {badge !== null && (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          active ? "bg-[#FF4A2F] text-white" : "bg-gray-200 text-gray-700"
        }`}
      >
        {badge}
      </span>
    )}
  </button>
);

const MobileTabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active ? "bg-[#FF4A2F] text-white" : "bg-gray-100 text-gray-700"
    }`}
  >
    {label}
  </button>
);

const StatCard = ({ title, value, icon, hint }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-gray-500">{title}</span>
      <div className="rounded-lg bg-gray-50 p-2 border border-gray-100">{icon}</div>
    </div>
    <div className="text-2xl font-black text-gray-900">{value}</div>
    <div className="mt-1 text-[11px] text-gray-400">{hint}</div>
  </div>
);

const EmptyState = ({ title, description, actionLabel, actionHref }) => (
  <div className="py-12 text-center flex flex-col items-center">
    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
      <Ticket size={22} />
    </div>
    <h4 className="text-sm font-bold text-gray-800">{title}</h4>
    <p className="mt-1 text-xs text-gray-500 max-w-sm">{description}</p>
    {actionLabel && (
      <Link
        to={actionHref}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#172026] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF4A2F] transition-colors"
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default CustomerDashboard;