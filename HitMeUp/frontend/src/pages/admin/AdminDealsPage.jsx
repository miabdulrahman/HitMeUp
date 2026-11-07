import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, RotateCcw, XCircle, Building2 } from "lucide-react";
import { useAdmin } from "../../components/admin/AdminLayout";
import adminService from "../../services/adminService";
import {
  DataTable,
  SearchInput,
  SegmentedTabs,
  StatusBadge,
  DetailDrawer,
  DetailField,
  ConfirmationDialog,
  ErrorState,
  formatDate,
  formatLKR
} from "../../components/admin/AdminUI";

export default function AdminDealsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { demoMode, notify } = useAdmin();

  const [statusFilter, setStatusFilter] = useState("all");
  const [businessId, setBusinessId] = useState(
    () => searchParams.get("businessId") || "all"
  );
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [deals, setDeals] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    draft: 0,
    expired: 0,
    cancelled: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Deal Inspection Drawer
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [dealDetail, setDealDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel Deal Confirmation
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getDeals(
        {
          search,
          status: statusFilter,
          businessId,
          dateFrom,
          dateTo,
          sortBy,
          sortOrder,
          page,
          limit: 12
        },
        { demoMode }
      );
      setDeals(res.deals || []);
      setBusinesses(res.businesses || []);
      setCounts(
        res.counts || { all: 0, active: 0, draft: 0, expired: 0, cancelled: 0 }
      );
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to retrieve marketplace deals.");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    businessId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    page,
    demoMode
  ]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    if (!selectedDealId) {
      setDealDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    adminService
      .getDealById(selectedDealId, { demoMode })
      .then((res) => {
        if (active) setDealDetail(res.deal || null);
      })
      .catch((err) => {
        if (active) notify(err.message || "Failed to load deal details", "error");
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDealId, demoMode, notify]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleConfirmCancelDeal = async () => {
    if (!cancelTarget || processing) return;
    setProcessing(true);
    try {
      const res = await adminService.updateDealStatus(
        cancelTarget._id,
        "cancelled",
        cancelReason.trim(),
        { demoMode }
      );
      notify(res.message || `Cancelled deal "${cancelTarget.title}"`, "success");
      setCancelTarget(null);
      setCancelReason("");
      await loadDeals();
      if (selectedDealId === cancelTarget._id) {
        const updated = await adminService.getDealById(cancelTarget._id, {
          demoMode
        });
        setDealDetail(updated.deal || null);
      }
    } catch (err) {
      notify(err.message || "Failed to update deal status", "error");
    } finally {
      setProcessing(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setBusinessId("all");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setSearchParams({});
  };

  const hasFilters =
    statusFilter !== "all" ||
    businessId !== "all" ||
    search.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  const columns = [
    {
      key: "title",
      header: "Deal title",
      sortable: true,
      render: (row) => (
        <div className="max-w-[260px]">
          <div className="truncate font-medium text-[#111827]">{row.title}</div>
          <div className="text-[11px] text-[#6B7280]">{row.category || "General"}</div>
        </div>
      )
    },
    {
      key: "businessId",
      header: "Business",
      render: (row) => (
        <div>
          <div className="text-[#374151]">
            {row.businessId?.name || "Merchant"}
          </div>
          {row.businessId?.address?.city && (
            <div className="text-[11px] text-[#6B7280]">
              {row.businessId.address.city}
            </div>
          )}
        </div>
      )
    },
    {
      key: "originalPrice",
      header: "Original price",
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#6B7280] tabular-nums">
          {formatLKR(row.originalPrice)}
        </span>
      )
    },
    {
      key: "discountPercentage",
      header: "Discount",
      sortable: true,
      align: "right",
      render: (row) => (
        <span className="inline-flex rounded-[5px] bg-[#EFF6FF] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#1D4ED8] tabular-nums">
          -{row.discountPercentage}%
        </span>
      )
    },
    {
      key: "discountedPrice",
      header: "Deal price",
      sortable: true,
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] font-medium text-[#111827] tabular-nums">
          {formatLKR(row.discountedPrice)}
        </span>
      )
    },
    {
      key: "startDate",
      header: "Start date",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563] whitespace-nowrap tabular-nums">
          {formatDate(row.startDate)}
        </span>
      )
    },
    {
      key: "endDate",
      header: "End date",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563] whitespace-nowrap tabular-nums">
          {formatDate(row.endDate)}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
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
          onClick={() => setSelectedDealId(row._id)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
        >
          <Eye size={12} strokeWidth={1.5} />
          <span>Inspect</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#111827]">
          Deals overview
        </h2>
        <p className="mt-0.5 text-[13px] text-[#4B5563]">
          Administrative ledger of active, draft, expired, and cancelled flash deals across all merchants
        </p>
      </div>

      {/* Deal Status Tabs matching exact Deal model enum */}
      <SegmentedTabs
        activeTab={statusFilter}
        onChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        tabs={[
          { value: "all", label: "All deals", count: counts.all },
          { value: "active", label: "Active", count: counts.active },
          { value: "draft", label: "Draft", count: counts.draft },
          { value: "expired", label: "Expired", count: counts.expired },
          { value: "cancelled", label: "Cancelled", count: counts.cancelled }
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
          placeholder="Search deal title or category..."
          className="w-full xl:w-[300px]"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={businessId}
            onChange={(e) => {
              setBusinessId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by business"
            className="h-9 max-w-[220px] rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none cursor-pointer"
          >
            <option value="all">All businesses</option>
            {businesses.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <span>Start from</span>
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
        <ErrorState message={error} onRetry={loadDeals} />
      ) : (
        <DataTable
          columns={columns}
          rows={deals}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={(row) => setSelectedDealId(row._id)}
          emptyTitle="No deals match the active filter"
          emptyDescription="Adjust status, business, or date filters to view additional flash deals."
          onResetFilters={hasFilters ? resetFilters : undefined}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage
          }}
        />
      )}

      {/* Deal & Associated Business Inspection Drawer */}
      <DetailDrawer
        isOpen={!!selectedDealId}
        onClose={() => setSelectedDealId(null)}
        title={dealDetail?.title || "Deal inspection"}
        subtitle={
          dealDetail?._id ? `Deal ID: ${dealDetail._id}` : ""
        }
        badge={dealDetail && <StatusBadge status={dealDetail.status} />}
        footer={
          dealDetail && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              {dealDetail.businessId?._id ? (
                <button
                  type="button"
                  onClick={() => {
                    const name = dealDetail.businessId?.name || "";
                    setSelectedDealId(null);
                    navigate(`/admin/sellers?q=${encodeURIComponent(name)}`);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <Building2 size={14} strokeWidth={1.5} />
                  <span>Open seller directory</span>
                </button>
              ) : (
                <span />
              )}

              {dealDetail.status === "active" && (
                <button
                  type="button"
                  onClick={() => {
                    setCancelReason("");
                    setCancelTarget(dealDetail);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#FECACA] bg-white px-3.5 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  <XCircle size={14} strokeWidth={1.5} />
                  <span>Cancel deal</span>
                </button>
              )}
            </div>
          )
        }
      >
        {detailLoading || !dealDetail ? (
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
            <div className="h-36 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
          </div>
        ) : (
          <>
            {dealDetail.imageUrl && (
              <div className="overflow-hidden rounded-[8px] border border-[#E5E7EB]">
                <img
                  src={dealDetail.imageUrl}
                  alt={dealDetail.title}
                  className="h-44 w-full object-cover"
                />
              </div>
            )}

            {/* Pricing & Inventory Strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Deal price</div>
                <div className="mt-1 font-mono text-[16px] font-medium text-[#111827] tabular-nums">
                  {formatLKR(dealDetail.discountedPrice)}
                </div>
                <div className="font-mono text-[11px] text-[#6B7280] line-through tabular-nums">
                  {formatLKR(dealDetail.originalPrice)}
                </div>
              </div>

              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Discount</div>
                <div className="mt-1 font-mono text-[18px] font-medium text-[#1D4ED8] tabular-nums">
                  {dealDetail.discountPercentage}%
                </div>
              </div>

              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Claimed / stock</div>
                <div className="mt-1 font-mono text-[16px] font-medium text-[#111827] tabular-nums">
                  {dealDetail.claimedQuantity ?? 0} / {dealDetail.availableQuantity ?? 0}
                </div>
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Deal specifications
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Category" value={dealDetail.category} />
                <DetailField label="Status" value={dealDetail.status} mono />
                <DetailField
                  label="Start date"
                  value={formatDate(dealDetail.startDate, { includeTime: true })}
                  mono
                />
                <DetailField
                  label="End date"
                  value={formatDate(dealDetail.endDate, { includeTime: true })}
                  mono
                />
                <DetailField
                  label="Recorded orders"
                  value={String(dealDetail.ordersCount ?? 0)}
                  mono
                />
                <DetailField
                  label="Redeemed vouchers"
                  value={String(dealDetail.redeemedVouchers ?? 0)}
                  mono
                />
              </dl>
              <DetailField label="Description" value={dealDetail.description} />
              <DetailField label="Redemption terms" value={dealDetail.terms} />
            </section>

            {/* Associated Business */}
            <section className="space-y-3">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Associated business
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="Business name"
                  value={dealDetail.businessId?.name}
                />
                <DetailField
                  label="Business category"
                  value={dealDetail.businessId?.category}
                />
                <DetailField
                  label="Phone"
                  value={dealDetail.businessId?.phone}
                  mono
                />
                <DetailField
                  label="City"
                  value={dealDetail.businessId?.address?.city}
                />
              </dl>
            </section>
          </>
        )}
      </DetailDrawer>

      <ConfirmationDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancelDeal}
        title="Cancel active flash deal"
        entityName={cancelTarget?.title}
        description="Cancelling sets the deal status to cancelled and removes it from active public discovery."
        confirmLabel="Cancel deal"
        tone="danger"
        requireReason={false}
        processing={processing}
      />
    </div>
  );
}

