/* eslint-disable react-refresh/only-export-components */
import { useEffect } from "react";
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
  CheckCircle2,
  Info,
  RefreshCw
} from "lucide-react";

/**
 * Format LKR currency values consistently with tabular figures
 */
export const formatLKR = (amount) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "—";
  }
  return `Rs. ${Math.round(Number(amount)).toLocaleString("en-US")}`;
};

/**
 * Format timestamps consistently across tables and drawers
 */
export const formatDate = (value, { includeTime = false } = {}) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  if (includeTime) {
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

/**
 * Format concise relative time for activity feeds
 */
export const formatRelativeTime = (value) => {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diffMs)) return "—";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

/**
 * Restrained Enterprise Status Badge
 */
const STATUS_STYLES = {
  approved: {
    label: "Approved",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]"
  },
  active: {
    label: "Active",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]"
  },
  verified: {
    label: "Verified",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]"
  },
  paid: {
    label: "Paid",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]"
  },
  completed: {
    label: "Completed",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]"
  },
  success: {
    label: "Paid",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]"
  },
  redeemed: {
    label: "Redeemed",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    dot: "bg-[#10B981]"
  },
  pending: {
    label: "Pending",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    text: "text-[#92400E]",
    dot: "bg-[#F59E0B]"
  },
  unverified: {
    label: "Unverified",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    text: "text-[#92400E]",
    dot: "bg-[#F59E0B]"
  },
  draft: {
    label: "Draft",
    bg: "bg-[#F9FAFB]",
    border: "border-[#D1D5DB]",
    text: "text-[#374151]",
    dot: "bg-[#6B7280]"
  },
  under_review: {
    label: "Under review",
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
    text: "text-[#1E40AF]",
    dot: "bg-[#3B82F6]"
  },
  audit: {
    label: "Admin audit",
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
    text: "text-[#1E40AF]",
    dot: "bg-[#3B82F6]"
  },
  marketplace: {
    label: "Platform event",
    bg: "bg-[#F3F4F6]",
    border: "border-[#E5E7EB]",
    text: "text-[#4B5563]",
    dot: "bg-[#9CA3AF]"
  },
  rejected: {
    label: "Rejected",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#EF4444]"
  },
  suspended: {
    label: "Suspended",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#EF4444]"
  },
  inactive: {
    label: "Suspended",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#EF4444]"
  },
  deactivated: {
    label: "Deactivated",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#EF4444]"
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#EF4444]"
  },
  failed: {
    label: "Failed",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#EF4444]"
  },
  expired: {
    label: "Expired",
    bg: "bg-[#F3F4F6]",
    border: "border-[#E5E7EB]",
    text: "text-[#4B5563]",
    dot: "bg-[#9CA3AF]"
  },
  refunded: {
    label: "Refunded",
    bg: "bg-[#F3F4F6]",
    border: "border-[#E5E7EB]",
    text: "text-[#4B5563]",
    dot: "bg-[#9CA3AF]"
  }
};

export function StatusBadge({ status, customLabel }) {
  const key = String(status || "pending").toLowerCase();
  const cfg = STATUS_STYLES[key] || {
    label: String(status || "Unknown"),
    bg: "bg-[#F3F4F6]",
    border: "border-[#E5E7EB]",
    text: "text-[#4B5563]",
    dot: "bg-[#9CA3AF]"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[12px] font-medium leading-5 whitespace-nowrap ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      <span>{customLabel || cfg.label}</span>
    </span>
  );
}

/**
 * Operational KPI Stat Card
 */
