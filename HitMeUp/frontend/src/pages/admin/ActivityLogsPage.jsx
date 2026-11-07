import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Activity,
  RotateCcw,
  Eye,
  Info
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
  ErrorState,
  formatDate,
  formatRelativeTime
} from "../../components/admin/AdminUI";

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "SELLER_APPROVED", label: "Seller Approved" },
  { value: "SELLER_REJECTED", label: "Seller Rejected" },
  { value: "SELLER_SUSPENDED", label: "Seller Suspended" },
  { value: "SELLER_REACTIVATED", label: "Seller Reactivated" },
  { value: "APPLICATION_UNDER_REVIEW", label: "Marked Under Review" },
  { value: "CUSTOMER_SUSPENDED", label: "Customer Deactivated" },
  { value: "CUSTOMER_ACTIVATED", label: "Customer Activated" },
  { value: "DEAL_STATUS_UPDATED", label: "Deal Status Changed" },
  { value: "SETTINGS_UPDATED", label: "Settings Updated" },
  { value: "SELLER_APPLICATION_SUBMITTED", label: "Seller Application Submitted" },
  { value: "DEAL_PUBLISHED", label: "Deal Published" },
  { value: "DEAL_EXPIRED", label: "Deal Expired" },
  { value: "ORDER_PLACED", label: "Order Placed" }
];

