import { useState } from "react";
import { AlertTriangle, RotateCcw, X, ShieldAlert } from "lucide-react";
import { paymentApi } from "../../services/api";

export default function RefundDialog({ payment, isOpen, onClose, onRefundSuccess }) {
  const [reason, setReason] = useState("Customer requested cancellation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await paymentApi.refundPayment(payment._id, reason);
      if (onRefundSuccess) onRefundSuccess(res);
      onClose();
    } catch (err) {
      console.error("Refund failed:", err);
      setError(err.message || "Failed to process refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <RotateCcw size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Initiate Simulated Refund
            </h3>
            <p className="text-xs text-neutral-500">
              Payment ref: {payment.paymentReference}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3.5 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Refund Amount:</span>
              <span className="font-bold text-neutral-900">
                LKR {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Status:</span>
              <span className="font-semibold text-emerald-700">Approved Payment</span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-900 leading-relaxed flex items-start space-x-2">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Voucher Policy:</strong> Executing this refund will immediately mark the customer&apos;s linked voucher as <strong>REFUNDED (VOID)</strong> and restore stock to the merchant&apos;s inventory. Already-redeemed vouchers cannot be refunded.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Refund Reason (Audit Log)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer return / item out of stock"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
              required
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Confirm Refund (Simulated)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

