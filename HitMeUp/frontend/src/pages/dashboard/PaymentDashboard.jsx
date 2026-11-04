import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  Receipt,
  Store,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { paymentApi, gatewayApi } from "../../services/api";
import RefundDialog from "../../components/pay/RefundDialog";

export default function PaymentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0,
    totalVolume: 0,
    successRate: 0,
    currency: "LKR",
  });
  const [methodDistribution, setMethodDistribution] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Refund dialog state
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, txnsRes] = await Promise.all([
        paymentApi.getDashboardSummary().catch(() => ({ metrics: {}, methodDistribution: [], timeline: [] })),
        gatewayApi.getTransactions({
          page,
          limit: 10,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          method: methodFilter !== "ALL" ? methodFilter : undefined,
          search: search.trim() || undefined,
        }).catch(() => ({ transactions: [], totalPages: 1 })),
      ]);

      if (summaryRes.metrics) {
        setMetrics(summaryRes.metrics);
        setMethodDistribution(summaryRes.methodDistribution || []);
        setTimeline(summaryRes.timeline || []);
      }

      setTransactions(txnsRes.transactions || []);
      setTotalPages(txnsRes.totalPages || 1);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to load payment transactions");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter, search]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenRefund = (txn) => {
    // Reconstruct payment object from transaction
    const payment = {
      _id: txn.orderId?.paymentId || txn.paymentReference || txn.transactionId,
      paymentReference: txn.paymentReference,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.transactionStatus,
    };
    setSelectedPaymentForRefund(payment);
    setRefundOpen(true);
  };

  const handleRefundSuccess = () => {
    fetchDashboardData();
  };

  const isMerchantOrAdmin =
    user?.role === "seller" || user?.role === "business" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-16">
      {/* Top Header */}
      <header className="border-b border-neutral-200/80 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-neutral-800 hover:text-neutral-900"
            >
              <span className="text-lg font-bold tracking-tight text-[#111827]">
                HitMeUp <span className="text-[#E8503A]">Pay</span>
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                DASHBOARD
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 flex items-center space-x-1">
              <ShieldCheck size={14} />
              <span className="capitalize">{user?.role || "Customer"} View</span>
            </span>

            <button
              onClick={fetchDashboardData}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Title & Role Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
              Transactions & Revenue Analytics
            </h1>
            <p className="text-xs text-neutral-500">
              Live database aggregations for HitMeUp Pay simulated payments.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/customer/dashboard"
              className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50"
            >
              Customer Vouchers
            </Link>
            {isMerchantOrAdmin && (
              <Link
                to="/seller/dashboard"
                className="rounded-xl bg-[#E8503A] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#d4432f]"
              >
                Seller Dashboard
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* 4 Metric Cards (Aggregated in MongoDB) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Transactions */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Total Transactions</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-neutral-900">
              {metrics.totalTransactions || 0}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">
              All initiated payment sessions
            </div>
          </div>

          {/* Successful Payments */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Successful</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-700">
              {metrics.successfulTransactions || 0}
            </div>
            <div className="mt-1 flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
              <TrendingUp size={12} />
              <span>{metrics.successRate || 0}% Approval Rate</span>
            </div>
          </div>

          {/* Failed / Declined */}
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-800">Declined / Failed</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <XCircle size={16} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-red-600">
              {metrics.failedTransactions || 0}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">
              {metrics.pendingTransactions || 0} pending settlement
            </div>
          </div>

          {/* Total Revenue / Volume */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Gross Volume</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Store size={16} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-[#E8503A]">
              LKR {Number(metrics.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">
              Total successful deal purchases
            </div>
          </div>
        </div>

        {/* Charts Section: Timeline & Payment Method Distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Daily Revenue / Volume Timeline (Lightweight Pure SVG) */}
          <div className="lg:col-span-8 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Transaction Activity (Last 30 Days)
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Daily transaction count & settled revenue
                </p>
              </div>
              <span className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600">
                Live Data
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="flex h-44 items-center justify-center text-xs text-neutral-400">
                No recent activity in the last 30 days
              </div>
            ) : (
              <div className="mt-4">
                {/* SVG Bar Chart */}
                <div className="relative h-44 w-full">
                  <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
                    {(() => {
                      const maxVal = Math.max(...timeline.map((t) => t.total || 1), 5);
                      const barWidth = 100 / timeline.length;
                      return timeline.map((item, idx) => {
                        const heightPercent = ((item.total || 0) / maxVal) * 80;
                        const x = idx * barWidth;
                        return (
                          <g key={item.date || idx}>
                            <rect
                              x={`${x + barWidth * 0.15}%`}
                              y={`${100 - heightPercent}%`}
                              width={`${barWidth * 0.7}%`}
                              height={`${Math.max(4, heightPercent)}%`}
                              rx="3"
                              className="fill-[#E8503A] hover:fill-[#d4432f] transition-all cursor-pointer"
                            >
                              <title>{`${item.date}: ${item.total} transactions, LKR ${Number(item.revenue || 0).toLocaleString()}`}</title>
                            </rect>
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>{timeline[0]?.date || ""}</span>
                  <span>{timeline[timeline.length - 1]?.date || ""}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Distribution */}
          <div className="lg:col-span-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-sm font-bold text-neutral-900">Payment Methods</h3>
            <p className="text-[11px] text-neutral-400">Simulated share by channel</p>

            <div className="mt-5 space-y-4">
              {[
                { method: "CARD", label: "Credit / Debit Card", icon: CreditCard, color: "bg-[#E8503A]" },
                { method: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2, color: "bg-blue-600" },
                { method: "WALLET", label: "Mobile Wallet", icon: Smartphone, color: "bg-emerald-600" },
              ].map((m) => {
                const Icon = m.icon;
                const match = methodDistribution.find((d) => d.method === m.method);
                const count = match?.count || 0;
                const total = metrics.totalTransactions || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={m.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 font-medium text-neutral-700">
                        <Icon size={14} className="text-neutral-500" />
                        <span>{m.label}</span>
                      </div>
                      <span className="font-semibold text-neutral-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full ${m.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transactions Table & Filters */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Transaction History</h3>
              <p className="text-xs text-neutral-400">Detailed records stored in MongoDB</p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search ID / Merchant..."
                  className="w-44 sm:w-56 rounded-xl border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-[#E8503A] focus:outline-hidden"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-neutral-400" />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-neutral-200 bg-white py-1.5 px-2.5 text-xs font-medium text-neutral-700 focus:border-[#E8503A] focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success (00)</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending (09)</option>
              </select>

              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-neutral-200 bg-white py-1.5 px-2.5 text-xs font-medium text-neutral-700 focus:border-[#E8503A] focus:outline-hidden"
              >
                <option value="ALL">All Methods</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 text-[10px] uppercase font-bold">
                  <th className="pb-3 font-semibold">Transaction ID</th>
                  <th className="pb-3 font-semibold">Merchant / Deal</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-400">
                      No matching transactions found in database.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const isTxnSuccess = txn.transactionStatus === "SUCCESS";
                    const isTxnPending = txn.transactionStatus === "PENDING";
                    const isTxnFailed = txn.transactionStatus === "FAILED";

                    return (
                      <tr key={txn._id || txn.transactionId} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 font-mono font-medium text-neutral-900">
                          <Link
                            to={`/pay/result/${txn.transactionId}`}
                            className="hover:text-[#E8503A] underline decoration-neutral-300"
                          >
                            {txn.transactionId}
                          </Link>
                        </td>

                        <td className="py-3 max-w-[200px] truncate">
                          <div className="font-semibold text-neutral-800 truncate">
                            {txn.merchantName}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate">
                            {txn.orderId?.dealSnapshot?.title || "Voucher Deal"}
                          </div>
                        </td>

                        <td className="py-3">
                          <span className="font-medium text-neutral-700">
                            {txn.paymentMethod} {txn.cardLast4 ? `(•• ${txn.cardLast4})` : ""}
                          </span>
                        </td>

                        <td className="py-3 font-semibold text-neutral-900">
                          {txn.currency} {Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 text-neutral-500 whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3">
                          {isTxnSuccess && (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 size={11} />
                              <span>SUCCESS</span>
                            </span>
                          )}
                          {isTxnPending && (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              <Clock size={11} />
                              <span>PENDING</span>
                            </span>
                          )}
                          {isTxnFailed && (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              <XCircle size={11} />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 text-right space-x-2 whitespace-nowrap">
                          {isTxnSuccess && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(`/pay/receipt/${txn.paymentReference || txn.transactionId}`)}
                                className="inline-flex items-center space-x-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                                title="Print receipt"
                              >
                                <Receipt size={12} />
                                <span>Receipt</span>
                              </button>

                              {isMerchantOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRefund(txn)}
                                  className="inline-flex items-center space-x-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                                  title="Initiate simulated refund"
                                >
                                  <RotateCcw size={12} />
                                  <span>Refund</span>
                                </button>
                              )}
                            </>
                          )}

                          <Link
                            to={`/pay/result/${txn.transactionId}`}
                            className="inline-flex items-center text-neutral-400 hover:text-neutral-700"
                            title="View result page"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs">
              <span className="text-neutral-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Simulated Refund Dialog */}
      <RefundDialog
        payment={selectedPaymentForRefund}
        isOpen={refundOpen}
        onClose={() => setRefundOpen(false)}
        onRefundSuccess={handleRefundSuccess}
      />
    </div>
  );
}

