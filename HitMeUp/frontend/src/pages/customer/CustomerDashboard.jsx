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
  AlertCircle,
  Copy,
  Check,
  QrCode,
  X,
  Clock,
  Store,
  Tag,
  CheckCircle2
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
  const [copiedCode, setCopiedCode] = useState(null);

  // Selected voucher for QR Pass modal
  const [selectedVoucherForQR, setSelectedVoucherForQR] = useState(null);
  const [voucherFilter, setVoucherFilter] = useState("all"); // all, active, redeemed, expired

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

  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#E8503A]" />
          <p className="text-xs font-bold text-gray-600 tracking-wider uppercase">Loading your shopper account...</p>
        </div>
      </div>
    );
  }

  const activeVouchers = vouchers.filter(
    (v) => (v.status === "active" || v.status === "ACTIVE") && (!v.expiresAt || new Date(v.expiresAt) > new Date())
  );
  const redeemedVouchers = vouchers.filter(
    (v) => v.status === "redeemed" || v.status === "REDEEMED"
  );
  const expiredVouchers = vouchers.filter(
    (v) => v.status === "expired" || v.status === "EXPIRED" || (v.expiresAt && new Date(v.expiresAt) < new Date())
  );

  const filteredVouchers = vouchers.filter((v) => {
    const isAct = (v.status === "active" || v.status === "ACTIVE") && (!v.expiresAt || new Date(v.expiresAt) > new Date());
    const isRed = v.status === "redeemed" || v.status === "REDEEMED";
    const isExp = v.status === "expired" || v.status === "EXPIRED" || (v.expiresAt && new Date(v.expiresAt) < new Date());

    if (voucherFilter === "active") return isAct;
    if (voucherFilter === "redeemed") return isRed;
    if (voucherFilter === "expired") return isExp;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#1A1A1A] selection:bg-[#E8503A] selection:text-white">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-gray-200/90 bg-white p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 mb-8">
            <span className="text-2xl font-black tracking-tight text-[#1A1A1A]">
              HitMe<span className="text-[#E8503A]">Up</span>
            </span>
          </Link>

          <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-3 px-3">
            Customer Menu
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
              label="Order History"
              badge={orders.length > 0 ? orders.length : null}
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
            />
            <SidebarBtn
              icon={<User size={18} />}
              label="My Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <Link
            to="/#deals"
            className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#E8503A] rounded-xl hover:bg-orange-50/50 transition-colors"
          >
            <Sparkles size={16} className="text-[#E8503A]" />
            <span>Discover Flash Deals</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-gray-200/90 bg-white/95 px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "vouchers" && "My Digital Vouchers & QR Passes"}
              {activeTab === "orders" && "Order & Payment History"}
              {activeTab === "profile" && "Account Profile"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Welcome back, <span className="font-bold text-gray-800">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={fetchData}
              disabled={loadingData}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Sync latest voucher status"
            >
              <RefreshCw size={13} className={loadingData ? "animate-spin text-[#E8503A]" : "text-gray-500"} />
              <span>{loadingData ? "Syncing..." : "Sync"}</span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="h-8 w-8 rounded-full bg-[#E8503A]/10 text-[#E8503A] flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                {user?.name?.[0] || "U"}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</div>
                <div className="text-[10px] uppercase font-semibold text-emerald-600">Verified Shopper</div>
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
        <main className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-7">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-7">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active Passes</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                      <Ticket size={16} />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-emerald-950">{activeVouchers.length}</p>
                    <span className="text-xs font-bold text-emerald-600">Ready to redeem</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 mt-1">Available at partner stores</p>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Claims</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <ShoppingBag size={16} />
                    </span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{vouchers.length}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Total promotions claimed</p>
                </div>

                <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-xs sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Redeemed Deals</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                      <CheckCircle2 size={16} />
                    </span>
                  </div>
                  <p className="text-3xl font-black text-blue-950">{redeemedVouchers.length}</p>
                  <p className="text-[11px] text-blue-700/80 mt-1">Successfully verified at store</p>
                </div>
              </div>

              {/* Recent Vouchers Preview */}
              <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">Your Active Digital Passes</h3>
                    <p className="text-xs text-gray-500">Tap any voucher to display its QR code for scanning</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("vouchers")}
                    className="text-xs font-bold text-[#E8503A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all ({vouchers.length})</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {vouchers.length === 0 ? (
                  <EmptyState
                    title="No vouchers claimed yet"
                    description="When you claim limited-time flash promotions, your unique digital passes and QR codes will appear right here."
                    actionLabel="Explore Live Deals"
                    actionHref="/#deals"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vouchers.slice(0, 3).map((voucher) => (
                      <VoucherCard
                        key={voucher._id}
                        voucher={voucher}
                        onShowQR={() => setSelectedVoucherForQR(voucher)}
                        onCopyCode={(code, e) => handleCopyCode(code, e)}
                        copiedCode={copiedCode}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VOUCHERS (FULL VOUCHERS MANAGEMENT) */}
          {activeTab === "vouchers" && (
            <div className="space-y-6">
              {/* Filter Tabs Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-2 bg-gray-100/90 p-1 rounded-2xl w-fit">
                  {[
                    { key: "all", label: "All Vouchers", count: vouchers.length },
                    { key: "active", label: "Active Passes", count: activeVouchers.length },
                    { key: "redeemed", label: "Redeemed", count: redeemedVouchers.length },
                    { key: "expired", label: "Expired", count: expiredVouchers.length }
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setVoucherFilter(f.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        voucherFilter === f.key
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          voucherFilter === f.key
                            ? "bg-[#E8503A]/10 text-[#E8503A]"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <Link
                  to="/#deals"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8503A] hover:underline"
                >
                  <Sparkles size={14} />
                  <span>Claim more flash deals &rarr;</span>
                </Link>
              </div>

              {filteredVouchers.length === 0 ? (
                <div className="rounded-3xl border border-gray-200/80 bg-white p-12 text-center shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A] mb-3">
                    <Ticket size={28} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">No {voucherFilter !== "all" ? voucherFilter : ""} vouchers found</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
                    {voucherFilter === "active"
                      ? "You don't have any active unredeemed passes right now. Browse the marketplace for new flash promotions!"
                      : "Claim digital vouchers on any flash deal to get instant discounts at local stores."}
                  </p>
                  <Link
                    to="/#deals"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8503A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D43A26] transition shadow-xs"
                  >
                    <span>Browse Flash Marketplace</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredVouchers.map((voucher) => (
                    <VoucherCard
                      key={voucher._id}
                      voucher={voucher}
                      onShowQR={() => setSelectedVoucherForQR(voucher)}
                      onCopyCode={(code, e) => handleCopyCode(code, e)}
                      copiedCode={copiedCode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === "orders" && (
            <div className="rounded-3xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Order & Checkout Records</h3>
                  <p className="text-xs text-gray-500">Official transaction receipts for all claimed flash promotions</p>
                </div>
              </div>

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
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Order Number</th>
                        <th className="px-6 py-3.5">Amount</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">
                            {order.orderNumber || order._id}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-[#E8503A]">
                            Rs. {Number(order.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                order.status === "PAID" || order.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : order.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {order.status || "PAID"}
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
            <div className="max-w-2xl rounded-3xl border border-gray-200/80 bg-white p-7 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Shopper Account Profile</h3>
                <p className="text-xs text-gray-500">Your details registered on HitMeUp</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <p className="text-sm font-bold text-gray-900">{user?.name || "N/A"}</p>
                </div>

                <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <p className="text-sm font-bold text-gray-900">{user?.email || "N/A"}</p>
                </div>

                <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <p className="text-sm font-bold text-gray-900">{user?.phone || "+94 77 111 2233"}</p>
                </div>

                <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Account Role
                  </label>
                  <p className="text-sm font-bold uppercase text-[#E8503A]">{user?.role || "Customer"}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active & Verified Customer
                </p>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FULLSCREEN DIGITAL QR PASS MODAL (FOR SELLER SCANNING AT POS) */}
      {selectedVoucherForQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedVoucherForQR(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#E8503A] uppercase tracking-wider">
                <QrCode size={13} />
                Digital QR Voucher Pass
              </span>
              <button
                onClick={() => setSelectedVoucherForQR(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Deal Info */}
            <div className="space-y-1">
              <span className="rounded-full bg-orange-100/70 px-2.5 py-0.5 text-[10px] font-extrabold text-[#E8503A] uppercase tracking-wide">
                {selectedVoucherForQR.dealId?.category || "Flash Deal"}
              </span>
              <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                {selectedVoucherForQR.dealId?.title || "Exclusive Flash Promotion"}
              </h3>
            </div>

            {/* Large QR Code Display for Scanning */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/80 inline-block shadow-inner mx-auto">
              {selectedVoucherForQR.qrData ? (
                <img
                  src={selectedVoucherForQR.qrData}
                  alt={`QR code for ${selectedVoucherForQR.code}`}
                  className="h-44 w-44 mx-auto rounded-xl bg-white p-2 border border-gray-100 shadow-xs"
                />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center bg-gray-100 rounded-xl text-gray-400">
                  <QrCode size={48} />
                </div>
              )}
            </div>

            {/* Unique Code Copy Bar */}
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Unique Digital Voucher Code
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-black text-gray-900 tracking-wider bg-gray-100 px-3.5 py-1.5 rounded-xl border border-gray-200">
                  {selectedVoucherForQR.code}
                </span>
                <button
                  onClick={(e) => handleCopyCode(selectedVoucherForQR.code, e)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode === selectedVoucherForQR.code ? (
                    <Check size={18} className="text-emerald-600" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Status & Instructions */}
            <div className="pt-2 text-xs text-gray-500 leading-relaxed">
              <span
                className={`inline-block mb-1.5 rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                  selectedVoucherForQR.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : selectedVoucherForQR.status === "REDEEMED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Status: {selectedVoucherForQR.status}
              </span>
              <p className="text-[11px]">
                Present this screen to the store staff at checkout. They will scan or verify the code to apply your discount.
              </p>
            </div>

            <button
              onClick={() => setSelectedVoucherForQR(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-[#E8503A] transition cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Individual Voucher Card
const VoucherCard = ({ voucher, onShowQR, onCopyCode, copiedCode }) => {
  const deal = voucher.dealId || {};
  const isActive = voucher.status === "ACTIVE" && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date());
  const isRedeemed = voucher.status === "REDEEMED";
  const isExpired = voucher.status === "EXPIRED" || (voucher.expiresAt && new Date(voucher.expiresAt) < new Date() && !isRedeemed);

  return (
    <div
      onClick={onShowQR}
      className="group rounded-3xl border border-gray-200/90 bg-white p-5 shadow-xs hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div className="space-y-3">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600 uppercase tracking-wide">
            {deal.category || "Flash Deal"}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border flex items-center gap-1 ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isRedeemed
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
            {voucher.status}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1 group-hover:text-[#E8503A] transition-colors">
          {deal.title || "Flash Promotion"}
        </h4>

        {/* QR Thumbnail & Code Section */}
        <div className="p-3 rounded-2xl bg-gray-50/90 border border-gray-100 flex items-center gap-3">
          {voucher.qrData ? (
            <img
              src={voucher.qrData}
              alt="QR Code"
              className="h-14 w-14 rounded-lg bg-white p-1 border border-gray-200 shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
              <QrCode size={20} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Voucher Code
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-sm font-black text-gray-900 truncate">
                {voucher.code}
              </span>
              <button
                onClick={(e) => onCopyCode(voucher.code, e)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition cursor-pointer shrink-0"
                title="Copy Code"
              >
                {copiedCode === voucher.code ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Validity date */}
        <div className="text-[11px] text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span>
              {voucher.expiresAt ? `Valid till: ${new Date(voucher.expiresAt).toLocaleDateString()}` : "Limited Time"}
            </span>
          </span>
          {isRedeemed && voucher.redeemedAt && (
            <span className="text-[10px] text-blue-600 font-bold">
              Redeemed
            </span>
          )}
        </div>
      </div>

      {/* Card Action */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={onShowQR}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#FAF8F5] text-gray-800 hover:bg-[#E8503A] hover:text-white transition-all cursor-pointer border border-gray-200/80 hover:border-[#E8503A]"
        >
          <QrCode size={13} />
          <span>Show QR Pass at Store</span>
        </button>
      </div>
    </div>
  );
};

const SidebarBtn = ({ icon, label, badge = null, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      active
        ? "bg-[#E8503A]/10 text-[#E8503A]"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {badge !== null && (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
          active ? "bg-[#E8503A] text-white" : "bg-gray-200 text-gray-700"
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
    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      active ? "bg-[#E8503A] text-white" : "bg-gray-100 text-gray-700"
    }`}
  >
    {label}
  </button>
);

const EmptyState = ({ title, description, actionLabel, actionHref }) => (
  <div className="text-center py-10 space-y-3">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#E8503A]">
      <Ticket size={24} />
    </div>
    <h4 className="text-sm font-bold text-gray-900">{title}</h4>
    <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
      {description}
    </p>
    <Link
      to={actionHref}
      className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-bold text-white hover:bg-[#D43A26] transition shadow-xs mt-2"
    >
      <span>{actionLabel}</span>
      <ArrowRight size={13} />
    </Link>
  </div>
);

export default CustomerDashboard;