import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Eye,
  Ban,
  PlayCircle,
  RotateCcw,
  Tag
} from "lucide-react";
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

const CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Retail",
  "Fashion",
  "Electronics",
  "Health & Beauty",
  "Salon",
  "Fitness",
  "Entertainment",
  "Groceries",
  "Other"
];

export default function SellersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { demoMode, notify } = useAdmin();

  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [sellers, setSellers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    verified: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Seller Detail Drawer
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [sellerDetail, setSellerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Suspension / Reactivation Confirmation
  const [actionDialog, setActionDialog] = useState(null); // { mode: "suspend"|"reactivate", seller }
  const [suspendReason, setSuspendReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadSellers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getSellers(
        {
          search,
          category,
          status: statusFilter,
          verification: verificationFilter,
          sortBy,
          sortOrder,
          page,
          limit: 10
        },
        { demoMode }
      );
      setSellers(res.sellers || []);
      setSummary(
        res.summary || { total: 0, active: 0, suspended: 0, verified: 0 }
      );
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to retrieve sellers.");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    category,
    statusFilter,
    verificationFilter,
    sortBy,
    sortOrder,
    page,
    demoMode
  ]);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  useEffect(() => {
    if (!selectedSellerId) {
      setSellerDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    adminService
      .getSellerById(selectedSellerId, { demoMode })
      .then((res) => {
        if (active) setSellerDetail(res.seller || null);
      })
      .catch((err) => {
        if (active) notify(err.message || "Failed to load seller profile", "error");
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedSellerId, demoMode, notify]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleConfirmSuspendOrReactivate = async () => {
    const target = actionDialog?.seller;
    if (!target || processing) return;

    if (actionDialog.mode === "suspend") {
      if (suspendReason.trim().length < 4) {
        setReasonError("Please enter a suspension reason (at least 4 characters).");
        return;
      }
    }

    setReasonError("");
    setProcessing(true);
    try {
      if (actionDialog.mode === "suspend") {
        const res = await adminService.suspendSeller(
          target._id,
          suspendReason.trim(),
          { demoMode }
        );
        notify(res.message || `Suspended "${target.name}"`, "success");
      } else {
        const res = await adminService.reactivateSeller(target._id, { demoMode });
        notify(res.message || `Reactivated "${target.name}"`, "success");
      }
      setActionDialog(null);
      setSuspendReason("");
      await loadSellers();
      if (selectedSellerId === target._id) {
        const updated = await adminService.getSellerById(target._id, { demoMode });
        setSellerDetail(updated.seller || null);
      }
    } catch (err) {
      notify(err.message || "Failed to update seller status", "error");
    } finally {
      setProcessing(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setVerificationFilter("all");
    setCategory("all");
    setSearch("");
    setPage(1);
  };

  const hasFilters =
    statusFilter !== "all" ||
    verificationFilter !== "all" ||
    category !== "all" ||
    search.trim() !== "";

  const columns = [
    {
      key: "name",
      header: "Business name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#111827]">{row.name}</span>
              {row.isVerified && (
                <StatusBadge status="verified" customLabel="Verified" />
              )}
            </div>
            <div className="text-[12px] text-[#6B7280]">
              {row.address?.city || "Colombo"}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "ownerName",
      header: "Owner",
      render: (row) => (
        <span className="text-[#374151]">
          {row.ownerId?.name || row.ownerName || "—"}
        </span>
      )
    },
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563]">
          {row.email || row.ownerId?.email || "—"}
        </span>
      )
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => (
        <span className="inline-flex rounded-[6px] border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[12px] text-[#374151]">
          {row.category}
        </span>
      )
    },
    {
      key: "createdAt",
      header: "Registered",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563] tabular-nums">
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      key: "totalDeals",
      header: "Total deals",
      sortable: true,
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#111827] tabular-nums">
          {row.totalDeals ?? 0}{" "}
          <span className="text-[#6B7280]">({row.activeDeals ?? 0} active)</span>
        </span>
      )
    },
    {
      key: "status",
      header: "Account status",
      render: (row) => (
        <StatusBadge
          status={row.status === "inactive" ? "suspended" : "active"}
        />
      )
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      stopPropagation: true,
      render: (row) => {
        const isSuspended = row.status === "inactive";
        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedSellerId(row._id)}
              className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
            >
              <Eye size={12} strokeWidth={1.5} />
              <span>Details</span>
            </button>

            {isSuspended ? (
              <button
                type="button"
                onClick={() =>
                  setActionDialog({ mode: "reactivate", seller: row })
                }
                className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 text-[12px] font-medium text-[#065F46] hover:bg-[#D1FAE5] cursor-pointer"
              >
                <PlayCircle size={12} strokeWidth={1.5} />
                <span>Reactivate</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSuspendReason("");
                  setReasonError("");
                  setActionDialog({ mode: "suspend", seller: row });
                }}
                className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#FECACA] bg-white px-2.5 text-[12px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
              >
                <Ban size={12} strokeWidth={1.5} />
                <span>Suspend</span>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#111827]">
          Registered sellers
        </h2>
        <p className="mt-0.5 text-[13px] text-[#4B5563]">
          Monitor active merchant storefronts, inspect published deals, and manage storefront account standing
        </p>
      </div>

      {/* Status Tabs */}
      <SegmentedTabs
        activeTab={statusFilter}
        onChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        tabs={[
          { value: "all", label: "All sellers", count: summary.total },
          { value: "active", label: "Active", count: summary.active },
          { value: "suspended", label: "Suspended", count: summary.suspended }
        ]}
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#E5E7EB] bg-white p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search business name, owner, email, or city..."
          className="w-full lg:w-[340px]"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
            className="h-9 rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none cursor-pointer"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by verification"
            className="h-9 rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none cursor-pointer"
          >
            <option value="all">All verification states</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified only</option>
          </select>

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
        <ErrorState message={error} onRetry={loadSellers} />
      ) : (
        <DataTable
          columns={columns}
          rows={sellers}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={(row) => setSelectedSellerId(row._id)}
          emptyTitle="No sellers match the selected criteria"
          emptyDescription="Clear active filters to inspect all registered businesses."
          onResetFilters={hasFilters ? resetFilters : undefined}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage
          }}
        />
      )}

      {/* Seller Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedSellerId}
        onClose={() => setSelectedSellerId(null)}
        title={sellerDetail?.name || "Seller details"}
        subtitle={
          sellerDetail
            ? `${sellerDetail.category} · Registered ${formatDate(
                sellerDetail.createdAt
              )}`
            : ""
        }
        badge={
          sellerDetail && (
            <StatusBadge
              status={sellerDetail.status === "inactive" ? "suspended" : "active"}
            />
          )
        }
        footer={
          sellerDetail && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = sellerDetail._id;
                  setSelectedSellerId(null);
                  navigate(`/admin/deals?businessId=${id}`);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
              >
                <Tag size={14} strokeWidth={1.5} />
                <span>Filter seller deals</span>
              </button>

              {sellerDetail.status === "inactive" ? (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({ mode: "reactivate", seller: sellerDetail })
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#059669] px-4 text-[13px] font-medium text-white hover:bg-[#047857] cursor-pointer"
                >
                  <PlayCircle size={15} strokeWidth={1.5} />
                  <span>Reactivate seller</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSuspendReason("");
                    setReasonError("");
                    setActionDialog({ mode: "suspend", seller: sellerDetail });
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#FECACA] bg-white px-4 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  <Ban size={15} strokeWidth={1.5} />
                  <span>Suspend seller</span>
                </button>
              )}
            </div>
          )
        }
      >
        {detailLoading || !sellerDetail ? (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
            <div className="h-40 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
          </div>
        ) : (
          <>
            {sellerDetail.status === "inactive" && sellerDetail.suspensionReason && (
              <div className="rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-3.5">
                <div className="text-[12px] font-semibold text-[#991B1B]">
                  Active suspension reason
                </div>
                <p className="mt-1 text-[13px] text-[#7F1D1D]">
                  {sellerDetail.suspensionReason}
                </p>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Total deals</div>
                <div className="mt-1 font-mono text-[18px] font-medium text-[#111827] tabular-nums">
                  {sellerDetail.metrics?.totalDeals ?? 0}
                </div>
              </div>
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Paid orders</div>
                <div className="mt-1 font-mono text-[18px] font-medium text-[#111827] tabular-nums">
                  {sellerDetail.metrics?.paidOrders ?? 0}
                </div>
              </div>
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Paid volume</div>
                <div className="mt-1 font-mono text-[15px] font-medium text-[#111827] tabular-nums">
                  {formatLKR(sellerDetail.metrics?.totalRevenue ?? 0)}
                </div>
              </div>
            </div>

            {/* Storefront Information */}
            <section className="space-y-3">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Storefront & owner profile
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="Owner"
                  value={sellerDetail.ownerId?.name}
                />
                <DetailField
                  label="Contact email"
                  value={sellerDetail.email || sellerDetail.ownerId?.email}
                  mono
                />
                <DetailField
                  label="Phone"
                  value={sellerDetail.phone || sellerDetail.ownerId?.phone}
                  mono
                />
                <DetailField
                  label="Verification"
                  value={sellerDetail.isVerified ? "Verified merchant" : "Unverified"}
                />
                <DetailField
                  label="City"
                  value={sellerDetail.address?.city}
                />
                <DetailField
                  label="Opening hours"
                  value={sellerDetail.openingHours}
                />
              </dl>
              <DetailField
                label="Description"
                value={sellerDetail.description}
              />
            </section>

            {/* Seller Deals List */}
            <section className="space-y-2.5">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Seller deals ({sellerDetail.deals?.length || 0})
              </h3>
              {!sellerDetail.deals?.length ? (
                <p className="text-[12px] text-[#6B7280]">
                  This seller has not published any flash deals yet.
                </p>
              ) : (
                <ul className="divide-y divide-[#E5E7EB] rounded-[8px] border border-[#E5E7EB]">
                  {sellerDetail.deals.slice(0, 8).map((deal) => (
                    <li
                      key={deal._id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[12px]"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#111827]">
                          {deal.title}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B7280] tabular-nums">
                          {formatLKR(deal.discountedPrice)} ({deal.discountPercentage}% off) · Ends{" "}
                          {formatDate(deal.endDate)}
                        </div>
                      </div>
                      <StatusBadge status={deal.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </DetailDrawer>

      {/* Suspend / Reactivate Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!actionDialog}
        onClose={() => {
          setActionDialog(null);
          setReasonError("");
        }}
        onConfirm={handleConfirmSuspendOrReactivate}
        title={
          actionDialog?.mode === "suspend"
            ? "Suspend seller storefront"
            : "Reactivate seller storefront"
        }
        entityName={actionDialog?.seller?.name}
        description={
          actionDialog?.mode === "suspend"
            ? "Suspending this seller marks their business profile inactive and hides the storefront from active merchant listings."
            : "Reactivating this seller restores their business profile to active standing on the marketplace."
        }
        confirmLabel={
          actionDialog?.mode === "suspend" ? "Suspend seller" : "Reactivate seller"
        }
        tone={actionDialog?.mode === "suspend" ? "danger" : "success"}
        requireReason={actionDialog?.mode === "suspend"}
        reasonLabel="Suspension reason"
        reasonPlaceholder="Specify policy or operational reason for suspending this seller..."
        reasonValue={suspendReason}
        onReasonChange={(val) => {
          setSuspendReason(val);
          if (reasonError) setReasonError("");
        }}
        reasonError={reasonError}
        processing={processing}
      />
    </div>
  );
}

