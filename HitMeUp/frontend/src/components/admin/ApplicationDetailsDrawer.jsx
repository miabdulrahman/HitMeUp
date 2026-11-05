import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileWarning,
  Building2,
  User as UserIcon
} from "lucide-react";
import adminService from "../../services/adminService";
import {
  DetailDrawer,
  DetailField,
  StatusBadge,
  ConfirmationDialog,
  formatDate,
  formatRelativeTime
} from "./AdminUI";

export default function ApplicationDetailsDrawer({
  applicationId,
  initialApplication = null,
  isOpen,
  onClose,
  demoMode = false,
  onActionSuccess,
  notify
}) {
  const [detail, setDetail] = useState(initialApplication);
  const [loading, setLoading] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // "approve" | "reject" | null
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setDetail(initialApplication);
    if (!isOpen || !applicationId) return;

    let active = true;
    setLoading(true);
    adminService
      .getApplicationById(applicationId, { demoMode })
      .then((res) => {
        if (active && res?.application) {
          setDetail(res.application);
        }
      })
      .catch(() => {
        // Keep initialApplication row fallback if detail endpoint errors
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applicationId, isOpen, demoMode, initialApplication]);

  const handleMarkUnderReview = async () => {
    if (!detail?._id || processing) return;
    setProcessing(true);
    try {
      const res = await adminService.markApplicationUnderReview(detail._id, {
        demoMode
      });
      setDetail((prev) => ({
        ...prev,
        ...(res.application || {}),
        applicationStatus: "under_review"
      }));
      notify?.(res.message || "Marked application as under review", "info");
      onActionSuccess?.();
    } catch (err) {
      notify?.(err.message || "Failed to mark application under review", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!detail?._id || processing) return;
    setProcessing(true);
    try {
      const res = await adminService.approveApplication(detail._id, { demoMode });
      setDetail((prev) => ({
        ...prev,
        ...(res.application || {}),
        applicationStatus: "approved",
        isVerified: true,
        status: "active"
      }));
      setDialogMode(null);
      notify?.(
        res.message || `Approved seller application for "${detail.name}"`,
        "success"
      );
      onActionSuccess?.();
    } catch (err) {
      notify?.(err.message || "Failed to approve seller application", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!detail?._id || processing) return;
    const trimmed = rejectionReason.trim();
    if (trimmed.length < 5) {
      setReasonError("Please enter a specific reason of at least 5 characters.");
      return;
    }
    setReasonError("");
    setProcessing(true);
    try {
      const res = await adminService.rejectApplication(detail._id, trimmed, {
        demoMode
      });
      setDetail((prev) => ({
        ...prev,
        ...(res.application || {}),
        applicationStatus: "rejected",
        isVerified: false,
        status: "inactive",
        rejectionReason: trimmed
      }));
      setDialogMode(null);
      setRejectionReason("");
      notify?.(
        res.message || `Rejected seller application for "${detail.name}"`,
        "success"
      );
      onActionSuccess?.();
    } catch (err) {
      notify?.(err.message || "Failed to reject seller application", "error");
    } finally {
      setProcessing(false);
    }
  };

  const status = detail?.applicationStatus || "pending";
  const addressParts = [
    detail?.address?.street,
    detail?.address?.city,
    detail?.address?.state,
    detail?.address?.postalCode,
    detail?.address?.country
  ].filter(Boolean);

  const coords = detail?.location?.coordinates;
  const formattedCoords =
    Array.isArray(coords) && coords.length === 2
      ? `${Number(coords[1]).toFixed(4)}° N, ${Number(coords[0]).toFixed(4)}° E`
      : "";

  return (
    <>
      <DetailDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={detail?.name || "Seller application"}
        subtitle={
          detail?._id
            ? `Application ID: ${String(detail._id).slice(-8).toUpperCase()} · Submitted ${formatDate(
                detail.createdAt,
                { includeTime: true }
              )}`
            : ""
        }
        badge={<StatusBadge status={status} />}
        footer={
          detail && (
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                {status === "pending" && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleMarkUnderReview}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#D1D5DB] bg-white px-3 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] disabled:opacity-50 cursor-pointer"
                  >
                    <Clock size={14} strokeWidth={1.5} />
                    <span>Mark under review</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {status !== "rejected" && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => {
                      setReasonError("");
                      setRejectionReason(detail.rejectionReason || "");
                      setDialogMode("reject");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#FECACA] bg-white px-3.5 text-[13px] font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2] disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle size={15} strokeWidth={1.5} />
                    <span>Reject</span>
                  </button>
                )}

                {status !== "approved" && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => setDialogMode("approve")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#059669] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#047857] disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={15} strokeWidth={1.5} />
                    <span>Approve seller</span>
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {loading && !detail ? (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
            <div className="h-36 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
          </div>
        ) : detail ? (
          <>
            {/* Rejection notice if rejected */}
            {status === "rejected" && detail.rejectionReason && (
              <div className="rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-3.5">
                <div className="text-[12px] font-semibold text-[#991B1B]">
                  Recorded rejection reason
                </div>
                <p className="mt-1 text-[13px] text-[#7F1D1D]">
                  {detail.rejectionReason}
                </p>
                {detail.reviewedAt && (
                  <p className="mt-1.5 font-mono text-[11px] text-[#991B1B]/80">
                    Reviewed {formatDate(detail.reviewedAt, { includeTime: true })}
                    {detail.reviewedBy?.name ? ` by ${detail.reviewedBy.name}` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Approval notice if approved */}
            {status === "approved" && (
              <div className="rounded-[8px] border border-[#A7F3D0] bg-[#ECFDF5] p-3.5 text-[12px] text-[#065F46]">
                <span className="font-semibold">Verified marketplace seller.</span>{" "}
                Storefront is marked verified across public deal discovery
                {detail.reviewedAt
                  ? ` (approved ${formatDate(detail.reviewedAt, { includeTime: true })})`
                  : "."}
              </div>
            )}

            {/* Business Identity Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <Building2 size={15} strokeWidth={1.5} className="text-[#6B7280]" />
                <h3 className="text-[13px] font-semibold text-[#111827]">
                  Business profile
                </h3>
              </div>

              {(detail.logoUrl || detail.coverImageUrl) && (
                <div className="flex items-center gap-3 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  {detail.logoUrl && (
                    <img
                      src={detail.logoUrl}
                      alt={detail.name}
                      className="h-12 w-12 rounded-[8px] border border-[#E5E7EB] object-cover bg-white"
                    />
                  )}
                  <div className="text-[12px] text-[#4B5563]">
                    Storefront media assets uploaded via merchant profile
                  </div>
                </div>
              )}

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Business name" value={detail.name} />
                <DetailField label="Category" value={detail.category} />
                <DetailField label="Operating hours" value={detail.openingHours} />
                <DetailField
                  label="Published deals"
                  value={
                    detail.dealsCount !== undefined
                      ? `${detail.dealsCount} ${detail.dealsCount === 1 ? "deal" : "deals"}`
                      : "0 deals"
                  }
                  mono
                />
              </dl>

              <DetailField
                label="Business description"
                value={detail.description}
              />
            </section>

            {/* Owner & Contact Information */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <UserIcon size={15} strokeWidth={1.5} className="text-[#6B7280]" />
                <h3 className="text-[13px] font-semibold text-[#111827]">
                  Applicant & contact information
                </h3>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="Owner name"
                  value={detail.ownerId?.name || detail.applicantName}
                />
                <DetailField
                  label="Contact email"
                  value={detail.email || detail.ownerId?.email}
                  mono
                />
                <DetailField
                  label="Contact number"
                  value={detail.phone || detail.ownerId?.phone}
                  mono
                />
                <DetailField
                  label="Owner account registered"
                  value={formatDate(detail.ownerId?.createdAt || detail.createdAt)}
                  mono
                />
              </dl>
            </section>

            {/* Address & Geolocation */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <MapPin size={15} strokeWidth={1.5} className="text-[#6B7280]" />
                <h3 className="text-[13px] font-semibold text-[#111827]">
                  Storefront address & coordinates
                </h3>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="Street address"
                  value={addressParts.join(", ")}
                />
                <DetailField
                  label="GeoJSON coordinates"
                  value={formattedCoords}
                  mono
                />
              </dl>
            </section>

            {/* Verification Documents Availability Notice */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <FileWarning size={15} strokeWidth={1.5} className="text-[#6B7280]" />
                <h3 className="text-[13px] font-semibold text-[#111827]">
                  Verification documents
                </h3>
              </div>

              <div className="rounded-[8px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-3.5 text-[12px] text-[#4B5563]">
                Document file uploads are not stored in the current{" "}
                <code className="rounded bg-[#E5E7EB]/60 px-1 py-0.5 font-mono text-[11px] text-[#111827]">
                  Business
                </code>{" "}
                data model. Verify business registration using the merchant&apos;s
                contact telephone and street address prior to approval.
              </div>
            </section>

            {/* Audit History */}
            {Array.isArray(detail.auditHistory) && detail.auditHistory.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="border-b border-[#E5E7EB] pb-2 text-[13px] font-semibold text-[#111827]">
                  Administrative history
                </h3>
                <ul className="space-y-2">
                  {detail.auditHistory.map((item) => (
                    <li
                      key={item._id || item.id}
                      className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[12px]"
                    >
                      <div className="font-medium text-[#111827]">
                        {item.summary || item.description}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[#6B7280]">
                        {item.actorName || item.actor} ·{" "}
                        {formatRelativeTime(item.createdAt || item.timestamp)}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : null}
      </DetailDrawer>

      {/* Approve Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={dialogMode === "approve"}
        onClose={() => setDialogMode(null)}
        onConfirm={handleConfirmApprove}
        title="Approve seller application"
        entityName={detail?.name}
        description="Approving this application marks the business as verified and active on the HitMeUp marketplace, enabling full public deal discovery."
        confirmLabel="Approve seller"
        tone="success"
        processing={processing}
      />

      {/* Reject Confirmation Dialog (Requires Reason) */}
      <ConfirmationDialog
        isOpen={dialogMode === "reject"}
        onClose={() => {
          setDialogMode(null);
          setReasonError("");
        }}
        onConfirm={handleConfirmReject}
        title="Reject seller application"
        entityName={detail?.name}
        description="Rejecting this application sets the business profile to inactive and records the rejection reason in the platform audit log."
        confirmLabel="Reject application"
        tone="danger"
        requireReason={true}
        reasonLabel="Rejection reason"
        reasonPlaceholder="Specify why this application cannot be approved (e.g., unverifiable storefront address or incomplete business details)..."
        reasonValue={rejectionReason}
        onReasonChange={(val) => {
          setRejectionReason(val);
          if (reasonError) setReasonError("");
        }}
        reasonError={reasonError}
        processing={processing}
      />
    </>
  );
}

