import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Store,
  ShoppingBag,
  Banknote,
  Tag,
  Ticket,
  RotateCcw,
  ArrowUpRight
} from "lucide-react";
import { useAdmin } from "../../components/admin/AdminLayout";
import adminService from "../../services/adminService";
import {
  StatCard,
  StatusBadge,
  ErrorState,
  formatDate,
  formatLKR
} from "../../components/admin/AdminUI";
import {
  RangeSelector,
  TimeSeriesChart,
  SegmentedDistribution,
  HorizontalBarList
} from "../../components/admin/AdminCharts";

export default function AdminAnalyticsPage() {
  const { demoMode } = useAdmin();
  const [range, setRange] = useState("30d");
  const [primaryMetric, setPrimaryMetric] = useState("revenue"); // "revenue" | "orders"
  const [registrationMetric, setRegistrationMetric] = useState("customers"); // "customers" | "sellers"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getAnalytics({ range, demoMode });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load platform analytics.");
    } finally {
      setLoading(false);
    }
  }, [range, demoMode]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = data?.summary || {};
  const timeSeries = data?.timeSeries || [];
  const funnel = data?.sellerFunnel || {};
  const categoryBreakdown = (data?.dealsByCategory || []).map((c) => ({
    label: c.category || "Uncategorized",
    value: c.count
  }));
  const topBusinesses = data?.topBusinesses || [];
  const topDeals = data?.topDeals || [];
  const voucherStats = data?.voucherStats || {
    totalIssued: 0,
    redeemed: 0,
    active: 0,
    expired: 0
  };

  const funnelSegments = [
    { label: "Approved", value: funnel.approved || 0, color: "#16A34A" },
    { label: "Pending", value: funnel.pending || 0, color: "#D97706" },
    { label: "Under Review", value: funnel.under_review || 0, color: "#2563EB" },
    { label: "Rejected", value: funnel.rejected || 0, color: "#DC2626" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#6B7280]">
            <span>ADMINISTRATION</span>
            <span>/</span>
            <span className="text-[#111827]">ANALYTICS &amp; GROWTH</span>
          </div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#111827]">
            Marketplace Analytics
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Monitored revenue velocity, order volumes, seller approval funnel, and voucher lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RangeSelector value={range} onChange={setRange} />

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB] cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Could not load analytics"
          message={error}
          onRetry={loadAnalytics}
        />
      ) : null}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Marketplace Revenue"
          value={formatLKR(summary.grossRevenue || 0)}
          icon={Banknote}
          hint={
            summary.paidOrders
              ? `${summary.paidOrders} settled orders`
              : "No settled orders in period"
          }
          loading={loading}
        />

        <StatCard
          label="Total Orders"
          value={summary.totalOrders || 0}
          icon={ShoppingBag}
          hint={
            summary.paidOrders
              ? `${summary.paidOrders} paid / ${summary.totalOrders - summary.paidOrders} pending`
              : "Awaiting order activity"
          }
          loading={loading}
        />

        <StatCard
          label="Total Customers"
          value={summary.totalCustomers || 0}
          icon={Users}
          hint={
            summary.newCustomersInRange !== undefined
              ? `+${summary.newCustomersInRange} joined in period`
              : "All registered shoppers"
          }
          loading={loading}
        />

        <StatCard
          label="Registered Sellers"
          value={summary.totalSellers || 0}
          icon={Store}
          hint={
            summary.newSellersInRange !== undefined
              ? `+${summary.newSellersInRange} applied in period`
              : "Storefront applicants"
          }
          loading={loading}
        />

        <StatCard
          label="Active Deals"
          value={summary.activeDeals || 0}
          icon={Tag}
          hint={`${summary.totalDeals || 0} total created`}
          loading={loading}
        />
      </div>

      {/* Row 1: Primary Time-Series + Seller Application Funnel */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Marketplace Performance Chart */}
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 lg:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-[14px] font-semibold text-[#111827]">
                Marketplace Performance
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Volume trends aggregated across the selected {range} window.
              </p>
            </div>

            <div className="inline-flex items-center rounded-[7px] border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
              <button
                type="button"
                onClick={() => setPrimaryMetric("revenue")}
                className={`rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  primaryMetric === "revenue"
                    ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Revenue (LKR)
              </button>
              <button
                type="button"
                onClick={() => setPrimaryMetric("orders")}
                className={`rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  primaryMetric === "orders"
                    ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Orders Count
              </button>
            </div>
          </div>

          <div className="pt-4">
            <TimeSeriesChart
              data={timeSeries}
              metric={primaryMetric}
              variant={primaryMetric === "orders" ? "bars" : "area"}
              height={230}
              formatValue={(val) =>
                primaryMetric === "revenue" ? formatLKR(val) : `${val} orders`
              }
            />
          </div>
        </div>

        {/* Seller Application Funnel */}
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div>
                <h2 className="text-[14px] font-semibold text-[#111827]">
                  Seller Application Funnel
                </h2>
                <p className="text-[12px] text-[#6B7280]">
                  Status distribution across all merchant onboarding requests.
                </p>
              </div>
              <Link
                to="/admin/applications"
                className="text-[12px] font-medium text-[#1D4ED8] hover:underline flex items-center gap-1"
              >
                <span>Review</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="pt-4">
              <SegmentedDistribution segments={funnelSegments} />
            </div>
          </div>

          <div className="mt-4 rounded-[8px] border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-[12px] text-[#4B5563]">
            <div className="flex items-center justify-between">
              <span>Approval Rate:</span>
              <span className="font-mono font-medium text-[#111827] tabular-nums">
                {funnel.total > 0
                  ? `${Math.round(((funnel.approved || 0) / funnel.total) * 100)}%`
                  : "N/A"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>Actionable Queue:</span>
              <span className="font-mono font-medium text-[#D97706] tabular-nums">
                {(funnel.pending || 0) + (funnel.under_review || 0)} awaiting review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: User Registrations Over Time + Category Breakdown + Voucher Lifecycle */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* User Registration Trends */}
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 lg:col-span-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-[14px] font-semibold text-[#111827]">
                New Registrations Over Time
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Customer signups and merchant application submissions.
              </p>
            </div>

            <div className="inline-flex items-center rounded-[7px] border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
              <button
                type="button"
                onClick={() => setRegistrationMetric("customers")}
                className={`rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  registrationMetric === "customers"
                    ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Shoppers
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMetric("sellers")}
                className={`rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  registrationMetric === "sellers"
                    ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Merchants
              </button>
            </div>
          </div>

          <div className="pt-4">
            <TimeSeriesChart
              data={timeSeries}
              metric={registrationMetric}
              variant="bars"
              height={200}
              formatValue={(val) =>
                `${val} ${registrationMetric === "customers" ? "shopper(s)" : "merchant(s)"}`
              }
            />
          </div>
        </div>

        {/* Category Breakdown & Voucher Stats */}
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div>
                <h2 className="text-[14px] font-semibold text-[#111827]">
                  Deals by Category
                </h2>
                <p className="text-[12px] text-[#6B7280]">
                  Published flash deal supply by merchant sector.
                </p>
              </div>
              <Link
                to="/admin/deals"
                className="text-[12px] font-medium text-[#1D4ED8] hover:underline"
              >
                All deals
              </Link>
            </div>

            <div className="pt-4">
              <HorizontalBarList
                items={categoryBreakdown}
                labelKey="label"
                valueKey="value"
                formatValue={(v) => `${v} deals`}
                emptyText="No deals categorized yet"
              />
            </div>
          </div>

          {/* Voucher Redemption Box */}
          <div className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3.5">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-[#374151]">
              <Ticket size={13} className="text-[#1D4ED8]" />
              <span>VOUCHER REDEMPTION LIFECYCLE</span>
            </div>
            <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-[6px] bg-white p-2 border border-[#E5E7EB]">
                <div className="font-mono text-[14px] font-semibold text-[#111827] tabular-nums">
                  {voucherStats.totalIssued || 0}
                </div>
                <div className="text-[11px] text-[#6B7280]">Issued</div>
              </div>
              <div className="rounded-[6px] bg-white p-2 border border-[#E5E7EB]">
                <div className="font-mono text-[14px] font-semibold text-[#16A34A] tabular-nums">
                  {voucherStats.redeemed || 0}
                </div>
                <div className="text-[11px] text-[#6B7280]">Redeemed</div>
              </div>
              <div className="rounded-[6px] bg-white p-2 border border-[#E5E7EB]">
                <div className="font-mono text-[14px] font-semibold text-[#D97706] tabular-nums">
                  {voucherStats.active || 0}
                </div>
                <div className="text-[11px] text-[#6B7280]">Active Pass</div>
              </div>
              <div className="rounded-[6px] bg-white p-2 border border-[#E5E7EB]">
                <div className="font-mono text-[14px] font-semibold text-[#9CA3AF] tabular-nums">
                  {voucherStats.expired || 0}
                </div>
                <div className="text-[11px] text-[#6B7280]">Expired</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Performing Businesses & Top Performing Deals */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Best Performing Businesses */}
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 lg:col-span-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-[14px] font-semibold text-[#111827]">
                Top Businesses by Volume
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Merchants generating highest settled orders and vouchers.
              </p>
            </div>
            <Link
              to="/admin/sellers"
              className="text-[12px] font-medium text-[#1D4ED8] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y divide-[#F3F4F6]">
            {topBusinesses.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#6B7280]">
                No recorded merchant sales yet.
              </div>
            ) : (
              topBusinesses.map((b, idx) => (
                <div
                  key={b._id || idx}
                  className="flex items-center justify-between py-3 text-[13px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] font-mono text-[11px] font-semibold text-[#6B7280]">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-[#111827] truncate">
                        {b.name}
                      </div>
                      <div className="text-[12px] text-[#6B7280]">
                        {b.category || "General"} · {b.activeDeals || 0} active deals
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="font-medium text-[#111827]">
                      {formatLKR(b.revenue || 0)}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {b.paidOrders || 0} paid ({b.claimedVouchers || 0} claimed)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing Deals */}
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 lg:col-span-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-[14px] font-semibold text-[#111827]">
                Top Deals by Orders
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Flash promotions with highest customer conversions.
              </p>
            </div>
            <Link
              to="/admin/deals"
              className="text-[12px] font-medium text-[#1D4ED8] hover:underline"
            >
              All deals
            </Link>
          </div>

          <div className="mt-3 divide-y divide-[#F3F4F6]">
            {topDeals.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#6B7280]">
                No recorded deal conversions yet.
              </div>
            ) : (
              topDeals.map((d, idx) => (
                <div
                  key={d._id || idx}
                  className="flex items-center justify-between py-3 text-[13px]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-[#111827] truncate">
                      {d.title}
                    </div>
                    <div className="text-[12px] text-[#6B7280] truncate">
                      {d.businessName || "Merchant"} · {d.discountPercentage}% off
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="font-medium text-[#111827]">
                      {formatLKR(d.discountedPrice || 0)}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {d.claimedQuantity || 0} passes claimed
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
