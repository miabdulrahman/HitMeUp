import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  Store,
  ClipboardCheck,
  Tag,
  ShoppingBag,
  Banknote,
  ArrowRight,
  Eye,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useAdmin } from "../../components/admin/AdminLayout";
import adminService from "../../services/adminService";
import {
  StatCard,
  StatusBadge,
  ErrorState,
  EmptyState,
  formatLKR,
  formatDate,
  formatRelativeTime
} from "../../components/admin/AdminUI";
import {
  RangeSelector,
  TimeSeriesChart,
  SegmentedDistribution
} from "../../components/admin/AdminCharts";
import ApplicationDetailsDrawer from "../../components/admin/ApplicationDetailsDrawer";

function getTimeAwareGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { demoMode, refreshGlobalCounts, notify } = useAdmin();

  const [range, setRange] = useState("30d");
  const [chartMetric, setChartMetric] = useState("orders"); // "orders" | "revenue"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedApp, setSelectedApp] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getOverview({ range, demoMode });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load platform overview.");
    } finally {
      setLoading(false);
    }
  }, [range, demoMode]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const firstName = user?.name?.split(" ")[0] || "Admin";
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const kpis = data?.kpis;
  const appBreakdown = data?.charts?.applicationBreakdown || {
    approved: 0,
    pending: 0,
    under_review: 0,
    rejected: 0
  };
  const dealBreakdown = data?.charts?.dealBreakdown || {
    active: 0,
    draft: 0,
    expired: 0,
    cancelled: 0,
    totalClaimedVouchers: 0
  };

  return (
    <div className="space-y-6">
      {/* Operational Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[12px] text-[#6B7280]">{todayFormatted}</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#111827]">
            {getTimeAwareGreeting()}, {firstName}
          </h2>
          <p className="mt-0.5 text-[13px] text-[#4B5563]">
            Here&apos;s what&apos;s happening across the HitMeUp marketplace
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RangeSelector value={range} onChange={setRange} />
          <button
            type="button"
            onClick={() => {
              loadOverview();
              refreshGlobalCounts();
            }}
            disabled={loading}
            aria-label="Refresh overview"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              size={13}
              strokeWidth={1.5}
              className={loading ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadOverview} />
      ) : (
        <>
          {/* 6 KPI Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Pending seller applications"
              value={kpis?.pendingApplications?.value ?? 0}
              subtitle={
                kpis?.pendingApplications?.underReviewCount > 0
                  ? `${kpis.pendingApplications.underReviewCount} currently under review`
                  : "Awaiting verification review"
              }
              icon={ClipboardCheck}
              loading={loading}
              highlight={(kpis?.pendingApplications?.value ?? 0) > 0}
              actionLabel="Review queue"
              onAction={() => navigate("/admin/applications?status=pending")}
            />

            <StatCard
              title="Registered sellers"
              value={kpis?.registeredSellers?.value ?? 0}
              comparison={kpis?.registeredSellers?.comparison}
              subtitle={`${kpis?.registeredSellers?.approvedCount ?? 0} verified storefronts`}
              icon={Store}
              loading={loading}
            />

            <StatCard
              title="Total customers"
              value={kpis?.totalCustomers?.value ?? 0}
              comparison={kpis?.totalCustomers?.comparison}
              subtitle="Registered shopper accounts"
              icon={Users}
              loading={loading}
            />

            <StatCard
              title="Active deals"
              value={kpis?.activeDeals?.value ?? 0}
              subtitle={`${kpis?.activeDeals?.totalPublished ?? 0} total deals published`}
              icon={Tag}
              loading={loading}
              actionLabel="View deals"
              onAction={() => navigate("/admin/deals")}
            />

            <StatCard
              title="Total orders"
              value={kpis?.totalOrders?.value ?? 0}
              comparison={kpis?.totalOrders?.comparison}
              subtitle={`${kpis?.totalOrders?.paidCount ?? 0} paid or completed`}
              icon={ShoppingBag}
              loading={loading}
            />

            <StatCard
              title="Marketplace revenue (paid)"
              value={formatLKR(kpis?.marketplaceRevenue?.value ?? 0)}
              comparison={kpis?.marketplaceRevenue?.comparison}
              subtitle={`Across ${kpis?.marketplaceRevenue?.paidOrdersCount ?? 0} settled orders`}
              icon={Banknote}
              loading={loading}
            />
          </div>

          {/* Primary Analytics Row: Main Performance Chart (2/3) + Funnel & Lifecycle (1/3) */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            {/* Marketplace Performance Primary Chart */}
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 xl:col-span-8">
              <div className="flex flex-col justify-between gap-3 border-b border-[#E5E7EB] pb-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111827]">
                    Marketplace performance
                  </h3>
                  <p className="text-[12px] text-[#6B7280]">
                    Recorded orders and paid LKR transaction volume over the selected period
                  </p>
                </div>

                <div className="inline-flex rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] p-0.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartMetric("orders")}
                    className={`h-7 rounded-[6px] px-2.5 text-[12px] font-medium transition-colors cursor-pointer ${
                      chartMetric === "orders"
                        ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                        : "text-[#4B5563] hover:text-[#111827]"
                    }`}
                  >
                    Orders
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric("revenue")}
                    className={`h-7 rounded-[6px] px-2.5 text-[12px] font-medium transition-colors cursor-pointer ${
                      chartMetric === "revenue"
                        ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                        : "text-[#4B5563] hover:text-[#111827]"
                    }`}
                  >
                    Paid volume (LKR)
                  </button>
                </div>
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="h-[240px] w-full animate-pulse rounded-[8px] bg-[#F3F4F6]" />
                ) : (
                  <TimeSeriesChart
                    data={data?.charts?.timeSeries || []}
                    metric={chartMetric}
                    variant="area"
                    height={240}
                  />
                )}
              </div>
            </div>

            {/* Secondary Panels: Seller Growth & Deal Lifecycle */}
            <div className="flex flex-col gap-5 xl:col-span-4">
              {/* Seller Onboarding Funnel */}
              <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#111827]">
                      Seller onboarding status
                    </h3>
                    <p className="text-[12px] text-[#6B7280]">
                      Approved vs pending &amp; rejected applications
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="h-24 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
                ) : (
                  <SegmentedDistribution
                    segments={[
                      {
                        label: "Approved",
                        value: appBreakdown.approved,
                        color: "#10B981"
                      },
                      {
                        label: "Pending",
                        value: appBreakdown.pending,
                        color: "#F59E0B"
                      },
                      {
                        label: "Under review",
                        value: appBreakdown.under_review,
                        color: "#3B82F6"
                      },
                      {
                        label: "Rejected",
                        value: appBreakdown.rejected,
                        color: "#EF4444"
                      }
                    ]}
                  />
                )}
              </div>

              {/* Deal Lifecycle Summary */}
              <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#111827]">
                      Deal inventory status
                    </h3>
                    <p className="text-[12px] text-[#6B7280]">
                      {dealBreakdown.totalClaimedVouchers} vouchers claimed across all deals
                    </p>
                  </div>
                  <Link
                    to="/admin/deals"
                    className="text-[12px] font-medium text-[#1D4ED8] hover:underline"
                  >
                    Inspect
                  </Link>
                </div>

                {loading ? (
                  <div className="h-24 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
                ) : (
                  <SegmentedDistribution
                    segments={[
                      {
                        label: "Active",
                        value: dealBreakdown.active,
                        color: "#1D4ED8"
                      },
                      {
                        label: "Draft",
                        value: dealBreakdown.draft,
                        color: "#94A3B8"
                      },
                      {
                        label: "Expired",
                        value: dealBreakdown.expired,
                        color: "#CBD5E1"
                      },
                      {
                        label: "Cancelled",
                        value: dealBreakdown.cancelled,
                        color: "#F87171"
                      }
                    ]}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Operational Queues Row: Pending Applications Preview (7 cols) + Recent Activity (5 cols) */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            {/* Pending Seller Applications Preview */}
            <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white xl:col-span-7">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111827]">
                    Pending seller applications
                  </h3>
                  <p className="text-[12px] text-[#6B7280]">
                    Most recent merchant registrations awaiting verification
                  </p>
                </div>

                <Link
                  to="/admin/applications"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1D4ED8] hover:text-[#1E40AF] hover:underline"
                >
                  <span>View all applications</span>
                  <ArrowRight size={13} strokeWidth={1.5} />
                </Link>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded bg-[#F3F4F6]"
                    />
                  ))}
                </div>
              ) : !data?.pendingApplicationsPreview?.length ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No pending applications"
                  description="All submitted merchant applications have been reviewed."
                  actionLabel="Open applications log"
                  onAction={() => navigate("/admin/applications")}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[12px] font-medium text-[#4B5563]">
                        <th className="px-5 py-2.5">Business</th>
                        <th className="px-4 py-2.5">Applicant</th>
                        <th className="px-4 py-2.5">Submitted</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-5 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {data.pendingApplicationsPreview.map((app) => (
                        <tr
                          key={app._id}
                          className="hover:bg-[#F8FAFC] transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-[#111827]">
                              {app.name}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">
                              {app.category} · {app.city || "Colombo"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#374151]">
                            <div>{app.applicantName}</div>
                            {app.email && (
                              <div className="font-mono text-[11px] text-[#6B7280]">
                                {app.email}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-[12px] text-[#4B5563] whitespace-nowrap tabular-nums">
                            {formatDate(app.submittedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={app.applicationStatus} />
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedApp(app)}
                                className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
                              >
                                <Eye size={12} strokeWidth={1.5} />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedApp(app)}
                                className="inline-flex h-7 items-center rounded-[6px] bg-[#1D4ED8] px-2.5 text-[12px] font-medium text-white hover:bg-[#1E40AF] cursor-pointer"
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Platform Activity */}
            <div className="flex flex-col rounded-[10px] border border-[#E5E7EB] bg-white xl:col-span-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111827]">
                    Recent activity
                  </h3>
                  <p className="text-[12px] text-[#6B7280]">
                    Latest administrative actions and marketplace events
                  </p>
                </div>
                <Link
                  to="/admin/activity-logs"
                  className="text-[12px] font-medium text-[#1D4ED8] hover:underline"
                >
                  All logs
                </Link>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-11 animate-pulse rounded bg-[#F3F4F6]"
                    />
                  ))}
                </div>
              ) : !data?.recentActivity?.length ? (
                <EmptyState
                  title="No recent activity"
                  description="Marketplace and administrative events will appear here."
                />
              ) : (
                <ul className="divide-y divide-[#E5E7EB]">
                  {data.recentActivity.slice(0, 7).map((item) => (
                    <li key={item.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] text-[#111827] leading-snug">
                            {item.description}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6B7280]">
                            <span>{item.actor}</span>
                            <span>·</span>
                            <span
                              className={
                                item.source === "audit"
                                  ? "font-medium text-[#1D4ED8]"
                                  : "text-[#6B7280]"
                              }
                            >
                              {item.source === "audit" ? "Admin audit" : "Marketplace"}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-[#6B7280] tabular-nums">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Application Review Drawer from Overview */}
      <ApplicationDetailsDrawer
        applicationId={selectedApp?._id}
        initialApplication={selectedApp}
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        demoMode={demoMode}
        notify={notify}
        onActionSuccess={() => {
          loadOverview();
          refreshGlobalCounts();
        }}
      />
    </div>
  );
}

