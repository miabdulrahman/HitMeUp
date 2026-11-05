import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Banknote,
  Eye,
  RotateCcw
} from "lucide-react";
import { useAdmin } from "../../components/admin/AdminLayout";
import adminService from "../../services/adminService";
import {
  StatCard,
  DataTable,
  SearchInput,
  SegmentedTabs,
  StatusBadge,
  DetailDrawer,
  DetailField,
  ErrorState,
  formatDate,
  formatLKR
} from "../../components/admin/AdminUI";

export default function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const { demoMode } = useAdmin();

  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    cancelledOrFailed: 0,
    grossPaidVolume: 0,
    currency: "LKR"
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getOrders(
        {
          search,
          status: statusFilter,
          paymentStatus,
          dateFrom,
          dateTo,
          page,
          limit: 12
        },
        { demoMode }
      );
      setOrders(res.orders || []);
      setSummary(
        res.summary || {
          totalOrders: 0,
          paidOrders: 0,
          pendingOrders: 0,
          cancelledOrFailed: 0,
          grossPaidVolume: 0,
          currency: "LKR"
        }
      );
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load marketplace orders.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentStatus, dateFrom, dateTo, page, demoMode]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const resetFilters = () => {
    setStatusFilter("all");
    setPaymentStatus("all");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters =
    statusFilter !== "all" ||
    paymentStatus !== "all" ||
    search.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  const columns = [
    {
      key: "orderNumber",
      header: "Order ID",
      render: (row) => (
        <span className="font-mono text-[12px] font-medium text-[#111827] whitespace-nowrap">
          {row.orderNumber}
        </span>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div>
          <div className="font-medium text-[#111827]">
            {row.customer?.name || "Customer"}
          </div>
          {row.customer?.email && (
            <div className="font-mono text-[11px] text-[#6B7280]">
              {row.customer.email}
            </div>
          )}
        </div>
      )
    },
    {
      key: "business",
      header: "Seller / business",
      render: (row) => (
        <span className="text-[#374151]">{row.business?.name || "Merchant"}</span>
      )
    },
    {
      key: "deal",
      header: "Deal",
      render: (row) => (
        <span className="block max-w-[220px] truncate text-[#374151]">
          {row.deal?.title || "—"}
        </span>
      )
    },
    {
      key: "createdAt",
      header: "Order date",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563] whitespace-nowrap tabular-nums">
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      key: "amount",
      header: "Total amount",
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] font-medium text-[#111827] whitespace-nowrap tabular-nums">
          {formatLKR(row.amount)}
        </span>
      )
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (row) => <StatusBadge status={row.paymentStatus} />
    },
    {
      key: "status",
      header: "Order status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      stopPropagation: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
        >
          <Eye size={12} strokeWidth={1.5} />
          <span>Details</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#111827]">
          Orders &amp; transactions
        </h2>
        <p className="mt-0.5 text-[13px] text-[#4B5563]">
          Read-only marketplace order ledger reflecting live Order and Payment records
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total orders"
          value={summary.totalOrders}
          subtitle="All recorded orders"
          icon={ShoppingBag}
          loading={loading}
        />
        <StatCard
          title="Settled orders"
          value={summary.paidOrders}
          subtitle="Paid or completed"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          title="Pending orders"
          value={summary.pendingOrders}
          subtitle="Awaiting settlement"
          icon={Clock}
          loading={loading}
        />
        <StatCard
          title="Paid volume (LKR)"
          value={formatLKR(summary.grossPaidVolume)}
          subtitle="Confirmed order total"
          icon={Banknote}
          loading={loading}
        />
      </div>

      {/* Order Status Tabs matching Order model enum */}
      <SegmentedTabs
        activeTab={statusFilter}
        onChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        tabs={[
          { value: "all", label: "All orders", count: summary.totalOrders },
          { value: "PAID", label: "Paid" },
          { value: "COMPLETED", label: "Completed" },
          { value: "PENDING", label: "Pending" },
          { value: "CANCELLED", label: "Cancelled" },
          { value: "FAILED", label: "Failed" }
        ]}
      />

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#E5E7EB] bg-white p-3.5 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search order ID, customer, seller, or deal..."
          className="w-full xl:w-[340px]"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by payment status"
            className="h-9 rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none cursor-pointer"
          >
            <option value="all">All payment states</option>
            <option value="SUCCESS">Paid (Success)</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <span>From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-[8px] border border-[#D1D5DB] bg-white px-2.5 font-mono text-[12px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <span>To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-[8px] border border-[#D1D5DB] bg-white px-2.5 font-mono text-[12px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
            >
              <RotateCcw size={13} strokeWidth={1.5} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadOrders} />
      ) : (
        <DataTable
          columns={columns}
          rows={orders}
          loading={loading}
          onRowClick={(row) => setSelectedOrder(row)}
          emptyTitle="No order records match your filters"
          emptyDescription="Adjust order status, payment status, or date window to view transaction records."
          onResetFilters={hasFilters ? resetFilters : undefined}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage
          }}
        />
      )}

      {/* Order Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder?.orderNumber || "Order record"}
        subtitle={
          selectedOrder
            ? `Placed ${formatDate(selectedOrder.createdAt, {
                includeTime: true
              })}`
            : ""
        }
        badge={selectedOrder && <StatusBadge status={selectedOrder.status} />}
      >
        {selectedOrder && (
          <>
            <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-4 flex items-center justify-between">
              <div>
                <div className="text-[12px] text-[#6B7280]">Transaction amount</div>
                <div className="mt-0.5 font-mono text-[22px] font-medium text-[#111827] tabular-nums">
                  {formatLKR(selectedOrder.amount)}
                </div>
              </div>
              <StatusBadge status={selectedOrder.paymentStatus} />
            </div>

            <section className="space-y-3">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Order &amp; payment metadata
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="Order number"
                  value={selectedOrder.orderNumber}
                  mono
                />
                <DetailField
                  label="Currency"
                  value={selectedOrder.currency || "LKR"}
                  mono
                />
                <DetailField
                  label="Payment provider"
                  value={selectedOrder.paymentProvider}
                  mono
                />
                <DetailField
                  label="Gateway transaction ID"
                  value={selectedOrder.transactionId}
                  mono
                />
                <DetailField
                  label="Paid timestamp"
                  value={
                    selectedOrder.paidAt
                      ? formatDate(selectedOrder.paidAt, { includeTime: true })
                      : ""
                  }
                  mono
                />
                <DetailField
                  label="Deal expiry"
                  value={
                    selectedOrder.expiresAt
                      ? formatDate(selectedOrder.expiresAt, { includeTime: true })
                      : ""
                  }
                  mono
                />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Parties &amp; item
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="Customer name"
                  value={selectedOrder.customer?.name}
                />
                <DetailField
                  label="Customer email"
                  value={selectedOrder.customer?.email}
                  mono
                />
                <DetailField
                  label="Merchant"
                  value={selectedOrder.business?.name}
                />
                <DetailField
                  label="Deal title"
                  value={selectedOrder.deal?.title}
                />
              </dl>
            </section>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}

