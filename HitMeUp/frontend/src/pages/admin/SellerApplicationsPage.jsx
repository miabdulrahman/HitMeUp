import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw
} from "lucide-react";
import { useAdmin } from "../../components/admin/AdminLayout";
import adminService from "../../services/adminService";
import {
  DataTable,
  SearchInput,
  SegmentedTabs,
  StatusBadge,
  ErrorState,
  ConfirmationDialog,
  formatDate
} from "../../components/admin/AdminUI";
import ApplicationDetailsDrawer from "../../components/admin/ApplicationDetailsDrawer";

const BUSINESS_CATEGORIES = [
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

export default function SellerApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { demoMode, refreshGlobalCounts, notify } = useAdmin();

  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all"
  );
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [category, setCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drawer & Quick Row Action Dialogs
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [quickDialog, setQuickDialog] = useState(null); // { mode: "approve"|"reject", app }
  const [rejectReason, setRejectReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Sync URL query params if navigated from global search or notification link
  useEffect(() => {
    const qParam = searchParams.get("q");
    const statusParam = searchParams.get("status");
    if (qParam !== null) setSearch(qParam);
    if (statusParam !== null) setStatusFilter(statusParam);
  }, [searchParams]);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getApplications(
        {
          search,
          status: statusFilter,
          category,
          dateFrom,
          dateTo,
          sortBy,
          sortOrder,
          page,
          limit: 10
        },
        { demoMode }
      );
      setApplications(res.applications || []);
      setCounts(
        res.counts || {
          all: 0,
          pending: 0,
          under_review: 0,
          approved: 0,
          rejected: 0
        }
      );
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load seller applications.");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    category,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    page,
    demoMode
  ]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
    setCategory("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setSearchParams({});
  };

  const handleQuickApprove = async () => {
    const app = quickDialog?.app;
    if (!app || processingId) return;
    setProcessingId(app._id);
    try {
      const res = await adminService.approveApplication(app._id, { demoMode });
      setQuickDialog(null);
      notify(
        res.message || `Seller application for "${app.name}" approved`,
        "success"
      );
      await loadApplications();
      refreshGlobalCounts();
    } catch (err) {
      notify(err.message || "Approval failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickReject = async () => {
    const app = quickDialog?.app;
    if (!app || processingId) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      setReasonError("Please provide a clear rejection reason (minimum 5 characters).");
      return;
    }
    setReasonError("");
    setProcessingId(app._id);
    try {
      const res = await adminService.rejectApplication(app._id, trimmed, {
        demoMode
      });
      setQuickDialog(null);
      setRejectReason("");
      notify(res.message || `Application for "${app.name}" rejected`, "success");
      await loadApplications();
      refreshGlobalCounts();
    } catch (err) {
      notify(err.message || "Rejection failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    search.trim() !== "" ||
    category !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const columns = [
    {
      key: "name",
      header: "Business name",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-[#111827]">{row.name}</div>
          <div className="text-[12px] text-[#6B7280]">
            {row.address?.city || "Colombo"}
          </div>
        </div>
      )
    },
    {
      key: "applicantName",
      header: "Applicant / owner",
      sortable: true,
      render: (row) => (
        <span className="text-[#374151]">
          {row.ownerId?.name || row.applicantName || "—"}
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
          {row.category || "Retail"}
        </span>
      )
    },
    {
      key: "createdAt",
      header: "Submitted date",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563] whitespace-nowrap tabular-nums">
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      key: "applicationStatus",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.applicationStatus} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      stopPropagation: true,
      render: (row) => {
        const isPendingOrReview =
          row.applicationStatus === "pending" ||
          row.applicationStatus === "under_review";
        const busy = processingId === row._id;

        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedApplication(row)}
              className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] cursor-pointer"
            >
              <Eye size={12} strokeWidth={1.5} />
              <span>Inspect</span>
            </button>

            {isPendingOrReview && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setQuickDialog({ mode: "approve", app: row })
                  }
                  title="Approve seller application"
                  className="inline-flex h-7 items-center gap-1 rounded-[6px] bg-[#059669] px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#047857] disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={12} strokeWidth={1.5} />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setRejectReason("");
                    setReasonError("");
                    setQuickDialog({ mode: "reject", app: row });
                  }}
                  title="Reject application with reason"
                  className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#FECACA] bg-white px-2.5 text-[12px] font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2] disabled:opacity-50 cursor-pointer"
                >
                  <XCircle size={12} strokeWidth={1.5} />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-5">
      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#111827]">
            Seller applications
          </h2>
          <p className="mt-0.5 text-[13px] text-[#4B5563]">
            Evaluate merchant registration requests, verify storefront contact details, and approve or reject onboarding
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          activeTab={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          tabs={[
            { value: "all", label: "All", count: counts.all },
            { value: "pending", label: "Pending", count: counts.pending },
            {
              value: "under_review",
              label: "Under review",
              count: counts.under_review
            },
            { value: "approved", label: "Approved", count: counts.approved },
            { value: "rejected", label: "Rejected", count: counts.rejected }
          ]}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-[#E5E7EB] bg-white p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search business name, applicant, email, or city..."
          className="w-full lg:w-[340px]"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by business category"
            className="h-9 rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none cursor-pointer"
          >
            <option value="all">All categories</option>
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
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
              aria-label="Submitted from date"
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
              aria-label="Submitted to date"
              className="h-9 rounded-[8px] border border-[#D1D5DB] bg-white px-2.5 font-mono text-[12px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          {hasActiveFilters && (
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
        <ErrorState message={error} onRetry={loadApplications} />
      ) : (
        <DataTable
          columns={columns}
          rows={applications}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={(row) => setSelectedApplication(row)}
          emptyTitle="No seller applications match your filters"
          emptyDescription="Adjust the application status tab, search query, or date window to view additional merchant applications."
          onResetFilters={hasActiveFilters ? resetFilters : undefined}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage
          }}
        />
      )}

      {/* Full Application Dossier Drawer */}
      <ApplicationDetailsDrawer
        applicationId={selectedApplication?._id}
        initialApplication={selectedApplication}
        isOpen={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
        demoMode={demoMode}
        notify={notify}
        onActionSuccess={() => {
          loadApplications();
          refreshGlobalCounts();
        }}
      />

      {/* Quick Approve Dialog */}
      <ConfirmationDialog
        isOpen={quickDialog?.mode === "approve"}
        onClose={() => setQuickDialog(null)}
        onConfirm={handleQuickApprove}
        title="Approve seller application"
        entityName={quickDialog?.app?.name}
        description="Confirming approval verifies this business profile and sets its marketplace storefront status to active."
        confirmLabel="Approve seller"
        tone="success"
        processing={!!processingId}
      />

      {/* Quick Reject Dialog */}
      <ConfirmationDialog
        isOpen={quickDialog?.mode === "reject"}
        onClose={() => {
          setQuickDialog(null);
          setReasonError("");
        }}
        onConfirm={handleQuickReject}
        title="Reject seller application"
        entityName={quickDialog?.app?.name}
        description="Provide the administrative reason for rejecting this seller registration. The application will be marked rejected and inactive."
        confirmLabel="Reject application"
        tone="danger"
        requireReason={true}
        reasonLabel="Rejection reason"
        reasonPlaceholder="Enter rejection reason (minimum 5 characters)..."
        reasonValue={rejectReason}
        onReasonChange={(val) => {
          setRejectReason(val);
          if (reasonError) setReasonError("");
        }}
        reasonError={reasonError}
        processing={!!processingId}
      />
    </div>
  );
}

