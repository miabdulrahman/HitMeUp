import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Printer, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { paymentApi, gatewayApi } from "../../services/api";

export default function ReceiptPage() {
  const { paymentId } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReceipt = useCallback(async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      setError("");

      // Attempt to load receipt directly via payment ID
      try {
        const res = await paymentApi.getReceipt(paymentId);
        setReceipt(res.receipt || res.data);
        return;
      } catch {
        // Fallback: If parameter is a transactionId (e.g. HMP-...), fetch transaction then get receipt
        if (paymentId.startsWith("HMP-") || paymentId.startsWith("PAY-")) {
          const txnRes = await gatewayApi.getTransactionById(paymentId);
          const txn = txnRes.transaction || txnRes.data;
          if (txn) {
            setReceipt({
              receiptNumber: `REC-${txn.transactionId?.slice(-8) || "000000"}`,
              transactionId: txn.transactionId,
              orderId: txn.orderId,
              merchantName: txn.merchantName,
              dealTitle: txn.orderId?.dealSnapshot?.title || "Flash Deal Digital Voucher",
              amount: txn.amount,
              currency: txn.currency || "LKR",
              paymentMethod: txn.paymentMethod,
              cardBrand: txn.cardBrand,
              cardLast4: txn.cardLast4,
              paymentDate: txn.createdAt || new Date(),
              paymentStatus: txn.transactionStatus,
              verificationReference: txn.signature?.slice(0, 16) || "VER-VERIFIED",
            });
            return;
          }
        }
        throw new Error("Receipt could not be loaded");
      }
    } catch (err) {
      console.error("Receipt error:", err);
      setError(err.message || "Failed to load receipt");
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#E8503A] border-t-transparent" />
          <p className="mt-2 text-xs text-neutral-500">Generating receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-neutral-800">
            {error || "Receipt not available"}
          </p>
          <Link
            to="/customer/dashboard"
            className="mt-4 inline-block rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-semibold text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-xl">
        {/* Navigation / Print Toolbar (Hidden during print) */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            to="/customer/dashboard"
            className="flex items-center space-x-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 rounded-xl bg-[#111827] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* Printable Receipt Card */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 shadow-xs print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-[#111827]">
                  HitMeUp <span className="text-[#E8503A]">Pay</span>
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-600">
                  SIMULATED
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-500">Fast. Secure. Seamless.</p>
              <div className="mt-3 text-xs text-neutral-500">
                Official Transaction Receipt
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={13} />
                <span>PAID</span>
              </span>
              <div className="mt-2 text-xs font-mono font-semibold text-neutral-800">
                {receipt.receiptNumber}
              </div>
              <div className="text-[10px] text-neutral-400">
                {new Date(receipt.paymentDate).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                Merchant
              </span>
              <span className="font-semibold text-neutral-900 text-sm">
                {receipt.merchantName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                Transaction ID
              </span>
              <span className="font-mono text-neutral-800">
                {receipt.transactionId}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                Payment Method
              </span>
              <span className="font-medium text-neutral-800">
                {receipt.paymentMethod} {receipt.cardLast4 ? `(•••• ${receipt.cardLast4})` : ""}
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                Verification Reference
              </span>
              <span className="font-mono text-neutral-700 text-[11px]">
                {receipt.verificationReference}
              </span>
            </div>
          </div>

          {/* Purchased Item Table */}
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 text-[10px] uppercase font-bold text-left">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3 font-medium text-neutral-800">
                    {receipt.dealTitle}
                    <div className="text-[10px] text-neutral-400">Digital Flash Deal Voucher</div>
                  </td>
                  <td className="py-3 text-right font-semibold text-neutral-900">
                    {receipt.currency} {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 border-t border-neutral-200 pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal:</span>
              <span>{receipt.currency} {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Payment Fee (0%):</span>
              <span>LKR 0.00</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-100">
              <span>Total Paid:</span>
              <span className="text-base text-[#E8503A]">
                {receipt.currency} {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Educational Disclaimer Footer */}
          <div className="mt-8 rounded-xl bg-neutral-50 p-4 text-center text-[10px] text-neutral-500 leading-relaxed border border-neutral-100">
            <p className="font-semibold text-neutral-700">
              Simulated Educational Transaction
            </p>
            <p className="mt-0.5">
              This receipt was generated by HitMeUp Pay simulation platform for academic demonstration. No genuine currency was exchanged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