export function StatCard({
  title,
  value,
  subtitle,
  comparison,
  icon: Icon,
  loading = false,
  unavailable = false,
  highlight = false,
  actionLabel,
  onAction
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-[10px] border bg-white p-5 transition-colors duration-150 ${
        highlight
          ? "border-[#BFDBFE] ring-1 ring-[#EFF6FF]"
          : "border-[#E5E7EB]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-[#4B5563]">{title}</span>
        {Icon && (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border ${
              highlight
                ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                : "border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]"
            }`}
          >
            <Icon size={15} strokeWidth={1.5} />
          </span>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-24 animate-pulse rounded bg-[#F3F4F6]" />
            <div className="h-3.5 w-32 animate-pulse rounded bg-[#F3F4F6]" />
          </div>
        ) : unavailable ? (
          <div>
            <div className="font-mono text-[22px] font-medium text-[#9CA3AF] tabular-nums">
              Unavailable
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">
              No transaction records reported
            </p>
          </div>
        ) : (
          <>
            <div className="font-mono text-[24px] font-medium tracking-[-0.02em] text-[#111827] tabular-nums">
              {value}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              {comparison?.label ? (
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    comparison.direction === "up"
                      ? "text-[#065F46]"
                      : comparison.direction === "down"
                      ? "text-[#991B1B]"
                      : "text-[#6B7280]"
                  }`}
                >
                  {comparison.label}
                </span>
              ) : subtitle ? (
                <span className="text-[#6B7280]">{subtitle}</span>
              ) : (
                <span className="text-[#9CA3AF]">Current cumulative total</span>
              )}

              {actionLabel && onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className="font-medium text-[#1D4ED8] hover:text-[#1E40AF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded cursor-pointer"
                >
                  {actionLabel} &rarr;
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Search Input Control
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={15}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3 text-[#6B7280]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-[8px] border border-[#D1D5DB] bg-white pl-9 pr-8 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] transition-colors focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 flex h-5 w-5 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] cursor-pointer"
        >
          <X size={13} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

/**
 * Segmented Filter Tabs with Tabular Counts
 */
export function SegmentedTabs({ tabs, activeTab, onChange }) {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap items-center gap-1 rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] p-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
              isActive
                ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                : "text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  isActive ? "text-[#1D4ED8]" : "text-[#6B7280]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Empty State Panel
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  description = "No matching entries were found for the active filter criteria.",
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <h3 className="mt-3 text-[14px] font-medium text-[#111827]">{title}</h3>
      <p className="mt-1 max-w-[42ch] text-[13px] text-[#6B7280]">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex h-8 items-center rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[12px] font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Error State Panel
 */
export function ErrorState({
  title = "Unable to load records",
  message = "An error occurred while communicating with the platform API.",
  onRetry
}) {
  return (
    <div
      role="alert"
      className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-5"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#991B1B]" />
        <div className="flex-1">
          <h3 className="text-[14px] font-medium text-[#991B1B]">{title}</h3>
          <p className="mt-1 text-[13px] text-[#7F1D1D]">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#FCA5A5] bg-white px-3 text-[12px] font-medium text-[#991B1B] transition-colors hover:bg-[#FEF2F2] cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.5} />
              <span>Retry request</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Enterprise DataTable with Sorting & Pagination
 */
export function DataTable({
  columns,
  rows,
  rowKey = "_id",
  loading = false,
  skeletonRows = 6,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  emptyTitle,
  emptyDescription,
  onResetFilters,
  pagination
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 text-[12px] font-medium text-[#4B5563] whitespace-nowrap ${
                      col.align === "right" ? "text-right" : "text-left"
                    } ${col.className || ""}`}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={`inline-flex items-center gap-1 rounded text-[#4B5563] hover:text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] cursor-pointer ${
                          col.align === "right" ? "ml-auto" : ""
                        }`}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortOrder === "asc" ? (
                            <ArrowUp size={13} strokeWidth={1.5} className="text-[#1D4ED8]" />
                          ) : (
                            <ArrowDown size={13} strokeWidth={1.5} className="text-[#1D4ED8]" />
                          )
                        ) : (
                          <ArrowUpDown size={13} strokeWidth={1.5} className="text-[#9CA3AF]" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E5E7EB] text-[13px] text-[#111827]">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, idx) => (
                <tr key={`sk-${idx}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-[#F3F4F6]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={onResetFilters ? "Reset filters" : undefined}
                    onAction={onResetFilters}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row[rowKey] || row.id || index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors duration-100 ${
                    onRowClick
                      ? "hover:bg-[#F8FAFC] cursor-pointer"
                      : "hover:bg-[#FAFAFA]"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-middle ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${col.cellClassName || ""}`}
                      onClick={col.stopPropagation ? (e) => e.stopPropagation() : undefined}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 sm:flex-row">
          <p className="font-mono text-[12px] text-[#6B7280] tabular-nums">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
            {pagination.total === 1 ? "record" : "records"}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Accessible Slide-over Detail Drawer
 */
export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  footer,
  children
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#111827]/35"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Record details"}
    >
      <div
        className="flex h-full w-full max-w-[560px] flex-col border-l border-[#E5E7EB] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[16px] font-semibold text-[#111827]">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-[12px] text-[#6B7280]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] cursor-pointer"
          >
            <X size={17} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Structured Key-Value Row for Detail Drawers
 */
export function DetailField({ label, value, mono = false }) {
  const isMissing =
    value === null || value === undefined || String(value).trim() === "";
  return (
    <div className="space-y-1">
      <dt className="text-[12px] font-medium text-[#6B7280]">{label}</dt>
      <dd
        className={`text-[13px] break-words ${
          isMissing
            ? "text-[#9CA3AF]"
            : mono
            ? "font-mono text-[#111827] tabular-nums"
            : "text-[#111827]"
        }`}
      >
        {isMissing ? "Not provided" : value}
      </dd>
    </div>
  );
}

/**
 * Accessible Confirmation & Reason Dialog
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  entityName,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary", // "primary" | "danger" | "success"
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Provide clear administrative context...",
  reasonValue = "",
  onReasonChange,
  reasonError = "",
  processing = false
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !processing) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, processing]);

  if (!isOpen) return null;

  const confirmStyles =
    tone === "danger"
      ? "bg-[#DC2626] hover:bg-[#B91C1C] text-white"
      : tone === "success"
      ? "bg-[#059669] hover:bg-[#047857] text-white"
      : "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/45 p-4"
      onClick={() => {
        if (!processing) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-[440px] rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[16px] font-semibold text-[#111827]">{title}</h3>

        {entityName && (
          <div className="mt-3 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[13px]">
            <span className="text-[#6B7280]">Target: </span>
            <span className="font-medium text-[#111827]">{entityName}</span>
          </div>
        )}

        <p className="mt-3 text-[13px] leading-relaxed text-[#4B5563]">
          {description}
        </p>

        {requireReason && (
          <div className="mt-4 space-y-1.5">
            <label className="block text-[12px] font-medium text-[#374151]">
              {reasonLabel} <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              rows={3}
              value={reasonValue}
              onChange={(e) => onReasonChange?.(e.target.value)}
              disabled={processing}
              placeholder={reasonPlaceholder}
              className="w-full rounded-[8px] border border-[#D1D5DB] bg-white px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
            />
            {reasonError && (
              <p className="text-[12px] text-[#DC2626]" role="alert">
                {reasonError}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-[8px] border border-[#D1D5DB] bg-white px-3.5 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={onConfirm}
            className={`inline-flex h-9 items-center gap-2 rounded-[8px] px-4 text-[13px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${confirmStyles}`}
          >
            {processing && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span>{processing ? "Processing..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Accessible Toast Notification Viewport
 */
export function ToastViewport({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 max-w-[380px] w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        const isInfo = toast.type === "info";
        return (
          <div
            key={toast.id}
            role={isError ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-[10px] border p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)] bg-white ${
              isError
                ? "border-[#FECACA]"
                : isInfo
                ? "border-[#BFDBFE]"
                : "border-[#A7F3D0]"
            }`}
          >
            {isError ? (
              <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#DC2626]" />
            ) : isInfo ? (
              <Info size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#1D4ED8]" />
            ) : (
              <CheckCircle2 size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#059669]" />
            )}
            <div className="flex-1 text-[13px] text-[#111827]">{toast.message}</div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