export default function ActivityLogsPage() {
  const { demoMode } = useAdmin();

  const [sourceFilter, setSourceFilter] = useState("all"); // "all" | "audit" | "marketplace"
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState([]);
  const [counts, setCounts] = useState({ auditCount: 0, marketplaceCount: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getActivityLogs(
        {
          search,
          source: sourceFilter,
          action: actionFilter,
          page,
          limit: 15
        },
        { demoMode }
      );
      setLogs(res.logs || []);
      setCounts(res.counts || { auditCount: 0, marketplaceCount: 0 });
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, actionFilter, page, demoMode]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const sourceTabs = [
    {
      id: "all",
      label: "All events",
      count: (counts.auditCount || 0) + (counts.marketplaceCount || 0)
    },
    {
      id: "audit",
      label: "Admin audit",
      count: counts.auditCount || 0
    },
    {
      id: "marketplace",
      label: "Platform events",
      count: counts.marketplaceCount || 0
    }
  ];

  const columns = [
    {
      header: "Timestamp",
      className: "w-[170px]",
      render: (log) => (
        <div>
          <div className="font-mono text-[12px] font-medium text-[#111827] tabular-nums">
            {formatDate(log.timestamp, { includeTime: true })}
          </div>
          <div className="text-[11px] text-[#6B7280]">
            {formatRelativeTime(log.timestamp)}
          </div>
        </div>
      )
    },
    {
      header: "Source",
      className: "w-[130px]",
      render: (log) => {
        const isAudit = log.source === "audit";
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${
              isAudit
                ? "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                : "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
            }`}
          >
            {isAudit ? <ShieldCheck size={11} /> : <Activity size={11} />}
            <span>{isAudit ? "Admin Audit" : "Marketplace"}</span>
          </span>
        );
      }
    },
    {
      header: "Action",
      className: "w-[170px]",
      render: (log) => (
        <span className="font-mono text-[11px] font-medium text-[#374151]">
          {log.action}
        </span>
      )
    },
    {
      header: "Actor",
      className: "w-[180px]",
      render: (log) => (
        <div className="min-w-0">
          <div className="font-medium text-[#111827] truncate">
            {log.actor || "System"}
          </div>
          {log.actorEmail && (
            <div className="font-mono text-[11px] text-[#6B7280] truncate">
              {log.actorEmail}
            </div>
          )}
        </div>
      )
    },
    {
      header: "Target / Description",
      render: (log) => (
        <div className="min-w-0">
          <p className="text-[13px] text-[#111827]">{log.description}</p>
          {log.targetName && (
            <p className="text-[11px] text-[#6B7280] font-mono">
              Target: {log.targetType || "entity"} · {log.targetName}
            </p>
          )}
          {log.metadata?.reason && (
            <p className="mt-0.5 text-[11px] text-[#B91C1C] italic">
              Reason: &ldquo;{log.metadata.reason}&rdquo;
            </p>
          )}
        </div>
      )
    },
    {
      header: "",
      className: "w-[70px] text-right",
      render: (log) => (
        <button
          type="button"
          onClick={() => setSelectedLog(log)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] cursor-pointer"
          title="Inspect log details"
        >
          <Eye size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#6B7280]">
            <span>ADMINISTRATION</span>
            <span>/</span>
            <span className="text-[#111827]">ACTIVITY LOGS</span>
          </div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#111827]">
            Audit Trail &amp; Events
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Immutable record of platform administrative interventions and key marketplace state events.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 self-start sm:self-auto rounded-[8px] border border-[#E5E7EB] bg-white px-3 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB] cursor-pointer disabled:opacity-50"
        >
          <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh logs</span>
        </button>
      </div>

      {/* Information Banner */}
      <div className="flex items-start gap-3 rounded-[8px] border border-[#DBEAFE] bg-[#EFF6FF] p-3 text-[12px] text-[#1E40AF]">
        <Info size={16} className="mt-0.5 shrink-0 text-[#2563EB]" />
        <div>
          <span className="font-semibold">Audit Accountability: </span>
          All approvals, rejections, suspensions, and configuration adjustments are persisted permanently with
          administrator identity, IP attribution, and timestamps for governance compliance.
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Could not load logs"
          message={error}
          onRetry={loadLogs}
        />
      ) : null}

      {/* Filter Toolbar */}
      <div className="space-y-3">
        <SegmentedTabs
          tabs={sourceTabs}
          activeTab={sourceFilter}
          onChange={(tab) => {
            setSourceFilter(tab);
            setPage(1);
          }}
        />

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search descriptions, actors, targets..."
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-[8px] border border-[#E5E7EB] bg-white px-2.5 text-[12px] text-[#374151] focus:border-[#1D4ED8] focus:outline-none cursor-pointer"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {(search || actionFilter !== "all" || sourceFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActionFilter("all");
                  setSourceFilter("all");
                  setPage(1);
                }}
                className="text-[12px] text-[#6B7280] hover:text-[#111827] underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        keyExtractor={(item) => item.id || item._id}
        emptyTitle="No log entries found"
        emptyDescription={
          search || actionFilter !== "all"
            ? "No events match the active filter criteria."
            : "No audit or platform events recorded yet."
        }
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* Log Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Detail"
        subtitle={`Event ID: ${selectedLog?.id || selectedLog?._id || "N/A"}`}
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Source</span>
                <span className="font-mono text-[11px] font-semibold text-[#111827] uppercase">
                  {selectedLog.source}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Action Code</span>
                <span className="font-mono text-[11px] font-medium text-[#1D4ED8]">
                  {selectedLog.action}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Recorded At</span>
                <span className="font-mono text-[12px] text-[#111827] tabular-nums">
                  {formatDate(selectedLog.timestamp, { includeTime: true })}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono text-[11px] font-medium uppercase text-[#6B7280]">
                Event Description
              </h3>
              <p className="rounded-[8px] border border-[#E5E7EB] bg-white p-3 text-[13px] text-[#111827] leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono text-[11px] font-medium uppercase text-[#6B7280]">
                Actor Attribution
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Actor Name" value={selectedLog.actor || "System"} />
                <DetailField label="Email" value={selectedLog.actorEmail || "N/A"} mono />
                <DetailField label="Actor ID" value={selectedLog.actorId || "System"} mono />
                <DetailField label="IP Address" value={selectedLog.ipAddress || "Internal"} mono />
              </div>
            </div>

            {selectedLog.targetType && (
              <div className="space-y-3">
                <h3 className="font-mono text-[11px] font-medium uppercase text-[#6B7280]">
                  Target Entity
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label="Target Type" value={selectedLog.targetType} />
                  <DetailField label="Target Name" value={selectedLog.targetName || "N/A"} />
                  <DetailField label="Target ID" value={selectedLog.targetId || "N/A"} mono />
                </div>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-mono text-[11px] font-medium uppercase text-[#6B7280]">
                  Structured Payload Metadata
                </h3>
                <pre className="max-h-60 overflow-auto rounded-[8px] border border-[#E5E7EB] bg-[#111318] p-3 font-mono text-[11px] text-[#E5E7EB]">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
