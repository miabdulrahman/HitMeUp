import { useState, useEffect, useCallback } from "react";
import { Eye, RotateCcw, UserX, UserCheck } from "lucide-react";
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

export default function CustomersPage() {
  const { demoMode, notify } = useAdmin();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    deactivated: 0,
    withOrders: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail Drawer
  const [selectedId, setSelectedId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Deactivate / Reactivate Dialog
  const [statusDialog, setStatusDialog] = useState(null); // { customer, nextActive }
  const [processing, setProcessing] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getCustomers(
        {
          search,
          status: statusFilter,
          sortBy,
          sortOrder,
          page,
          limit: 10
        },
        { demoMode }
      );
      setCustomers(res.customers || []);
      setSummary(
        res.summary || { total: 0, active: 0, deactivated: 0, withOrders: 0 }
      );
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to retrieve customer accounts.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, page, demoMode]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!selectedId) {
      setCustomerDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    adminService
      .getCustomerById(selectedId, { demoMode })
      .then((res) => {
        if (active) setCustomerDetail(res.customer || null);
      })
      .catch((err) => {
        if (active) notify(err.message || "Failed to load customer details", "error");
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, demoMode, notify]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusDialog?.customer || processing) return;
    setProcessing(true);
    try {
      await adminService.updateCustomerStatus(
        statusDialog.customer._id,
        statusDialog.nextActive,
        { demoMode }
      );
      notify(
        `Customer account "${statusDialog.customer.name}" ${
          statusDialog.nextActive ? "reactivated" : "deactivated"
        }`,
        "success"
      );
      setStatusDialog(null);
      await loadCustomers();
      if (selectedId === statusDialog.customer._id) {
        const updated = await adminService.getCustomerById(
          statusDialog.customer._id,
          { demoMode }
        );
        setCustomerDetail(updated.customer || null);
      }
    } catch (err) {
      notify(err.message || "Failed to update customer status", "error");
    } finally {
      setProcessing(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  };

  const hasFilters = statusFilter !== "all" || search.trim() !== "";

  const columns = [
    {
      key: "name",
      header: "Customer name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] font-mono text-[11px] font-medium text-[#374151]">
            {(row.name || "C")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <span className="font-medium text-[#111827]">{row.name}</span>
        </div>
      )
    },
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563]">{row.email}</span>
      )
    },
    {
      key: "createdAt",
      header: "Registration date",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4B5563] tabular-nums">
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      key: "orderCount",
      header: "Orders",
      sortable: true,
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#111827] tabular-nums">
          {row.orderCount ?? 0}
        </span>
      )
    },
    {
      key: "totalSpent",
      header: "Paid spend",
      sortable: true,
      align: "right",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#111827] tabular-nums">
          {formatLKR(row.totalSpent ?? 0)}
        </span>
      )
    },
    {
      key: "isActive",
      header: "Account status",
      render: (row) => (
        <StatusBadge status={row.isActive ? "active" : "deactivated"} />
      )
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      stopPropagation: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedId(row._id)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] cursor-pointer"
        >
          <Eye size={12} strokeWidth={1.5} />
          <span>View details</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#111827]">
          Customers
        </h2>
        <p className="mt-0.5 text-[13px] text-[#4B5563]">
          Monitor registered shopper accounts, voucher order counts, and account standing
        </p>
      </div>

      <SegmentedTabs
        activeTab={statusFilter}
        onChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        tabs={[
          { value: "all", label: "All customers", count: summary.total },
          { value: "active", label: "Active", count: summary.active },
          {
            value: "deactivated",
            label: "Deactivated",
            count: summary.deactivated
          }
        ]}
      />

      <div className="flex flex-col gap-3 rounded-[10px] border border-[#E5E7EB] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search customer by name or email..."
          className="w-full sm:w-[340px]"
        />

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadCustomers} />
      ) : (
        <DataTable
          columns={columns}
          rows={customers}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={(row) => setSelectedId(row._id)}
          emptyTitle="No customer accounts found"
          emptyDescription="No registered shoppers match the selected search or status filter."
          onResetFilters={hasFilters ? resetFilters : undefined}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage
          }}
        />
      )}

      {/* Safe Customer Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={customerDetail?.name || "Customer details"}
        subtitle={
          customerDetail
            ? `Registered ${formatDate(customerDetail.createdAt, {
                includeTime: true
              })}`
            : ""
        }
        badge={
          customerDetail && (
            <StatusBadge
              status={customerDetail.isActive ? "active" : "deactivated"}
            />
          )
        }
        footer={
          customerDetail && (
            <div className="flex items-center justify-end">
              {customerDetail.isActive ? (
                <button
                  type="button"
                  onClick={() =>
                    setStatusDialog({
                      customer: customerDetail,
                      nextActive: false
                    })
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#FECACA] bg-white px-3.5 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  <UserX size={14} strokeWidth={1.5} />
                  <span>Deactivate account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setStatusDialog({
                      customer: customerDetail,
                      nextActive: true
                    })
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#059669] px-3.5 text-[13px] font-medium text-white hover:bg-[#047857] cursor-pointer"
                >
                  <UserCheck size={14} strokeWidth={1.5} />
                  <span>Reactivate account</span>
                </button>
              )}
            </div>
          )
        }
      >
        {detailLoading || !customerDetail ? (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
            <div className="h-36 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Total orders</div>
                <div className="mt-1 font-mono text-[18px] font-medium text-[#111827] tabular-nums">
                  {customerDetail.orderCount ?? 0}
                </div>
              </div>
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Vouchers issued</div>
                <div className="mt-1 font-mono text-[18px] font-medium text-[#111827] tabular-nums">
                  {customerDetail.voucherCount ?? 0}
                </div>
              </div>
              <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <div className="text-[11px] text-[#6B7280]">Total paid</div>
                <div className="mt-1 font-mono text-[15px] font-medium text-[#111827] tabular-nums">
                  {formatLKR(customerDetail.totalSpent ?? 0)}
                </div>
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Account summary
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Full name" value={customerDetail.name} />
                <DetailField label="Email address" value={customerDetail.email} mono />
                <DetailField label="Role" value={customerDetail.role} mono />
                <DetailField
                  label="Joined"
                  value={formatDate(customerDetail.createdAt)}
                  mono
                />
              </dl>
            </section>

            <section className="space-y-2.5">
              <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                Recent orders ({customerDetail.recentOrders?.length || 0})
              </h3>
              {!customerDetail.recentOrders?.length ? (
                <p className="text-[12px] text-[#6B7280]">
                  No marketplace orders placed by this customer yet.
                </p>
              ) : (
                <ul className="divide-y divide-[#E5E7EB] rounded-[8px] border border-[#E5E7EB]">
                  {customerDetail.recentOrders.map((ord) => (
                    <li
                      key={ord._id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[12px]"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-[#6B7280]">
                          {ord.orderNumber}
                        </div>
                        <div className="truncate font-medium text-[#111827]">
                          {ord.dealId?.title || "Flash deal"}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B7280] tabular-nums">
                          {formatLKR(ord.amount)} · {formatDate(ord.createdAt)}
                        </div>
                      </div>
                      <StatusBadge status={ord.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </DetailDrawer>

      <ConfirmationDialog
        isOpen={!!statusDialog}
        onClose={() => setStatusDialog(null)}
        onConfirm={handleConfirmStatusChange}
        title={
          statusDialog?.nextActive
            ? "Reactivate customer account"
            : "Deactivate customer account"
        }
        entityName={statusDialog?.customer?.email}
        description={
          statusDialog?.nextActive
            ? "Reactivating this customer restores their sign-in access on HitMeUp."
            : "Deactivating this customer prevents future sign-ins until reactivated by an administrator."
        }
        confirmLabel={
          statusDialog?.nextActive ? "Reactivate account" : "Deactivate account"
        }
        tone={statusDialog?.nextActive ? "success" : "danger"}
        processing={processing}
      />
    </div>
  );
}

